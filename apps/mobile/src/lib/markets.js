// Mercados de apuesta: nombre, descripción corta e ícono, como en la plantilla.
export const MERCADOS = {
  '1x2': { name: 'Ganador del partido', hint: '1X2 FPC e internacional', icon: 'football-outline', short: 'Ganador' },
  ou: { name: 'Más/Menos Goles', hint: 'Líneas 1.5 a 3.5', icon: 'bar-chart-outline', short: 'Más/Menos 2.5' },
  btts: { name: 'Ambos marcan', hint: 'Sí / No', icon: 'swap-horizontal-outline', short: 'Ambos marcan' },
  dc: { name: 'Doble oportunidad', hint: 'Cubre dos de tres resultados', icon: 'options-outline', short: 'Doble oportunidad' },
  qualify: { name: 'Clasifica', hint: 'Eliminatorias de copa', icon: 'ribbon-outline', short: 'Clasifica' },
  cs: { name: 'Marcador exacto', hint: 'Predicción completa', icon: 'calendar-number-outline', short: 'Marcador exacto' },
};

export const ORDEN_TARJETAS = ['1x2', 'ou', 'btts', 'dc', 'qualify', 'cs'];

/** Rótulo pequeño encima de la cuota en los botones (1 / X / 2, Más / Menos…). */
export function rotulo(type, code) {
  if (type === '1x2' || type === 'qualify') return code;
  if (type === 'ou') return code === 'over' ? 'Más' : 'Menos';
  if (type === 'btts') return code === 'yes' ? 'Sí' : 'No';
  if (type === 'dc') return code;
  if (type === 'cs') return code === 'otro' ? 'Otro' : code.replace(':', '-');
  return code;
}

/** Ícono y color de cada tipo de liga, como los círculos de la plantilla. */
export function estiloLiga(liga, colors) {
  if (!liga) return { icon: 'earth', fg: colors.muted, bg: colors.surface2 };
  if (/mundial/i.test(liga.name)) return { icon: 'football', fg: colors.accent, bg: colors.accentSoft };
  if (liga.kind === 'cup') return { icon: 'trophy', fg: colors.orange, bg: colors.orangeSoft };
  return { icon: 'shield-checkmark', fg: colors.teal, bg: colors.tealSoft };
}
