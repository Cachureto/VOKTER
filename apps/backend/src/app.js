import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import dropsRoutes from './modules/drops/drops.routes.js';
import authenticityRoutes from './modules/authenticity/authenticity.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import f360Routes from './modules/f360/f360.routes.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    // Sin "origin" = app móvil, curl o Postman → permitido
    origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Pistas para /api/health. Son códigos de error, no datos sensibles: ni la
// cadena de conexión ni la contraseña salen nunca en la respuesta.
const PISTAS_DB = {
  '28P01': 'Usuario o contraseña incorrectos en DATABASE_URL.',
  '3D000': 'La base indicada en DATABASE_URL no existe.',
  '28000': 'El usuario no tiene permiso para conectarse a esa base.',
  '3F000': 'Falta el search_path del rol. Ejecuta npm run db:migrate apuntando a esta base.',
  '42P01': 'Las tablas no están. Falta cargar el dump y correr npm run db:migrate.',
  '08P01': 'El pooler rechazó un parámetro de arranque de la conexión.',
  ENOTFOUND: 'No se resolvió el host de DATABASE_URL. Revisa que esté completa y bien escrita.',
  ECONNREFUSED: 'La base rechazó la conexión.',
  ETIMEDOUT: 'La base no respondió a tiempo. Puede estar despertando: reintenta.',
  CERT_HAS_EXPIRED: 'Certificado TLS vencido en el servidor de la base.',
  SELF_SIGNED_CERT_IN_CHAIN: 'Certificado TLS no confiable en el servidor de la base.',
};

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT now() AS db_time');
    res.json({ status: 'ok', dbTime: rows[0].db_time });
  } catch (err) {
    // A propósito no pasa por el manejador de errores general: este endpoint
    // existe para diagnosticar, y un "Error interno del servidor" a secas
    // obliga a irse a buscar los logs de la función.
    console.error('health: fallo la consulta a PostgreSQL', err);
    const codigo = err.code ?? err.name ?? 'desconocido';
    res.status(500).json({
      status: 'error',
      db: codigo,
      hint: PISTAS_DB[codigo] ?? 'Mira los Runtime Logs de la función en Vercel.',
      // Útiles para descartar lo típico, y ninguno revela credenciales.
      pooled: /-pooler\./.test(process.env.DATABASE_URL ?? ''),
      ssl: /sslmode=/.test(process.env.DATABASE_URL ?? ''),
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/products/:productId/reviews', reviewsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/drops', dropsRoutes);
app.use('/api/authenticity', authenticityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/categories', categoriesRoutes);
// Fanáticos 360 (app de apuestas): mismo servidor, cuentas y tablas aparte.
app.use('/api/f360', f360Routes);

app.use(notFoundHandler);
app.use(errorHandler);

// Export por defecto para Vercel.
//
// Vercel detecta una app de Express buscando un archivo (app.js, index.js,
// server.js, o los mismos bajo src/) que importe `express` Y además exporte la
// app por defecto o llame a listen(). Este archivo importaba express pero solo
// la exportaba con nombre, y server.js hace el listen pero no importa express:
// sin ninguno que cumpliera las dos, Vercel trataba el proyecto como sitio
// estático y fallaba con "No Output Directory named public".
//
// En local no cambia nada: server.js sigue usando el export con nombre.
export default app;
