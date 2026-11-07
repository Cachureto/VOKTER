/**
 * Sincronización con el proveedor de datos deportivos.
 *
 * No hay un proceso aparte ni un cron obligatorio: cada vez que la app pide
 * partidos se revisa si algún dato está viejo y, solo entonces, se consulta al
 * proveedor. Cada tipo de dato tiene su frecuencia (partidos cada 3 h, en vivo
 * cada 5 min solo si hay algo jugándose, cuotas cada 6 h, tabla una vez al día)
 * y todo pasa por un tope diario de consultas, porque el plan gratuito de
 * API-Football da 100 y pasarse deja la app sin datos hasta el día siguiente.
 *
 * Si el proveedor falla, la app sigue sirviendo lo último que guardó.
 */
import { env } from '../../config/env.js';
import { query, withTransaction } from '../../db/pool.js';
import { liquidarPendientes } from './bets.service.js';
import { etiqueta } from './labels.js';
import { cuotasDelModelo, fuerzasDesdeTabla, golesEsperados } from './pricing.js';
import { crearApiFootball, ErrorProveedor } from './providers/apiFootball.js';
import { demo } from './providers/demo.js';

const LIGAS = env.F360_LIGAS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Tiempo máximo que una petición de la app espera a la sincronización.
const PLAZO_MS = 8000;

async function contarConsulta() {
  const { rows } = await query(
    `INSERT INTO f360_api_usage (day, requests) VALUES ((now() AT TIME ZONE 'America/Bogota')::date, 1)
     ON CONFLICT (day) DO UPDATE SET requests = f360_api_usage.requests + 1
       WHERE f360_api_usage.requests < $1
     RETURNING requests`,
    [env.F360_API_PRESUPUESTO_DIARIO],
  );
  if (!rows[0]) {
    throw new ErrorProveedor(
      `Se alcanzó el tope de ${env.F360_API_PRESUPUESTO_DIARIO} consultas de hoy. Se reanuda mañana.`,
    );
  }
}

let apiFootball;
export function proveedorActivo() {
  const usarDemo = env.F360_PROVEEDOR === 'demo' || (env.F360_PROVEEDOR === 'auto' && !env.API_FOOTBALL_KEY);
  if (usarDemo || !env.API_FOOTBALL_KEY) return demo;
  apiFootball ??= crearApiFootball({ contarConsulta });
  return apiFootball;
}

// ---------------------------------------------------------------------
// Estado de cada paso
// ---------------------------------------------------------------------

async function vencido(clave, minutos) {
  const { rows } = await query('SELECT synced_at FROM f360_sync_state WHERE key = $1', [clave]);
  return !rows[0] || Date.now() - new Date(rows[0].synced_at).getTime() > minutos * 60_000;
}

async function marcar(clave, ok, detalle = null) {
  await query(
    `INSERT INTO f360_sync_state (key, synced_at, ok, detail) VALUES ($1, now(), $2, $3)
     ON CONFLICT (key) DO UPDATE SET synced_at = now(), ok = EXCLUDED.ok, detail = EXCLUDED.detail`,
    [clave, ok, detalle],
  );
}

/**
 * Turno de sincronización. Una fila con caducidad en vez de un advisory lock
 * de PostgreSQL: el pooler de Neon trabaja por transacción y un lock de sesión
 * podría tomarse en una conexión y liberarse en otra, y quedarse pegado.
 * Si una instancia muere a mitad, el turno caduca solo a los 90 segundos.
 */
async function tomarTurno() {
  const { rows } = await query(
    `INSERT INTO f360_sync_state (key, synced_at, ok) VALUES ('turno', now(), true)
     ON CONFLICT (key) DO UPDATE SET synced_at = now()
       WHERE f360_sync_state.synced_at < now() - INTERVAL '90 seconds'
     RETURNING key`,
  );
  return rows.length > 0;
}

