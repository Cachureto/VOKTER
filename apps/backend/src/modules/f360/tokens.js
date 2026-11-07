import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { unauthorized } from '../../utils/httpError.js';

export { generateRefreshToken, hashToken } from '../../utils/tokens.js';

// Clave propia de Fanáticos 360.
//
// Si no se define F360_JWT_SECRET se deriva de la de Vokter con HMAC. Es una
// clave distinta, así que un token de la tienda nunca sirve aquí ni al revés
// (además el emisor y la audiencia no coinciden), y no obliga a configurar
// nada nuevo para que la API arranque.
const CLAVE =
  env.F360_JWT_SECRET ??
  crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update('fanaticos360/access-token').digest('hex');

const OPCIONES = { issuer: 'f360-api', audience: 'fanaticos360' };

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id }, CLAVE, { ...OPCIONES, expiresIn: env.JWT_ACCESS_TTL });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, CLAVE, OPCIONES);
}

// Exige "Authorization: Bearer <token de Fanáticos 360>".
export function requireF360(req, _res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());
  try {
    req.f360 = { userId: verifyAccessToken(token).sub };
    next();
  } catch {
    next(unauthorized('Token inválido o expirado'));
  }
}
