import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { clearTokens, getTokens, saveTokens } from './session';

const DEFAULT_PORT = 4000; // backend Express
// Todas las rutas de Fanáticos 360 cuelgan de aquí en la API.
const PREFIJO = '/api/f360';

/**
 * Host desde el que Expo está sirviendo el bundle.
 * En el emulador y en un teléfono físico ese host es la IP del PC donde corre
 * Metro, que es el mismo PC donde corre el backend. Así la app encuentra la API
 * sola, sin tener que escribir la IP a mano en el .env.
 */
function hostFromExpo() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    '';
  const host = String(hostUri).split('/')[0].split(':')[0];
  return host || null;
}

function normalize(url) {
  const clean = String(url ?? '').trim();
  if (!clean) return null;
  const conProtocolo = /^https?:\/\//i.test(clean) ? clean : `http://${clean}`;
  try {
    // Solo el origen: si alguien pega la URL de /api/f360/estado, se queda con el dominio.
    return new URL(conProtocolo).origin;
  } catch {
    return null;
  }
}

/** URL por defecto: la horneada en el build, si no la IP detectada de Expo. */
export function detectApiUrl() {
  const fromEnv = normalize(process.env.EXPO_PUBLIC_API_URL);
  if (fromEnv) return fromEnv;
  const host = hostFromExpo();
  return `http://${host ?? 'localhost'}:${DEFAULT_PORT}`;
}

/** Los escudos llegan como URL completa del proveedor; el resto no tiene imagen. */
export function resolveImage(url) {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

// Override en memoria (la pantalla de Ajustes lo puede cambiar para probar otra IP).
let override = null;
export function setApiUrl(url) {
  override = normalize(url);
  return override;
}
export function getApiUrl() {
  return override ?? detectApiUrl();
}

// La URL elegida en Ajustes se guarda en el teléfono. Se lee una sola vez al
// cargar este módulo y toda petición espera esa lectura, así ninguna sale
// hacia la URL equivocada en el arranque.
const CLAVE_URL = 'f360.apiUrl';
const urlCargada = (async () => {
  try {
    const guardada = await SecureStore.getItemAsync(CLAVE_URL);
    if (guardada && !override) override = normalize(guardada);
  } catch {
    // Sin SecureStore (web) se usa la detectada.
  }
})();
export async function loadApiUrl() {
  await urlCargada;
  return getApiUrl();
}
export async function saveApiUrl(url) {
  const nueva = setApiUrl(url);
  try {
    if (nueva) await SecureStore.setItemAsync(CLAVE_URL, nueva);
    else await SecureStore.deleteItemAsync(CLAVE_URL);
  } catch {
    // Queda activa en memoria aunque no se pueda guardar.
  }
  return getApiUrl();
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  /** Primer mensaje de validación del backend, si lo hay. */
  get fieldMessage() {
    return Array.isArray(this.details) && this.details[0]?.message ? this.details[0].message : null;
  }
}

async function request(path, { method = 'GET', body, token, timeoutMs = 15000 } = {}) {
  await urlCargada;
  const base = getApiUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${base}${PREFIJO}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, `No se pudo conectar con ${base}`);
  } finally {
    clearTimeout(timer);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  return { ok: res.ok, status: res.status, data };
}

// Quien quiera enterarse de que la sesión murió (el contexto de cuenta).
const alExpirar = new Set();
export function onSessionExpired(fn) {
  alExpirar.add(fn);
  return () => alExpirar.delete(fn);
}

// Un solo refresh a la vez aunque varias peticiones reciban 401 al tiempo.
let refreshing = null;

async function refreshTokens() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { refreshToken } = getTokens();
    if (!refreshToken) return null;
    try {
      const { ok, data } = await request('/auth/refresh', { method: 'POST', body: { refreshToken } });
      if (!ok || !data?.accessToken) {
        await clearTokens();
        alExpirar.forEach((fn) => fn());
        return null;
      }
      await saveTokens(data.accessToken, data.refreshToken);
      return data;
    } catch {
      // Error de red: no borramos la sesión, puede ser temporal.
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/**
 * Cliente único de la app. Las rutas son relativas a /api/f360.
 * `auth: true` agrega el access token y, si el backend responde 401, lo renueva
 * con el refresh token y reintenta una vez.
 */
export async function apiFetch(path, { auth = false, ...options } = {}) {
  const token = auth ? getTokens().accessToken : options.token;
  let res = await request(path, { ...options, token });

  if (auth && res.status === 401) {
    const renewed = await refreshTokens();
    if (renewed?.accessToken) {
      res = await request(path, { ...options, token: renewed.accessToken });
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, res.data?.error ?? `Error ${res.status}`, res.data?.details);
  }
  return res.data;
}
