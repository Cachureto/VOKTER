import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

// Docker corre db/migrations/*.sql solo en el primer arranque del contenedor.
// Este runner permite aplicar migraciones nuevas a una base que ya existe, sin
// borrarla: lleva la cuenta en schema_migrations y solo corre lo que falta.
async function main() {
  // El search_path por defecto del rol, fijado del lado del servidor.
  //
  // Las consultas de la app usan nombres sin calificar (FROM products), así que
  // dependen de él. Un dump de pg_dump arranca poniéndolo vacío a nivel de
  // SESIÓN y, con un pooler en modo transacción (el endpoint -pooler de Neon),
  // esa configuración se queda pegada a la conexión reutilizada. Guardarlo como
  // valor por defecto del rol sobrevive a eso, y no usa el parámetro de arranque
  // `options`, que el pooler rechaza con 08P01.
  await pool.query('SET search_path TO public');
  try {
    await pool.query(
      `DO $$ BEGIN
         EXECUTE format('ALTER ROLE %I IN DATABASE %I SET search_path TO public',
                        current_user, current_database());
       END $$;`,
    );
  } catch (err) {
    console.warn(`⚠️  No se pudo fijar el search_path por defecto del rol: ${err.message}`);
    console.warn('   Si la app falla con \'relation "products" does not exist\', ejecútalo a mano:');
    console.warn('   ALTER ROLE <tu_usuario> IN DATABASE <tu_base> SET search_path TO public;');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

  const { rows: applied } = await pool.query('SELECT filename FROM schema_migrations');
  const done = new Set(applied.map((r) => r.filename));

  // Base creada por Docker antes de que existiera este registro: sus migraciones
  // ya corrieron aunque no estén anotadas. Se marcan las que crearon el esquema
  // que ya está en la base, para no intentar recrearlo.
  if (done.size === 0) {
    const { rows } = await pool.query(`SELECT to_regclass('public.products') IS NOT NULL AS exists`);
    if (rows[0].exists) {
      const legacy = files.filter((f) => f.startsWith('001') || f.startsWith('002'));
      for (const f of legacy) {
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [f]);
        done.add(f);
      }
      console.log(`ℹ️  Base existente: ${legacy.length} migración(es) marcadas como ya aplicadas.`);
    }
  }

  const pending = files.filter((f) => !done.has(f));
  if (pending.length === 0) {
    console.log('✅ La base ya está al día.');
    return;
  }

  for (const file of pending) {
    const sql = await fs.readFile(path.join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ ${file}: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }
}

try {
  await main();
} catch (err) {
  // Sin esto el fallo salía sin explicación: la conexión puede romperse antes
  // de llegar a ejecutar ninguna migración.
  console.error(`\n❌ La migración falló: ${err.message}`);
  if (err.code) console.error(`   código: ${err.code}`);

  const pistas = {
    ENOTFOUND: 'No se resolvió el host. Revisa que DATABASE_URL esté completa y bien escrita.',
    ECONNREFUSED: '¿Está encendida la base? En local: npm run db:up',
    ETIMEDOUT: 'La base no respondió a tiempo. Si es Neon, puede estar despertando: reintenta.',
    '28P01': 'Usuario o contraseña incorrectos en DATABASE_URL.',
    '3D000': 'La base de datos indicada en DATABASE_URL no existe.',
    '28000': 'El usuario no tiene permiso para conectarse a esa base.',
  };
  if (pistas[err.code]) console.error(`   ${pistas[err.code]}`);
  if (/self-signed|certificate|SSL|TLS/i.test(err.message)) {
    console.error('   Parece un problema de certificado TLS: la base gestionada debe exponer un certificado válido.');
  }

  const url = process.env.DATABASE_URL ?? '';
  console.error(`   DATABASE_URL apunta a: ${url ? url.replace(/\/\/[^@]*@/, '//***@') : '(vacía)'}`);

  process.exitCode = 1;
} finally {
  await pool.end();
}
