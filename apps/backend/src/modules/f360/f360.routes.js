/**
 * Fanáticos 360 · /api/f360
 *
 * Vive dentro de la misma API que Vokter para no desplegar otro servidor,
 * pero no comparte cuentas, tokens ni tablas con la tienda.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { unauthorized } from '../../utils/httpError.js';
import * as cuenta from './account.service.js';
import * as auth from './auth.service.js';
import * as apuestas from './bets.service.js';
import * as deportes from './matches.service.js';
import * as s from './schemas.js';
import { asegurarDatos, estado } from './sync.service.js';
import { requireF360 } from './tokens.js';

const router = Router();

const limitar = (limit, windowMs) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, espera un momento' },
  });

const limiteAuth = limitar(20, 15 * 60 * 1000);
const limiteDinero = limitar(30, 60 * 1000);

// Antes de responder con partidos se revisa si algo está viejo. Nunca lanza.
const conDatosFrescos = async (_req, _res, next) => {
  await asegurarDatos();
  next();
};

// ---------- Diagnóstico ----------
router.get('/estado', async (_req, res) => res.json(await estado()));

// ---------- Cuentas ----------
router.post('/auth/register', limiteAuth, validate({ body: s.registerSchema }), async (req, res) => {
  res.status(201).json(await auth.register(req.valid.body));
});
router.post('/auth/login', limiteAuth, validate({ body: s.loginSchema }), async (req, res) => {
  res.json(await auth.login(req.valid.body));
});
router.post('/auth/refresh', validate({ body: s.refreshSchema }), async (req, res) => {
  res.json(await auth.refresh(req.valid.body.refreshToken));
});
router.post('/auth/logout', validate({ body: s.refreshSchema }), async (req, res) => {
  await auth.logout(req.valid.body.refreshToken);
  res.status(204).end();
});
router.get('/auth/me', requireF360, async (req, res) => {
  res.json({ user: await auth.getMe(req.f360.userId) });
});

// ---------- Deportes ----------
router.get('/leagues', conDatosFrescos, async (_req, res) => {
  res.json({ items: await deportes.ligas() });
});
router.get('/matches', conDatosFrescos, validate({ query: s.matchesQuery }), async (req, res) => {
  res.json({ items: await deportes.partidos(req.valid.query) });
});
router.get('/matches/:id', conDatosFrescos, validate({ params: s.idParam }), async (req, res) => {
  res.json(await deportes.detalle(req.valid.params.id));
});

// ---------- Billetera ----------
router.get('/wallet', requireF360, async (req, res) => {
  res.json(await cuenta.obtenerBilletera(req.f360.userId));
});
router.post('/wallet/deposits', requireF360, limiteDinero, validate({ body: s.depositSchema }), async (req, res) => {
  res.status(201).json(await cuenta.depositar(req.f360.userId, req.valid.body));
});
router.post('/wallet/withdrawals', requireF360, limiteDinero, validate({ body: s.withdrawSchema }), async (req, res) => {
  res.status(201).json(await cuenta.retirar(req.f360.userId, req.valid.body));
});

// ---------- Juego responsable ----------
router.get('/account/limits', requireF360, async (req, res) => {
  res.json({ items: await cuenta.obtenerLimites(req.f360.userId) });
});
router.put('/account/limits', requireF360, validate({ body: s.limitSchema }), async (req, res) => {
  res.json({ items: await cuenta.fijarLimite(req.f360.userId, req.valid.body) });
});
router.post('/account/self-exclusion', requireF360, validate({ body: s.selfExclusionSchema }), async (req, res) => {
  res.json({ user: await cuenta.autoexcluir(req.f360.userId, req.valid.body) });
});
router.post('/account/verify', requireF360, async (req, res) => {
  res.json({ user: await cuenta.verificarIdentidad(req.f360.userId) });
});

// ---------- Apuestas ----------
router.post('/bets', requireF360, limiteDinero, validate({ body: s.placeBetSchema }), async (req, res) => {
  res.status(201).json(await apuestas.apostar(req.f360.userId, req.valid.body));
});
router.get('/bets', requireF360, validate({ query: s.betsQuery }), async (req, res) => {
  res.json({ items: await apuestas.misBoletos(req.f360.userId, req.valid.query) });
});

// ---------- Operación ----------
// Para un cron externo: fuerza una sincronización completa.
router.post('/ops/sync', async (req, res, next) => {
  if (!env.F360_OPS_TOKEN || req.headers['x-f360-ops-token'] !== env.F360_OPS_TOKEN) {
    return next(unauthorized('Token de operación inválido'));
  }
  res.json(await asegurarDatos({ forzar: true }));
});

export default router;
