import pg from 'pg';
import { env } from '../config/env.js';

// En serverless cada instancia de la función es un proceso aparte y efímero.
// Un pool grande por instancia agota las conexiones de la base en cuanto hay
// concurrencia, así que en producción se deja una por instancia y el pooling
// real lo hace el proveedor (en Neon, el endpoint "-pooler").
const esLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal)[:/]/.test(env.DATABASE_URL);

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.isProd ? 1 : 10,
  idleTimeoutMillis: env.isProd ? 10_000 : 30_000,
  // Sin esto, una base inalcanzable deja la petición colgada hasta que Vercel
  // corta la función; así falla rápido y con un error claro.
  connectionTimeoutMillis: 10_000,
  // Las bases gestionadas (Neon, Supabase…) exigen TLS; el Postgres local no.
  ssl: esLocal ? false : { rejectUnauthorized: true },
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL', err);
});

// Nota: el search_path NO se fija aquí. Pasarlo como parámetro de arranque
// (options: '-c search_path=...') lo rechaza el pooler de Neon con 08P01, y un
// SET por conexión no sobrevive a un pooler en modo transacción. Se fija del
// lado del servidor como valor por defecto del rol; lo hace `npm run db:migrate`.


export const query = (text, params) => pool.query(text, params);

// Ejecuta varias consultas en una transacción: withTransaction(async (client) => { ... })
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
