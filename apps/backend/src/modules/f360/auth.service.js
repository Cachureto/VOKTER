import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { badRequest, conflict, unauthorized } from '../../utils/httpError.js';
import { generateRefreshToken, hashToken, signAccessToken } from './tokens.js';

const BCRYPT_ROUNDS = 12;
// Hash falso: el login tarda lo mismo exista o no el correo (evita enumerar cuentas).
const DUMMY_HASH = bcrypt.hashSync('f360-dummy-password', BCRYPT_ROUNDS);

/** Fecha de hoy en Colombia, como AAAA-MM-DD. */
export function hoyEnBogota() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

/** Años cumplidos a la fecha de hoy en Colombia. */
export function edad(birthDate) {
  const [y, m, d] = birthDate.split('-').map(Number);
  const [hy, hm, hd] = hoyEnBogota().split('-').map(Number);
  return hy - y - (hm < m || (hm === m && hd < d) ? 1 : 0);
}

const fecha = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);

export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  documentType: u.document_type,
  // Solo los últimos dígitos: es un dato sensible y la app no necesita más.
  documentMasked: `•••${String(u.document_number).slice(-4)}`,
  birthDate: fecha(u.birth_date),
  phone: u.phone ?? null,
  kycStatus: u.kyc_status,
  selfExcludedUntil: u.self_excluded_until,
  createdAt: u.created_at,
});

const COLUMNAS = `id, name, email, document_type, document_number, birth_date, phone,
                  kyc_status, is_active, self_excluded_until, created_at`;

async function issueTokens(db, user) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const { rows } = await db.query(
    `INSERT INTO f360_refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id`,
    [user.id, hashToken(refreshToken), expiresAt],
  );
  return { accessToken: signAccessToken(user), refreshToken, refreshTokenId: rows[0].id };
}

export async function register(data) {
  if (edad(data.birthDate) < 18) {
    throw badRequest('Debes ser mayor de 18 años para registrarte', [
      { field: 'birthDate', message: 'Debes ser mayor de 18 años' },
    ]);
  }

  const dup = await query(
    `SELECT (email = $1) AS por_email FROM f360_users
      WHERE email = $1 OR (document_type = $2 AND document_number = $3) LIMIT 1`,
    [data.email, data.documentType, data.documentNumber],
  );
  if (dup.rowCount > 0) {
    throw conflict(
      dup.rows[0].por_email ? 'Ya existe una cuenta con ese correo' : 'Ya existe una cuenta con ese documento',
    );
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO f360_users (name, email, password_hash, document_type, document_number,
                               birth_date, phone, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING ${COLUMNAS}`,
      [data.name, data.email, passwordHash, data.documentType, data.documentNumber, data.birthDate, data.phone ?? null],
    );
    const user = rows[0];
    await db.query('INSERT INTO f360_wallets (user_id) VALUES ($1)', [user.id]);
    const tokens = await issueTokens(db, user);
    return { user: publicUser(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  });
}

export async function login({ email, password }) {
  const { rows } = await query(`SELECT ${COLUMNAS}, password_hash FROM f360_users WHERE email = $1`, [email]);
  const user = rows[0];
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw unauthorized('Correo o contraseña incorrectos');
  if (!user.is_active) throw unauthorized('La cuenta está desactivada');
  // Autoexcluido sí puede entrar: ve su saldo y su historial, pero no apuesta
  // ni deposita. Bloquear el login le impediría incluso retirar lo suyo.
  const tokens = await issueTokens({ query }, user);
  return { user: publicUser(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

// Rotación: cada refresh invalida el usado. Reutilizar uno ya rotado se toma
// como robo y cierra todas las sesiones de la cuenta.
export async function refresh(rawToken) {
  const result = await withTransaction(async (db) => {
    const { rows } = await db.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, u.is_active
         FROM f360_refresh_tokens rt JOIN f360_users u ON u.id = rt.user_id
        WHERE rt.token_hash = $1
        FOR UPDATE OF rt`,
      [hashToken(rawToken)],
    );
    const row = rows[0];
    if (!row) throw unauthorized('Sesión inválida');
    if (row.revoked_at) {
      await db.query(
        'UPDATE f360_refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
        [row.user_id],
      );
      return { reused: true };
    }
    if (row.expires_at < new Date()) throw unauthorized('Sesión expirada');
    if (!row.is_active) throw unauthorized('La cuenta está desactivada');

    const { rows: users } = await db.query(`SELECT ${COLUMNAS} FROM f360_users WHERE id = $1`, [row.user_id]);
    const tokens = await issueTokens(db, users[0]);
    await db.query('UPDATE f360_refresh_tokens SET revoked_at = now(), replaced_by = $2 WHERE id = $1', [
      row.id,
      tokens.refreshTokenId,
    ]);
    return { user: publicUser(users[0]), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  });
  if (result.reused) throw unauthorized('Sesión inválida, vuelve a iniciar sesión');
  return result;
}

export async function logout(rawToken) {
  await query('UPDATE f360_refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [
    hashToken(rawToken),
  ]);
}

export async function getUser(userId, db = { query }) {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM f360_users WHERE id = $1`, [userId]);
  if (!rows[0]) throw unauthorized('Cuenta no encontrada');
  return rows[0];
}

export async function getMe(userId) {
  return publicUser(await getUser(userId));
}
