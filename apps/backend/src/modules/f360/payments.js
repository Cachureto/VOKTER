/**
 * Pasarela de pagos.
 *
 * Toda la app trabaja contra esta interfaz, así que conectar una pasarela real
 * (Wompi, PSE vía un agregador, Mercado Pago…) es implementar `crearDeposito`
 * y `crearRetiro` para ella y un webhook que llame a `completarDeposito` del
 * servicio de billetera. No hay ninguna real implementada: sin las credenciales
 * de comercio no se puede probar, y operar con dinero real en Colombia exige
 * además la autorización de Coljuegos.
 *
 * Modo "pruebas": aprueba al instante y no mueve dinero. Es el que usa la app
 * mientras no haya una pasarela de verdad, y la app lo indica en pantalla.
 */
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { serviceUnavailable } from '../../utils/httpError.js';

const pruebas = {
  nombre: 'pruebas',
  dineroReal: false,
  async crearDeposito({ amountCop, method }) {
    return { status: 'completed', ref: `PRU-DEP-${crypto.randomUUID()}`, method, amountCop };
  },
  async crearRetiro({ amountCop }) {
    return { status: 'completed', ref: `PRU-RET-${crypto.randomUUID()}`, amountCop };
  },
};

export function pasarela() {
  if (env.F360_PAGOS === 'pruebas') return pruebas;
  // Modo real pedido pero sin pasarela: se niega con un motivo claro en vez de
  // fingir que cobra.
  if (!env.F360_LICENCIA_COLJUEGOS) {
    throw serviceUnavailable(
      'Los pagos con dinero real están desactivados: falta la licencia de Coljuegos (F360_LICENCIA_COLJUEGOS).',
    );
  }
  throw serviceUnavailable('No hay una pasarela de pagos configurada para dinero real.');
}

export function modoDePagos() {
  return env.F360_PAGOS;
}
