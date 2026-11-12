import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

// El chequeo de la base no bloquea el arranque ni mata el proceso.
// En serverless este módulo se evalúa en cada arranque en frío: un parpadeo de
// la base tumbaría la función entera y Vercel devolvería un error opaco. Si la
// base está mal, es mejor que cada petición falle con su propio mensaje.
pool
  .query('SELECT 1')
  .then(() => console.log('Conectado a PostgreSQL'))
  .catch((err) => console.error('Sin conexión a PostgreSQL:', err.message));

const server = app.listen(env.PORT, () => {
  console.log(`Vokter API en http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
