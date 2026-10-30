import { normalizarOrigen } from './origen-api.mjs';

// Desde dónde se llama a la API:
//
// - En el navegador, contra el mismo dominio (cadena vacía = ruta relativa).
//   Next reenvía /api/* al backend con el rewrite de next.config.mjs, así la
//   cookie del refresh token sigue siendo same-site en producción.
// - En el servidor (Server Components) no existen las rutas relativas, así que
//   se usa el origen absoluto del backend.
//
// En local basta con NEXT_PUBLIC_API_URL=http://localhost:4000 y todo sigue
// yendo directo, igual que antes.
// `API_ORIGIN_COMPILADO` lo incrusta next.config.mjs al construir. Es el
// último recurso antes de localhost, para cuando el hosting no pasa variables
// al proceso en ejecución.
//
// Se normaliza igual que en next.config.mjs. Antes no se hacía, y como el
// rewrite sí normalizaba, una variable con una ruta pegada (por ejemplo la URL
// de /api/health) hacía que el navegador funcionara y el servidor no: pedía
// /api/health/api/products y recibía 404.
const SERVER_ORIGIN =
  normalizarOrigen(
    process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.API_ORIGIN_COMPILADO,
  ) ?? 'http://localhost:4000';
const BROWSER_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? '';

export const API_URL = typeof window === 'undefined' ? SERVER_ORIGIN : BROWSER_ORIGIN;

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Cliente único para Server Components (fetch directo al backend) y Client
// Components (con token y cookies de sesión). Nunca cachea: los datos de
// Vokter (stock, precio, waitlist) cambian a cada rato.
export async function apiFetch(path, { method = 'GET', body, token, withCredentials = false } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: withCredentials ? 'include' : 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con la API de Vokter. ¿Está corriendo el backend?');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Error ${res.status}`, data?.details);
  }
  return data;
}
