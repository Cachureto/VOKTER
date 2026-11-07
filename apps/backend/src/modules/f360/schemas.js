import { z } from 'zod';

const pesos = (min, max, nombre) =>
  z.coerce
    .number({ error: `${nombre} debe ser un número` })
    .int(`${nombre} debe ser un valor entero en pesos`)
    .min(min, `${nombre} mínimo: $${min.toLocaleString('es-CO')}`)
    .max(max, `${nombre} máximo: $${max.toLocaleString('es-CO')}`);

export const LIMITES = {
  depositoMin: 10_000,
  depositoMax: 5_000_000,
  retiroMin: 20_000,
  retiroMax: 10_000_000,
  apuestaMin: 1_000,
  apuestaMax: 2_000_000,
  pagoMax: 50_000_000,
  seleccionesMax: 10,
};

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  email: z.email('Email inválido').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Máximo 72 caracteres')
    .regex(/[A-Za-z]/, 'Debe tener al menos una letra')
    .regex(/\d/, 'Debe tener al menos un número'),
  documentType: z.enum(['CC', 'CE', 'PA', 'PPT'], { error: 'Tipo de documento inválido' }),
  documentNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{4,20}$/, 'Número de documento inválido'),
  birthDate: z.iso.date('Fecha de nacimiento inválida (AAAA-MM-DD)'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,15}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  acceptTerms: z.literal(true, { error: 'Debes aceptar los términos y confirmar que eres mayor de edad' }),
});

export const loginSchema = z.object({
  email: z.email('Email inválido').trim().toLowerCase(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Falta el refresh token'),
});

export const matchesQuery = z.object({
  league: z.coerce.number().int().positive().optional(),
  status: z.enum(['upcoming', 'live', 'finished', 'all']).default('upcoming'),
  market: z.enum(['1x2', 'dc', 'ou', 'btts', 'cs', 'qualify']).default('1x2'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const depositSchema = z.object({
  amountCop: pesos(LIMITES.depositoMin, LIMITES.depositoMax, 'El depósito'),
  method: z.enum(['pse', 'tarjeta', 'nequi']).default('pse'),
});

export const withdrawSchema = z.object({
  amountCop: pesos(LIMITES.retiroMin, LIMITES.retiroMax, 'El retiro'),
});

export const limitSchema = z.object({
  period: z.enum(['day', 'week', 'month']),
  // null = quitar el límite
  amountCop: z.coerce.number().int().min(10_000, 'El límite mínimo es $10.000').nullable(),
});

export const selfExclusionSchema = z.object({
  days: z.coerce.number().refine((d) => [1, 7, 30, 90, 180, 365].includes(d), 'Periodo no permitido'),
});

export const placeBetSchema = z.object({
  stakeCop: pesos(LIMITES.apuestaMin, LIMITES.apuestaMax, 'La apuesta'),
  selections: z
    .array(
      z.object({
        selectionId: z.coerce.number().int().positive(),
        // La cuota que vio el usuario. Si cambió, se avisa antes de cobrar.
        odds: z.coerce.number().min(1.01),
      }),
    )
    .min(1, 'Agrega al menos una selección')
    .max(LIMITES.seleccionesMax, `Máximo ${LIMITES.seleccionesMax} selecciones por boleto`),
  acceptOddsChanges: z.boolean().default(false),
});

export const betsQuery = z.object({
  status: z.enum(['open', 'settled', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
