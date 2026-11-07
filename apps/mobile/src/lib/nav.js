/** Destino tras entrar o registrarse: solo rutas internas de la app. */
export const destino = (next) => (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/');

/**
 * Después de entrar o registrarse se vuelve a la pantalla de antes en vez de
 * apilar otra copia: así el boleto o la billetera se ven ya con la cuenta y
 * "atrás" sigue teniendo sentido. `next` solo se usa si no hay a dónde volver
 * (por ejemplo, si se abrió el login desde un enlace).
 */
export function salirDelAcceso(router, next) {
  if (router.canGoBack()) router.back();
  else router.replace(destino(next));
}
