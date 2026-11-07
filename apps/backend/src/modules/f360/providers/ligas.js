/**
 * Ligas que conoce la app, por su ID en API-Football.
 *
 * El nombre que se muestra es el nuestro (el proveedor llama "Primera A" a la
 * Liga BetPlay). Cualquier otra liga que se agregue en F360_LIGAS funciona
 * igual, solo que con el nombre que traiga el proveedor.
 *
 * Revisa estos IDs en el panel de API-Football antes de producción: son los
 * conocidos, pero el proveedor es la fuente de verdad.
 */
export const LIGAS_CONOCIDAS = {
  239: { name: 'Liga BetPlay', country: 'Colombia', kind: 'league', sort: 1 },
  241: { name: 'Copa BetPlay', country: 'Colombia', kind: 'cup', sort: 2 },
  1: { name: (t) => `Mundial FIFA ${t}`, country: 'Mundo', kind: 'cup', neutral: true, sort: 3 },
  13: { name: 'Copa Libertadores', country: 'Sudamérica', kind: 'cup', sort: 4 },
  11: { name: 'Copa Sudamericana', country: 'Sudamérica', kind: 'cup', sort: 5 },
};

export function describirLiga(id, temporada, nombreDelProveedor) {
  const c = LIGAS_CONOCIDAS[id];
  const nombre = typeof c?.name === 'function' ? c.name(temporada) : c?.name;
  return {
    providerId: String(id),
    name: nombre ?? nombreDelProveedor ?? `Liga ${id}`,
    country: c?.country ?? null,
    kind: c?.kind ?? 'league',
    neutral: Boolean(c?.neutral),
    sort: c?.sort ?? 100,
    season: temporada,
  };
}

// Rondas de eliminación directa, en inglés (proveedor) y en español.
export const ES_ELIMINATORIA = /final|semi|quarter|round of|octavos|cuartos|dieciseisavos|play-?off|knockout|eliminatoria/i;
