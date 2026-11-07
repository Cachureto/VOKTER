import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'f360.accessToken';
const REFRESH_KEY = 'f360.refreshToken';

// Copia en memoria para no leer SecureStore en cada petición.
let tokens = { accessToken: null, refreshToken: null };
let loaded = false;

export async function loadSession() {
  if (loaded) return tokens;
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    tokens = { accessToken: accessToken ?? null, refreshToken: refreshToken ?? null };
  } catch {
    tokens = { accessToken: null, refreshToken: null };
  }
  loaded = true;
  return tokens;
}

export function getTokens() {
  return tokens;
}

export async function saveTokens(accessToken, refreshToken) {
  tokens = { accessToken: accessToken ?? null, refreshToken: refreshToken ?? null };
  loaded = true;
  try {
    await Promise.all([
      accessToken
        ? SecureStore.setItemAsync(ACCESS_KEY, accessToken)
        : SecureStore.deleteItemAsync(ACCESS_KEY),
      refreshToken
        ? SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
        : SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  } catch {
    // Si SecureStore falla la sesión igual funciona hasta cerrar la app.
  }
}

export async function clearTokens() {
  tokens = { accessToken: null, refreshToken: null };
  loaded = true;
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  } catch {
    // ignorar
  }
}
