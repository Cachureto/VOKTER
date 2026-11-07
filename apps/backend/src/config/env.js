import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  AI_MODEL: z.string().default('gemini-3.6-flash'),
  GEMINI_API_KEY: z.string().optional(),

  // --- Fanáticos 360 (todo opcional: sin nada de esto la tienda arranca igual) ---
  // Clave de sus tokens. Si falta se deriva de JWT_ACCESS_SECRET (ver f360/tokens.js).
  F360_JWT_SECRET: z.string().min(32, 'F360_JWT_SECRET debe tener al menos 32 caracteres').optional(),
  // Clave de API-Football. Sin ella la app usa partidos de demostración.
  API_FOOTBALL_KEY: z.string().optional(),
  // Solo cambia si se contrata por RapidAPI, que usa otro dominio.
  API_FOOTBALL_URL: z.url().default('https://v3.football.api-sports.io'),
  // auto = API-Football si hay clave, demostración si no.
  F360_PROVEEDOR: z.enum(['auto', 'api-football', 'demo']).default('auto'),
  // IDs de API-Football separados por coma, y la temporada que se consulta.
  F360_LIGAS: z.string().default('239,241,1'),
  F360_TEMPORADA: z.coerce.number().int().default(new Date().getFullYear()),
  // Tope propio de consultas por día (el plan gratuito de API-Football da 100).
  F360_API_PRESUPUESTO_DIARIO: z.coerce.number().int().positive().default(90),
  F360_SYNC_PARTIDOS_MIN: z.coerce.number().int().positive().default(180),
  F360_SYNC_VIVO_MIN: z.coerce.number().int().positive().default(5),
  F360_SYNC_CUOTAS_MIN: z.coerce.number().int().positive().default(360),
  // pruebas = pagos simulados. real exige una pasarela y licencia de Coljuegos.
  F360_PAGOS: z.enum(['pruebas', 'real']).default('pruebas'),
  F360_LICENCIA_COLJUEGOS: z.string().optional(),
  // Token para forzar una sincronización desde un cron (POST /api/f360/ops/sync).
  F360_OPS_TOKEN: z.string().min(16).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((o) => o.trim()),
};