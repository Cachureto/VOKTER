/**
 * Billetera, límites y autoexclusión.
 *
 * El saldo vive en f360_wallets y cada movimiento queda en f360_transactions
 * con el saldo resultante. Todo cambio de saldo bloquea primero la fila de la
 * billetera (FOR UPDATE): dos peticiones simultáneas no pueden gastar el mismo
 * peso dos veces.
 */
import { query, withTransaction } from '../../db/pool.js';
import { badRequest, forbidden } from '../../utils/httpError.js';
import { getUser, publicUser } from './auth.service.js';
import { modoDePagos, pasarela } from './payments.js';

const PERIODOS = {
  day: { dias: 1, nombre: 'diario' },
  week: { dias: 7, nombre: 'semanal' },
  month: { dias: 30, nombre: 'mensual' },
};

const tx = (t) => ({
  id: t.id,
  type: t.type,
  status: t.status,
  amountCop: Number(t.amount_cop),
  balanceAfterCop: t.balance_after_cop == null ? null : Number(t.balance_after_cop),
  method: t.method,
  betId: t.bet_id,
  createdAt: t.created_at,
});

/** Bloquea y devuelve el saldo. Debe llamarse dentro de una transacción. */
export async function bloquearBilletera(db, userId) {
  const { rows } = await db.query('SELECT balance_cop FROM f360_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
  if (!rows[0]) throw badRequest('La cuenta no tiene billetera');
  return Number(rows[0].balance_cop);
}

/** Suma o resta al saldo y deja el movimiento anotado. */
export async function mover(db, userId, { type, amountCop, betId = null, method = null, provider = null, ref = null }) {
  const saldo = await bloquearBilletera(db, userId);
  const entra = ['deposit', 'payout', 'refund', 'adjustment'].includes(type);
  const nuevo = entra ? saldo + amountCop : saldo - amountCop;
  if (nuevo < 0) throw badRequest('Saldo insuficiente');
  await db.query('UPDATE f360_wallets SET balance_cop = $2, updated_at = now() WHERE user_id = $1', [userId, nuevo]);
  const { rows } = await db.query(
    `INSERT INTO f360_transactions (user_id, type, status, amount_cop, balance_after_cop, bet_id, method, provider, provider_ref, completed_at)
     VALUES ($1, $2, 'completed', $3, $4, $5, $6, $7, $8, now()) RETURNING *`,
    [userId, type, amountCop, nuevo, betId, method, provider, ref],
  );
  return { saldo: nuevo, movimiento: rows[0] };
}

/** Lanza si la cuenta está autoexcluida o desactivada. */
export function exigirHabilitado(user, accion) {
  if (!user.is_active) throw forbidden('La cuenta está desactivada');
  if (user.self_excluded_until && new Date(user.self_excluded_until) > new Date()) {
    const hasta = new Date(user.self_excluded_until).toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    throw forbidden(`Tienes una autoexclusión activa hasta el ${hasta}. No puedes ${accion} hasta entonces.`);
  }
}

// ---------------------------------------------------------------------
// Límites
// ---------------------------------------------------------------------

/** Aplica los cambios de límites cuya espera de 24 h ya pasó. */
async function aplicarPendientes(db, userId) {
  await db.query(
    `DELETE FROM f360_limits
      WHERE user_id = $1 AND pending_effective_at <= now() AND pending_amount_cop IS NULL`,
    [userId],
  );
  await db.query(
    `UPDATE f360_limits
        SET amount_cop = pending_amount_cop, pending_amount_cop = NULL,
            pending_effective_at = NULL, updated_at = now()
      WHERE user_id = $1 AND pending_effective_at <= now() AND pending_amount_cop IS NOT NULL`,
    [userId],
  );
}

export async function obtenerLimites(userId, db = { query }) {
  await aplicarPendientes(db, userId);
  const { rows } = await db.query('SELECT * FROM f360_limits WHERE user_id = $1', [userId]);
  const usados = await depositadoPorPeriodo(db, userId);
  return Object.entries(PERIODOS).map(([period, info]) => {
    const fila = rows.find((r) => r.period === period);
    return {
      period,
      name: info.nombre,
      amountCop: fila ? Number(fila.amount_cop) : null,
      usedCop: usados[period],
      pending: fila?.pending_effective_at
        ? {
            amountCop: fila.pending_amount_cop == null ? null : Number(fila.pending_amount_cop),
            effectiveAt: fila.pending_effective_at,
          }
        : null,
    };
  });
}

async function depositadoPorPeriodo(db, userId) {
  const { rows } = await db.query(
    `SELECT
       COALESCE(SUM(amount_cop) FILTER (WHERE created_at > now() - INTERVAL '1 day'), 0)   AS day,
       COALESCE(SUM(amount_cop) FILTER (WHERE created_at > now() - INTERVAL '7 days'), 0)  AS week,
       COALESCE(SUM(amount_cop) FILTER (WHERE created_at > now() - INTERVAL '30 days'), 0) AS month
       FROM f360_transactions
      WHERE user_id = $1 AND type = 'deposit' AND status IN ('completed', 'pending')`,
    [userId],
  );
  return { day: Number(rows[0].day), week: Number(rows[0].week), month: Number(rows[0].month) };
}

export async function fijarLimite(userId, { period, amountCop }) {
  return withTransaction(async (db) => {
    await aplicarPendientes(db, userId);
    const { rows } = await db.query('SELECT * FROM f360_limits WHERE user_id = $1 AND period = $2 FOR UPDATE', [
      userId,
      period,
    ]);
    const actual = rows[0] ? Number(rows[0].amount_cop) : null;

    // Bajar un límite (o ponerlo donde no había) protege al usuario: aplica ya.
    const esMasEstricto = amountCop != null && (actual == null || amountCop <= actual);
    if (esMasEstricto) {
      await db.query(
        `INSERT INTO f360_limits (user_id, period, amount_cop) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, period) DO UPDATE
           SET amount_cop = EXCLUDED.amount_cop, pending_amount_cop = NULL,
               pending_effective_at = NULL, updated_at = now()`,
        [userId, period, amountCop],
      );
    } else if (actual != null) {
      // Subirlo o quitarlo espera 24 h.
      await db.query(
        `UPDATE f360_limits
            SET pending_amount_cop = $3, pending_effective_at = now() + INTERVAL '24 hours', updated_at = now()
          WHERE user_id = $1 AND period = $2`,
        [userId, period, amountCop],
      );
    }
    return obtenerLimites(userId, db);
  });
}

export async function autoexcluir(userId, { days }) {
  const { rows } = await query(
    `UPDATE f360_users
        SET self_excluded_until = GREATEST(COALESCE(self_excluded_until, now()), now() + make_interval(days => $2))
      WHERE id = $1
      RETURNING *`,
    [userId, days],
  );
  return publicUser(rows[0]);
}

// En modo pruebas no hay un proveedor de verificación de identidad: se marca
// como verificada para poder probar los retiros. En modo real esto lo haría un
// servicio de KYC con fotos del documento.
export async function verificarIdentidad(userId) {
  if (modoDePagos() !== 'pruebas') {
    throw forbidden('La verificación de identidad con dinero real necesita un proveedor de KYC.');
  }
  const { rows } = await query(`UPDATE f360_users SET kyc_status = 'verified' WHERE id = $1 RETURNING *`, [userId]);
  return publicUser(rows[0]);
}

// ---------------------------------------------------------------------
// Billetera
// ---------------------------------------------------------------------

export async function obtenerBilletera(userId) {
  const [{ rows: w }, { rows: movs }, { rows: abiertas }] = await Promise.all([
    query('SELECT balance_cop FROM f360_wallets WHERE user_id = $1', [userId]),
    query('SELECT * FROM f360_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 40', [userId]),
    query(`SELECT COALESCE(SUM(stake_cop), 0) AS en_juego, COUNT(*) AS n FROM f360_bets WHERE user_id = $1 AND status = 'open'`, [userId]),
  ]);
  return {
    balanceCop: Number(w[0]?.balance_cop ?? 0),
    inPlayCop: Number(abiertas[0].en_juego),
    openBets: Number(abiertas[0].n),
    mode: modoDePagos(),
    transactions: movs.map(tx),
  };
}

export async function depositar(userId, { amountCop, method }) {
  const user = await getUser(userId);
  exigirHabilitado(user, 'depositar');
  const proveedor = pasarela();

  return withTransaction(async (db) => {
    // El bloqueo va primero: dos depósitos simultáneos no pueden saltarse el
    // límite cada uno creyendo que el otro no existe.
    await bloquearBilletera(db, userId);
    const limites = await obtenerLimites(userId, db);
    for (const l of limites) {
      if (l.amountCop != null && l.usedCop + amountCop > l.amountCop) {
        const disponible = Math.max(0, l.amountCop - l.usedCop);
        throw badRequest(
          `Superas tu límite ${l.name} de depósito. Te quedan $${disponible.toLocaleString('es-CO')} en este periodo.`,
        );
      }
    }

    const pago = await proveedor.crearDeposito({ amountCop, method, userId });
    if (pago.status !== 'completed') {
      // Una pasarela real responde "pendiente" y confirma luego por webhook.
      await db.query(
        `INSERT INTO f360_transactions (user_id, type, status, amount_cop, method, provider, provider_ref)
         VALUES ($1, 'deposit', 'pending', $2, $3, $4, $5)`,
        [userId, amountCop, method, proveedor.nombre, pago.ref],
      );
      return { status: 'pending', checkoutUrl: pago.checkoutUrl ?? null };
    }
    const { saldo, movimiento } = await mover(db, userId, {
      type: 'deposit',
      amountCop,
      method,
      provider: proveedor.nombre,
      ref: pago.ref,
    });
    return { status: 'completed', balanceCop: saldo, transaction: tx(movimiento) };
  });
}

export async function retirar(userId, { amountCop }) {
  const user = await getUser(userId);
  if (!user.is_active) throw forbidden('La cuenta está desactivada');
  // Retirar sí se permite con autoexclusión: el dinero es del usuario.
  if (user.kyc_status !== 'verified') {
    throw forbidden('Para retirar primero debes verificar tu identidad.');
  }
  const proveedor = pasarela();
  return withTransaction(async (db) => {
    const saldo = await bloquearBilletera(db, userId);
    if (amountCop > saldo) throw badRequest('Saldo insuficiente para ese retiro');
    const pago = await proveedor.crearRetiro({ amountCop, userId });
    const { saldo: nuevo, movimiento } = await mover(db, userId, {
      type: 'withdrawal',
      amountCop,
      provider: proveedor.nombre,
      ref: pago.ref,
    });
    return { status: 'completed', balanceCop: nuevo, transaction: tx(movimiento) };
  });
}