const soltarTurno = () =>
  query(`UPDATE f360_sync_state SET synced_at = now() - INTERVAL '1 hour' WHERE key = 'turno'`);

// ---------------------------------------------------------------------
// Guardado
// ---------------------------------------------------------------------

async function guardarLigas(prov) {
  const mapa = new Map();
  for (const l of prov.ligas(LIGAS, env.F360_TEMPORADA)) {
    const { rows } = await query(
      `INSERT INTO f360_leagues (provider, provider_id, name, country, season, kind, neutral_venue, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (provider, provider_id) DO UPDATE
         SET name = EXCLUDED.name, country = EXCLUDED.country, season = EXCLUDED.season,
             kind = EXCLUDED.kind, neutral_venue = EXCLUDED.neutral_venue, sort_order = EXCLUDED.sort_order
       RETURNING id`,
      [prov.nombre, l.providerId, l.name, l.country, l.season, l.kind, l.neutral, l.sort],
    );
    mapa.set(l.providerId, rows[0].id);
  }
  return mapa;
}

async function guardarEquipos(proveedor, equipos) {
  const unicos = [...new Map(equipos.map((e) => [e.providerId, e])).values()];
  if (unicos.length === 0) return new Map();
  const { rows } = await query(
    `INSERT INTO f360_teams (provider, provider_id, name, short_name, logo_url)
     SELECT $1, * FROM unnest($2::text[], $3::text[], $4::text[], $5::text[])
     ON CONFLICT (provider, provider_id) DO UPDATE
       SET name = EXCLUDED.name,
           short_name = COALESCE(EXCLUDED.short_name, f360_teams.short_name),
           logo_url = COALESCE(EXCLUDED.logo_url, f360_teams.logo_url)
     RETURNING id, provider_id`,
    [
      proveedor,
      unicos.map((e) => e.providerId),
      unicos.map((e) => e.name),
      unicos.map((e) => e.shortName ?? null),
      unicos.map((e) => e.logo ?? null),
    ],
  );
  return new Map(rows.map((r) => [r.provider_id, r.id]));
}

async function guardarPartidos(prov, partidos, ligas) {
  const validos = partidos.filter((p) => ligas.has(p.leagueProviderId));
  const equipos = await guardarEquipos(prov.nombre, validos.flatMap((p) => [p.home, p.away]));
  for (const p of validos) {
    await query(
      `INSERT INTO f360_matches
         (provider, provider_id, league_id, home_team_id, away_team_id, kickoff_at, status, status_detail,
          minute, round, venue, home_goals, away_goals, home_goals_ft, away_goals_ft, winner, is_knockout)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (provider, provider_id) DO UPDATE
         SET kickoff_at = EXCLUDED.kickoff_at, status = EXCLUDED.status, status_detail = EXCLUDED.status_detail,
             minute = EXCLUDED.minute, round = EXCLUDED.round, venue = COALESCE(EXCLUDED.venue, f360_matches.venue),
             home_goals = EXCLUDED.home_goals, away_goals = EXCLUDED.away_goals,
             home_goals_ft = EXCLUDED.home_goals_ft, away_goals_ft = EXCLUDED.away_goals_ft,
             winner = EXCLUDED.winner, is_knockout = EXCLUDED.is_knockout, updated_at = now()
         -- Un partido ya liquidado no se reescribe: cambiarle el marcador
         -- después de pagar dejaría boletos pagados con otro resultado.
         WHERE f360_matches.settled_at IS NULL`,
      [
        prov.nombre,
        p.providerId,
        ligas.get(p.leagueProviderId),
        equipos.get(p.home.providerId),
        equipos.get(p.away.providerId),
        p.kickoffAt,
        p.status,
        p.statusDetail,
        p.minute,
        p.round,
        p.venue,
        p.goals.home,
        p.goals.away,
        p.fulltime.home,
        p.fulltime.away,
        p.winner,
        p.isKnockout,
      ],
    );
  }
  return validos.length;
}

