import { query, withTransaction } from '../../db/pool.js';
import { badRequest, conflict } from '../../utils/httpError.js';
import { getUser } from './auth.service.js';
import { exigirHabilitado, mover } from './account.service.js';
import { LIMITES } from './schemas.js';
import { pagoEnPesos, resultadoBoleto, resultadoSeleccion } from './settlement.js';

// Margen para no aceptar apuestas en el último instante antes del pitazo.
const CIERRE_ANTES_DEL_INICIO_MS = 60 * 1000;

const redondear = (n) => Math.round(n * 100) / 100;

export async function apostar(userId, { stakeCop, selections, acceptOddsChanges }) {
  const user = await getUser(userId);
  exigirHabilitado(user, 'apostar');

  return withTransaction(async (db) => {
    const ids = selections.map((s) => s.selectionId);
    const { rows } = await db.query(
      `SELECT s.id, s.odds, s.label, s.code, mk.id AS market_id, mk.type, mk.line, mk.status AS market_status,
              m.id AS match_id, m.status AS match_status, m.kickoff_at,
              ht.name AS home, at.name AS away
         FROM f360_selections s
         JOIN f360_markets mk ON mk.id = s.market_id
         JOIN f360_matches m  ON m.id = mk.match_id
         JOIN f360_teams ht   ON ht.id = m.home_team_id
         JOIN f360_teams at   ON at.id = m.away_team_id
        WHERE s.id = ANY($1::int[])
        FOR SHARE OF s, mk, m`,
      [ids],
    );
    if (rows.length !== new Set(ids).size) throw badRequest('Alguna selección ya no existe. Actualiza el boleto.');

    const porPartido = new Set();
    const cambios = [];
    for (const pedida of selections) {
      const sel = rows.find((r) => r.id === pedida.selectionId);
      const partido = `${sel.home} vs ${sel.away}`;
      if (porPartido.has(sel.match_id)) {
        throw badRequest(`Solo puedes elegir una opción por partido en el boleto (${partido}).`);
      }
      porPartido.add(sel.match_id);
      if (sel.market_status !== 'open' || sel.match_status !== 'scheduled') {
        throw conflict(`El mercado de ${partido} ya no acepta apuestas.`);
      }
      if (new Date(sel.kickoff_at).getTime() - Date.now() < CIERRE_ANTES_DEL_INICIO_MS) {
        throw conflict(`${partido} ya empezó o está por empezar: no se aceptan más apuestas.`);
      }
      if (Number(sel.odds) !== redondear(pedida.odds)) {
        cambios.push({ selectionId: sel.id, before: pedida.odds, now: Number(sel.odds), label: sel.label, match: partido });
      }
    }
    // Las cuotas se mueven. Nunca se cobra a una cuota que el usuario no vio.
    if (cambios.length > 0 && !acceptOddsChanges) {
      const e = conflict('Algunas cuotas cambiaron. Revísalas antes de confirmar.');
      e.details = cambios;
      throw e;
    }

    const cuotaTotal = redondear(rows.reduce((c, r) => c * Number(r.odds), 1));
    if (cuotaTotal > 1000) throw badRequest('La cuota total no puede superar 1.000');
    const pagoPosible = pagoEnPesos(stakeCop, cuotaTotal);
    if (pagoPosible > LIMITES.pagoMax) {
      throw badRequest(`La ganancia posible no puede superar $${LIMITES.pagoMax.toLocaleString('es-CO')}. Baja el valor apostado.`);
    }

    const { rows: bets } = await db.query(
      `INSERT INTO f360_bets (user_id, stake_cop, total_odds, potential_payout_cop)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, stakeCop, cuotaTotal, pagoPosible],
    );
    const betId = bets[0].id;
    for (const r of rows) {
      await db.query(
        `INSERT INTO f360_bet_legs (bet_id, selection_id, match_id, odds) VALUES ($1, $2, $3, $4)`,
        [betId, r.id, r.match_id, r.odds],
      );
    }
    // Si el saldo no alcanza, `mover` lanza y la transacción entera se revierte:
    // no queda un boleto sin cobrar.
    const { saldo } = await mover(db, userId, { type: 'stake', amountCop: stakeCop, betId });
    return { bet: await boletoPorId(db, betId), balanceCop: saldo };
  });
}

const SELECCION_SQL = `
  SELECT l.bet_id, l.odds, l.result, s.code, s.label, mk.type, mk.line,
         m.id AS match_id, m.kickoff_at, m.status AS match_status, m.home_goals, m.away_goals,
         ht.name AS home, at.name AS away, lg.name AS league
    FROM f360_bet_legs l
    JOIN f360_selections s ON s.id = l.selection_id
    JOIN f360_markets mk   ON mk.id = s.market_id
    JOIN f360_matches m    ON m.id = l.match_id
    JOIN f360_teams ht     ON ht.id = m.home_team_id
    JOIN f360_teams at     ON at.id = m.away_team_id
    JOIN f360_leagues lg   ON lg.id = m.league_id`;

const formatoBoleto = (b, tramos) => ({
  id: b.id,
  stakeCop: Number(b.stake_cop),
  totalOdds: Number(b.total_odds),
  potentialPayoutCop: Number(b.potential_payout_cop),
  payoutCop: b.payout_cop == null ? null : Number(b.payout_cop),
  status: b.status,
  type: tramos.length > 1 ? 'combo' : 'single',
  placedAt: b.placed_at,
  settledAt: b.settled_at,
  legs: tramos.map((t) => ({
    matchId: t.match_id,
    match: `${t.home} vs ${t.away}`,
    league: t.league,
    kickoffAt: t.kickoff_at,
    matchStatus: t.match_status,
    score: t.home_goals == null ? null : `${t.home_goals} - ${t.away_goals}`,
    market: t.type,
    line: Number(t.line),
    code: t.code,
    label: t.label,
    odds: Number(t.odds),
    result: t.result,
  })),
});

async function boletoPorId(db, betId) {
  const [{ rows: b }, { rows: l }] = await Promise.all([
    db.query('SELECT * FROM f360_bets WHERE id = $1', [betId]),
    db.query(`${SELECCION_SQL} WHERE l.bet_id = $1 ORDER BY m.kickoff_at`, [betId]),
  ]);
  return formatoBoleto(b[0], l);
}

export async function misBoletos(userId, { status, limit }) {
  const filtro = status === 'open' ? `AND status = 'open'` : status === 'settled' ? `AND status <> 'open'` : '';
  const { rows: bets } = await query(
    `SELECT * FROM f360_bets WHERE user_id = $1 ${filtro} ORDER BY placed_at DESC LIMIT $2`,
    [userId, limit],
  );
  if (bets.length === 0) return [];
  const { rows: tramos } = await query(`${SELECCION_SQL} WHERE l.bet_id = ANY($1::uuid[]) ORDER BY m.kickoff_at`, [
    bets.map((b) => b.id),
  ]);
  return bets.map((b) => formatoBoleto(b, tramos.filter((t) => t.bet_id === b.id)));
}

/**
 * Liquida un partido terminado o cancelado: resultado de cada selección y,
 * luego, de cada boleto que quede completo. Se puede llamar las veces que sea:
 * un partido ya liquidado no se toca de nuevo.
 */
export async function liquidarPartido(matchId) {
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM f360_matches WHERE id = $1 FOR UPDATE', [matchId]);
    const partido = rows[0];
    if (!partido || partido.settled_at) return { liquidados: 0 };
    if (!['finished', 'cancelled'].includes(partido.status)) return { liquidados: 0 };

    const { rows: mercados } = await db.query('SELECT * FROM f360_markets WHERE match_id = $1', [matchId]);
    for (const mk of mercados) {
      const { rows: sels } = await db.query('SELECT id, code FROM f360_selections WHERE market_id = $1', [mk.id]);
      const codigos = sels.map((s) => s.code);
      for (const s of sels) {
        const res = resultadoSeleccion(mk, s.code, partido, codigos);
        await db.query('UPDATE f360_selections SET result = $2, updated_at = now() WHERE id = $1', [s.id, res]);
        await db.query('UPDATE f360_bet_legs SET result = $2 WHERE selection_id = $1', [s.id, res]);
      }
      await db.query('UPDATE f360_markets SET status = $2 WHERE id = $1', [
        mk.id,
        partido.status === 'cancelled' ? 'void' : 'settled',
      ]);
    }
    await db.query('UPDATE f360_matches SET settled_at = now() WHERE id = $1', [matchId]);

    // Boletos con algún tramo en este partido que sigan abiertos.
    const { rows: abiertos } = await db.query(
      `SELECT b.id, b.user_id, b.stake_cop
         FROM f360_bets b
        WHERE b.status = 'open'
          AND EXISTS (SELECT 1 FROM f360_bet_legs l WHERE l.bet_id = b.id AND l.match_id = $1)
        FOR UPDATE OF b`,
      [matchId],
    );
    let liquidados = 0;
    for (const b of abiertos) {
      const { rows: tramos } = await db.query('SELECT result, odds FROM f360_bet_legs WHERE bet_id = $1', [b.id]);
      const fin = resultadoBoleto(tramos, b.stake_cop);
      if (!fin) continue;
      await db.query(
        `UPDATE f360_bets SET status = $2, payout_cop = $3, settled_at = now() WHERE id = $1`,
        [b.id, fin.status, fin.payoutCop],
      );
      if (fin.payoutCop > 0) {
        await mover(db, b.user_id, { type: fin.status === 'void' ? 'refund' : 'payout', amountCop: fin.payoutCop, betId: b.id });
      }
      liquidados++;
    }
    return { liquidados };
  });
}

/** Liquida todo lo que haya terminado y siga pendiente. */
export async function liquidarPendientes() {
  const { rows } = await query(
    `SELECT id FROM f360_matches WHERE settled_at IS NULL AND status IN ('finished', 'cancelled') ORDER BY kickoff_at LIMIT 50`,
  );
  let boletos = 0;
  for (const r of rows) boletos += (await liquidarPartido(r.id)).liquidados;
  return { partidos: rows.length, boletos };
}
