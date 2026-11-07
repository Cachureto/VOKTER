import { query } from '../../db/pool.js';
import { notFound } from '../../utils/httpError.js';
import { NOMBRES_MERCADO, ORDEN_MERCADOS } from './labels.js';
import { proveedorActivo } from './sync.service.js';

// Selecciones de un mercado como JSON, en el orden en que se muestran.
const SELECCIONES = `
  (SELECT COALESCE(json_agg(json_build_object(
      'id', s.id, 'code', s.code, 'label', s.label, 'odds', s.odds, 'result', s.result
    ) ORDER BY s.sort_order), '[]'::json)
     FROM f360_selections s WHERE s.market_id = mk.id)`;

const COLUMNAS_PARTIDO = `
  m.id, m.kickoff_at, m.status, m.status_detail, m.minute, m.round, m.venue,
  m.home_goals, m.away_goals, m.is_knockout, m.odds_source,
  l.id AS league_id, l.name AS league_name, l.kind AS league_kind,
  ht.id AS home_id, ht.name AS home_name, ht.short_name AS home_short, ht.logo_url AS home_logo,
  at.id AS away_id, at.name AS away_name, at.short_name AS away_short, at.logo_url AS away_logo`;

const JOINS = `
  FROM f360_matches m
  JOIN f360_leagues l ON l.id = m.league_id
  JOIN f360_teams ht ON ht.id = m.home_team_id
  JOIN f360_teams at ON at.id = m.away_team_id`;

const equipo = (r, lado) => ({
  id: r[`${lado}_id`],
  name: r[`${lado}_name`],
  shortName: r[`${lado}_short`] ?? r[`${lado}_name`].slice(0, 3).toUpperCase(),
  logoUrl: r[`${lado}_logo`],
});

const mercado = (mk) =>
  mk && {
    id: mk.id,
    type: mk.type,
    name: NOMBRES_MERCADO[mk.type],
    line: Number(mk.line),
    status: mk.status,
    selections: (mk.selections ?? []).map((s) => ({ ...s, odds: Number(s.odds) })),
  };

const partido = (r) => ({
  id: r.id,
  kickoffAt: r.kickoff_at,
  status: r.status,
  statusDetail: r.status_detail,
  minute: r.minute,
  round: r.round,
  venue: r.venue,
  isKnockout: r.is_knockout,
  oddsSource: r.odds_source,
  league: { id: r.league_id, name: r.league_name, kind: r.league_kind },
  home: equipo(r, 'home'),
  away: equipo(r, 'away'),
  score: r.home_goals == null ? null : { home: r.home_goals, away: r.away_goals },
});

export async function ligas() {
  const { rows } = await query(
    `SELECT l.id, l.name, l.country, l.kind, l.season,
            COUNT(m.id) FILTER (WHERE m.status IN ('scheduled', 'live') AND m.kickoff_at > now() - INTERVAL '3 hours') AS upcoming,
            COUNT(m.id) FILTER (WHERE m.status = 'live') AS live
       FROM f360_leagues l LEFT JOIN f360_matches m ON m.league_id = l.id
      WHERE l.provider = $1 AND l.featured
      GROUP BY l.id
      ORDER BY l.sort_order, l.name`,
    [proveedorActivo().nombre],
  );
  return rows.map((r) => ({ ...r, upcoming: Number(r.upcoming), live: Number(r.live) }));
}

const FILTROS = {
  upcoming: `m.status IN ('scheduled', 'live') AND (m.status = 'live' OR m.kickoff_at > now())`,
  live: `m.status = 'live'`,
  finished: `m.status IN ('finished', 'cancelled')`,
  all: 'true',
};

export async function partidos({ league, status, market, limit }) {
  const orden =
    status === 'finished' ? 'm.kickoff_at DESC' : `(m.status = 'live') DESC, m.kickoff_at ASC`;
  const params = [proveedorActivo().nombre, market, limit];
  if (league) params.push(league);
  const { rows } = await query(
    `SELECT ${COLUMNAS_PARTIDO},
            (SELECT json_build_object('id', mk.id, 'type', mk.type, 'line', mk.line, 'status', mk.status,
                                      'selections', ${SELECCIONES})
               FROM f360_markets mk
              WHERE mk.match_id = m.id AND mk.type = $2 AND ($2 <> 'ou' OR mk.line = 2.5)
              LIMIT 1) AS market,
            (SELECT COUNT(*) FROM f360_markets mk WHERE mk.match_id = m.id) AS markets_count
       ${JOINS}
      WHERE l.provider = $1 AND ${FILTROS[status]} ${league ? 'AND l.id = $4' : ''}
      ORDER BY ${orden}
      LIMIT $3`,
    params,
  );
  return rows.map((r) => ({ ...partido(r), market: mercado(r.market), marketsCount: Number(r.markets_count) }));
}

export async function detalle(id) {
  const { rows } = await query(`SELECT ${COLUMNAS_PARTIDO} ${JOINS} WHERE m.id = $1`, [id]);
  if (!rows[0]) throw notFound('Partido no encontrado');
  const { rows: mks } = await query(
    `SELECT mk.id, mk.type, mk.line, mk.status, ${SELECCIONES} AS selections
       FROM f360_markets mk WHERE mk.match_id = $1`,
    [id],
  );
  const mercados = mks
    .map(mercado)
    .sort((a, b) => ORDEN_MERCADOS.indexOf(a.type) - ORDEN_MERCADOS.indexOf(b.type) || a.line - b.line);
  return { ...partido(rows[0]), markets: mercados };
}