/**
 * Publica mercados con sus cuotas. `origen` es 'modelo' o 'proveedor', y el
 * modelo nunca pisa un mercado que ya tenga cuotas del proveedor.
 */
async function guardarMercados(db, partido, mercados, origen) {
  for (const m of mercados) {
    const { rows } = await db.query(
      `INSERT INTO f360_markets (match_id, type, line, source) VALUES ($1, $2, $3, $4)
       ON CONFLICT (match_id, type, line) DO UPDATE SET source = EXCLUDED.source
         WHERE f360_markets.status IN ('open', 'suspended')
           AND ($4 = 'proveedor' OR f360_markets.source = 'modelo')
       RETURNING id`,
      [partido.id, m.type, m.line, origen],
    );
    if (!rows[0]) continue;
    const sels = m.selections;
    await db.query(
      `INSERT INTO f360_selections (market_id, code, label, odds, sort_order)
       SELECT $1, * FROM unnest($2::text[], $3::text[], $4::numeric[], $5::int[])
       ON CONFLICT (market_id, code) DO UPDATE
         SET odds = EXCLUDED.odds, label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, updated_at = now()
         WHERE f360_selections.result IS NULL`,
      [
        rows[0].id,
        sels.map((s) => s.code),
        sels.map((s) => s.label ?? etiqueta(m.type, m.line, s.code, partido.home, partido.away)),
        sels.map((s) => s.odds),
        sels.map((s, i) => s.sort ?? i),
      ],
    );
  }
}

async function guardarTabla(ligaId, filas, prov) {
  const equipos = await guardarEquipos(
    prov.nombre,
    filas
      .filter((f) => f.teamName)
      .map((f) => ({ providerId: f.teamProviderId, name: f.teamName, shortName: f.teamShort, logo: f.teamLogo })),
  );
  for (const f of filas) {
    const teamId = equipos.get(f.teamProviderId);
    if (!teamId) continue;
    await query(
      `INSERT INTO f360_standings (league_id, team_id, played, goals_for, goals_against, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (league_id, team_id) DO UPDATE
         SET played = EXCLUDED.played, goals_for = EXCLUDED.goals_for,
             goals_against = EXCLUDED.goals_against, updated_at = now()`,
      [ligaId, teamId, f.jugados, f.golesFavor, f.golesContra],
    );
  }
}

/** Cuotas del modelo para los partidos por jugar que no las tengan o estén viejas. */
async function cotizarConModelo() {
  const { rows: partidos } = await query(
    `SELECT m.id, m.league_id, m.home_team_id, m.away_team_id, m.is_knockout, l.neutral_venue,
            ht.name AS home, at.name AS away
       FROM f360_matches m
       JOIN f360_leagues l ON l.id = m.league_id
       JOIN f360_teams ht ON ht.id = m.home_team_id
       JOIN f360_teams at ON at.id = m.away_team_id
      WHERE m.status = 'scheduled' AND m.kickoff_at > now()
        AND (m.priced_at IS NULL OR m.priced_at < now() - INTERVAL '6 hours')
      ORDER BY m.kickoff_at
      LIMIT 80`,
  );
  if (partidos.length === 0) return 0;

  const { rows: tabla } = await query(
    'SELECT league_id, team_id, played, goals_for, goals_against FROM f360_standings WHERE league_id = ANY($1::int[])',
    [[...new Set(partidos.map((p) => p.league_id))]],
  );
  const fuerzasPorLiga = new Map();
  for (const ligaId of new Set(tabla.map((t) => t.league_id))) {
    fuerzasPorLiga.set(
      ligaId,
      fuerzasDesdeTabla(
        tabla
          .filter((t) => t.league_id === ligaId)
          .map((t) => ({ teamProviderId: t.team_id, jugados: t.played, golesFavor: t.goals_for, golesContra: t.goals_against })),
      ),
    );
  }

  for (const p of partidos) {
    const f = fuerzasPorLiga.get(p.league_id);
    const lambdas = golesEsperados({
      local: f?.get(String(p.home_team_id)),
      visitante: f?.get(String(p.away_team_id)),
      neutral: p.neutral_venue,
    });
    const mercados = cuotasDelModelo({
      lambdaLocal: lambdas.local,
      lambdaVisitante: lambdas.visitante,
      local: p.home,
      visitante: p.away,
      eliminatoria: p.is_knockout,
    });
    await withTransaction(async (db) => {
      await guardarMercados(db, p, mercados, 'modelo');
      await db.query(
        `UPDATE f360_matches SET priced_at = now(), odds_source = COALESCE(odds_source, 'modelo') WHERE id = $1`,
        [p.id],
      );
    });
  }
  return partidos.length;
}

