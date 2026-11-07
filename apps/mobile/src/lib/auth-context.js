import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, loadApiUrl, onSessionExpired } from './api';
import { clearTokens, getTokens, loadSession, saveTokens } from './session';

const AuthContext = createContext(null);

/**
 * Cuenta de Fanáticos 360 y su billetera.
 *
 * El saldo vive aquí porque se ve en muchas pantallas (inicio, boleto, menú) y
 * cambia por acciones de varias (apostar, depositar). `refreshWallet` lo trae
 * de nuevo después de cualquier movimiento.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!getTokens().accessToken) return null;
    try {
      const w = await apiFetch('/wallet', { auth: true });
      setWallet(w);
      return w;
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await apiFetch('/auth/me', { auth: true });
    setUser(data.user);
    return data.user;
  }, []);

  // Al abrir la app: si hay tokens guardados, se confirma la sesión con /me.
  useEffect(() => {
    let alive = true;
    (async () => {
      await loadApiUrl();
      await loadSession();
      if (getTokens().accessToken) {
        try {
          const data = await apiFetch('/auth/me', { auth: true });
          if (alive) {
            setUser(data.user);
            refreshWallet();
          }
        } catch (err) {
          // 401 = sesión vencida; un error de red no debe borrar los tokens.
          if (err.status === 401) await clearTokens();
        }
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [refreshWallet]);

  // Si el refresh token deja de servir en mitad del uso, se cierra la sesión.
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setWallet(null);
      }),
    [],
  );

  const start = useCallback(
    async (path, body) => {
      const data = await apiFetch(path, { method: 'POST', body });
      await saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      refreshWallet();
      return data.user;
    },
    [refreshWallet],
  );

  const login = useCallback((email, password) => start('/auth/login', { email, password }), [start]);
  const register = useCallback((form) => start('/auth/register', form), [start]);

  const logout = useCallback(async () => {
    const { refreshToken } = getTokens();
    try {
      if (refreshToken) await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken } });
    } catch {
      // Aunque el servidor no responda, la sesión local se cierra.
    }
    await clearTokens();
    setUser(null);
    setWallet(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      wallet,
      ready,
      // El usuario puede estar autoexcluido: entra, pero no apuesta ni deposita.
      selfExcluded: Boolean(user?.selfExcludedUntil && new Date(user.selfExcludedUntil) > new Date()),
      login,
      register,
      logout,
      refreshWallet,
      refreshUser,
      setUser,
    }),
    [user, wallet, ready, login, register, logout, refreshWallet, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
