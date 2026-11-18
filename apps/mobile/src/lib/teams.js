/**
 * Colores de los equipos para las tarjetas partidas y las insignias.
 * Los clubes conocidos usan sus colores reales; el resto recibe uno fijo
 * calculado desde su nombre, así cada equipo se ve siempre igual.
 */
const CONOCIDOS = [
  [/nacional/i, '#0b8a4b'],
  [/millonarios/i, '#1d4ed8'],
  [/am[eé]rica/i, '#c8102e'],
  [/deportivo cali|^cali$/i, '#0f7a3a'],
  [/junior/i, '#d9232d'],
  [/santa fe/i, '#b91c1c'],
  [/medell[ií]n/i, '#c1121f'],
  [/once caldas/i, '#e5e7eb'],
  [/tolima/i, '#7a1f2b'],
  [/bucaramanga/i, '#f2c200'],
  [/pereira/i, '#e11d48'],
  [/pasto/i, '#b91c1c'],
  [/[aá]guilas/i, '#ea580c'],
  [/alianza/i, '#f59e0b'],
  [/magdalena/i, '#1e40af'],
  [/envigado/i, '#f97316'],
  [/equidad/i, '#16a34a'],
  [/llaneros/i, '#0ea5e9'],
  [/brasil/i, '#f2c200'],
  [/argentina/i, '#60a5fa'],
  [/colombia/i, '#f2c200'],
  [/uruguay/i, '#38bdf8'],
  [/inglaterra/i, '#e5e7eb'],
  [/francia/i, '#1e3a8a'],
  [/espa[ñn]a/i, '#c8102e'],
  [/portugal/i, '#9f1239'],
  [/alemania/i, '#374151'],
  [/marruecos/i, '#b91c1c'],
  [/pa[ií]ses bajos|holanda/i, '#f97316'],
  [/palmeiras/i, '#166534'],
  [/flamengo/i, '#b91c1c'],
  [/boca/i, '#1e3a8a'],
  [/river/i, '#e5e7eb'],
];

const PALETA = ['#0f766e', '#1d4ed8', '#be185d', '#6d28d9', '#c2410c', '#047857', '#b91c1c', '#0369a1', '#a16207'];

export function colorEquipo(nombre = '') {
  const hit = CONOCIDOS.find(([re]) => re.test(nombre));
  if (hit) return hit[1];
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}

/** Blanco o casi negro, el que se lea mejor sobre `hex`. */
export function textoSobre(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#0b0f15' : '#ffffff';
}

/** Nombre corto en mayúsculas para las tarjetas: "AMÉRICA", "CALI". */
export function nombreCorto(team) {
  const n = team.name.trim();
  const sin = n.replace(/^(atl[ée]tico|deportivo|dep\.|independiente|club|cd|fc)\s+/i, '');
  const palabras = sin.split(/\s+/);
  const base = sin.length <= 11 ? sin : palabras.length > 1 && palabras[0].length <= 3 ? palabras.slice(0, 2).join(' ') : palabras[0];
  return base.toUpperCase();
}

export function siglas(team) {
  if (team.shortName) return team.shortName.slice(0, 4).toUpperCase();
  return nombreCorto(team).slice(0, 4);
}

/** Probabilidad implícita (sin margen) de cada cuota de un mercado. */
export function probabilidades(selecciones) {
  const inv = selecciones.map((s) => 1 / (s.odds || 1));
  const total = inv.reduce((a, b) => a + b, 0) || 1;
  return inv.map((x) => x / total);
}
