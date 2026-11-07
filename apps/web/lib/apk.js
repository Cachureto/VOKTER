/**
 * Dónde está el APK de Fanáticos 360.
 *
 * Orden: APK_URL (se lee al ejecutar: cambiarla en el hosting y reiniciar
 * basta, sin volver a construir) → NEXT_PUBLIC_APK_URL (esta se congela en el
 * build) → la última versión publicada en GitHub Releases.
 *
 * Los enlaces de artefactos de EAS caducan; el de GitHub Releases
 * (`releases/latest/download/<archivo>`) siempre apunta a la última versión
 * publicada, así que el QR impreso no se rompe al sacar un APK nuevo.
 */
export const APK_POR_DEFECTO = 'https://github.com/Cachureto/VOKTER/releases/latest/download/fanaticos-360.apk';

export function urlDelApk() {
  const valor = (process.env.APK_URL || process.env.NEXT_PUBLIC_APK_URL || '').trim();
  return /^https?:\/\//i.test(valor) ? valor : APK_POR_DEFECTO;
}

/** Origen público de la web a partir de la petición (detrás del proxy del hosting). */
export function origenDe(h) {
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0].trim();
  if (!host) return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = (h.get('x-forwarded-proto') ?? (local ? 'http' : 'https')).split(',')[0].trim();
  return `${proto}://${host}`;
}
