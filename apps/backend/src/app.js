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

app.get('/api/health', async (_req, res) => {
  const { rows } = await pool.query('SELECT now() AS db_time');
  res.json({ status: 'ok', dbTime: rows[0].db_time });
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