async function aplicarCuotasDelProveedor(prov, ligaProviderId, ligaId) {
  const dia = (d) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(Date.now() + d * 864e5));
  let aplicadas = 0;
  for (const fecha of [dia(0), dia(1)]) {
    const mapa = await prov.cuotas(ligaProviderId, fecha);
    if (mapa.size === 0) continue;
    const { rows } = await query(
      `SELECT m.id, m.provider_id, ht.name AS home, at.name AS away
         FROM f360_matches m JOIN f360_teams ht ON ht.id = m.home_team_id JOIN f360_teams at ON at.id = m.away_team_id
        WHERE m.league_id = $1 AND m.provider_id = ANY($2::text[]) AND m.status = 'scheduled'`,
      [ligaId, [...mapa.keys()]],
    );
    for (const p of rows) {
      await withTransaction(async (db) => {
        await guardarMercados(db, p, mapa.get(p.provider_id), 'proveedor');
        await db.query(`UPDATE f360_matches SET odds_source = 'proveedor' WHERE id = $1`, [p.id]);
      });
      aplicadas++;
    }
  }
  return aplicadas;
}

/** Abre o suspende mercados según el estado del partido. */
async function ajustarMercados() {
  await query(
    `UPDATE f360_markets mk SET status = 'suspended'
       FROM f360_matches m
      WHERE mk.match_id = m.id AND mk.status = 'open' AND (m.status <> 'scheduled' OR m.kickoff_at <= now())`,
  );
  await query(
    `UPDATE f360_markets mk SET status = 'open'
       FROM f360_matches m
      WHERE mk.match_id = m.id AND mk.status = 'suspended' AND m.status = 'scheduled' AND m.kickoff_at > now()`,
  );
}

// ---------------------------------------------------------------------
// Orquestación
// ---------------------------------------------------------------------

async function sincronizar(prov, forzar) {
  const inicio = Date.now();
  const queda = () => Date.now() - inicio < PLAZO_MS;
  const demoMode = !prov.cuentaConsultas;
  const minutos = (m) => (forzar ? 0 : demoMode ? Math.min(m, 1) : m);
  const resumen = { proveedor: prov.nombre };

  const ligas = await guardarLigas(prov);

  // 1. Calendario de cada liga.
  for (const providerId of ligas.keys()) {
    if (!queda()) break;
    const clave = `${prov.nombre}:partidos:${providerId}`;
    if (!(await vencido(clave, minutos(env.F360_SYNC_PARTIDOS_MIN)))) continue;
    try {
      const n = await guardarPartidos(prov, await prov.partidos(providerId), ligas);
      await marcar(clave, true, `${n} partidos`);
      resumen[clave] = n;
    } catch (err) {
      await marcar(clave, false, err.message);
      resumen[clave] = `error: ${err.message}`;
    }
  }

  // 2. En vivo y partidos que ya deberían haber terminado. Solo se consulta si
  //    hay algo que actualizar: un día sin partidos no gasta ni una consulta.
  if (queda()) {
    const { rows } = await query(
      `SELECT m.provider_id, m.status
         FROM f360_matches m JOIN f360_leagues l ON l.id = m.league_id
        WHERE l.provider = $1 AND m.settled_at IS NULL AND m.status IN ('scheduled', 'live')
          AND m.kickoff_at <= now()`,
      [prov.nombre],
    );
    if (rows.length > 0 && (await vencido(`${prov.nombre}:vivo`, minutos(env.F360_SYNC_VIVO_MIN)))) {
      try {
        // porIds en vez de enVivo: cubre también los que terminaron desde la
        // última vez (enVivo ya no los devolvería) y cuesta 1 consulta cada 20.
        const n = await guardarPartidos(prov, await prov.porIds(rows.map((r) => r.provider_id).slice(0, 40)), ligas);
        await marcar(`${prov.nombre}:vivo`, true, `${n} partidos actualizados`);
        resumen.vivo = n;
      } catch (err) {
        await marcar(`${prov.nombre}:vivo`, false, err.message);
        resumen.vivo = `error: ${err.message}`;
      }
    }
  }

  // 3. Tabla de posiciones (una vez al día) y cuotas del proveedor.
  for (const [providerId, ligaId] of ligas) {
    if (!queda()) break;
    const claveTabla = `${prov.nombre}:tabla:${providerId}`;
    if (await vencido(claveTabla, minutos(24 * 60))) {
      try {
        const filas = await prov.tabla(providerId);
        await guardarTabla(ligaId, filas, prov);
        await marcar(claveTabla, true, `${filas.length} equipos`);
      } catch (err) {
        await marcar(claveTabla, false, err.message);
      }
    }
    if (!queda()) break;
    const claveCuotas = `${prov.nombre}:cuotas:${providerId}`;
    if (!demoMode && (await vencido(claveCuotas, minutos(env.F360_SYNC_CUOTAS_MIN)))) {
      try {
        const n = await aplicarCuotasDelProveedor(prov, providerId, ligaId);
        await marcar(claveCuotas, true, `${n} partidos con cuotas del proveedor`);
      } catch (err) {
        await marcar(claveCuotas, false, err.message);
      }
    }
  }

  // 4. Lo que no consume consultas: modelo de cuotas, mercados y liquidación.
  resumen.cotizados = await cotizarConModelo();
  await ajustarMercados();
  resumen.liquidacion = await liquidarPendientes();
  resumen.ms = Date.now() - inicio;
  return resumen;
}

/**
 * Pone los datos al día si hace falta. Nunca lanza: si algo falla la app
 * sigue con lo que tiene, y el motivo queda en GET /api/f360/estado.
 */
export async function asegurarDatos({ forzar = false } = {}) {
  try {
    if (!(await tomarTurno())) return { omitido: 'otra sincronización en curso' };
    try {
      return await sincronizar(proveedorActivo(), forzar);
    } finally {
      await soltarTurno();
    }
  } catch (err) {
    console.error('f360: falló la sincronización', err);
    return { error: err.message };
  }
}

export async function estado() {
  const prov = proveedorActivo();
  const [{ rows: pasos }, { rows: uso }] = await Promise.all([
    // Solo los pasos del proveedor activo: los de otro proveedor no dicen nada del actual.
    query(`SELECT key, synced_at, ok, detail FROM f360_sync_state WHERE key LIKE $1 ORDER BY key`, [`${prov.nombre}:%`]),
    query(`SELECT requests FROM f360_api_usage WHERE day = (now() AT TIME ZONE 'America/Bogota')::date`),
  ]);
  return {
    proveedor: prov.nombre,
    demostracion: prov.nombre === 'demo',
    temporada: env.F360_TEMPORADA,
    ligas: LIGAS,
    pagos: env.F360_PAGOS,
    consultasHoy: uso[0]?.requests ?? 0,
    presupuestoDiario: env.F360_API_PRESUPUESTO_DIARIO,
    pasos: pasos.map((p) => ({ clave: p.key.slice(prov.nombre.length + 1), cuando: p.synced_at, ok: p.ok, detalle: p.detail })),
  };
}
