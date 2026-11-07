/**
 * Liquidación: cuándo gana, pierde o se anula cada selección, y luego cada
 * boleto. Todo con el marcador de los 90 minutos (más el descuento), como en
 * cualquier casa de apuestas, salvo "Clasifica", que cuenta prórroga y penales.
 */
import { badRequest } from '../../utils/httpError.js';

/**
 * Pago de una apuesta, en pesos enteros.
 *
 * Nunca `Math.floor(apuesta * cuota)`: en coma flotante 10000 × 2.78 da
 * 27799.999999999996 y el usuario perdería un peso. La cuota se pasa a
 * centésimas enteras primero, y el producto de dos enteros es exacto.
 */
export function pagoEnPesos(stakeCop, cuota) {
  return Math.floor((Number(stakeCop) * Math.round(Number(cuota) * 100)) / 100);
}

export function resultadoSeleccion(mercado, codigo, partido, codigosDelMercado = []) {
  if (partido.status === 'cancelled') return 'void';
  if (partido.status !== 'finished') return null;

  const h = partido.home_goals_ft ?? partido.home_goals;
  const a = partido.away_goals_ft ?? partido.away_goals;
  if (h == null || a == null) return null;
  const gana = (cond) => (cond ? 'won' : 'lost');

  switch (mercado.type) {
    case '1x2':
      return gana((codigo === '1' && h > a) || (codigo === 'X' && h === a) || (codigo === '2' && h < a));
    case 'dc':
      return gana(
        (codigo === '1X' && h >= a) || (codigo === '12' && h !== a) || (codigo === 'X2' && h <= a),
      );
    case 'ou': {
      const linea = Number(mercado.line);
      const total = h + a;
      // Las líneas son .5, pero si algún día llega una entera, el empate exacto se devuelve.
      if (total === linea) return 'void';
      return gana(codigo === 'over' ? total > linea : total < linea);
    }
    case 'btts':
      return gana(codigo === 'yes' ? h > 0 && a > 0 : !(h > 0 && a > 0));
    case 'cs': {
      const real = `${h}:${a}`;
      if (codigo === 'otro') return gana(!codigosDelMercado.includes(real));
      return gana(codigo === real);
    }
    case 'qualify':
      if (!partido.winner || partido.winner === 'draw') return 'void';
      return gana((codigo === '1' && partido.winner === 'home') || (codigo === '2' && partido.winner === 'away'));
    default:
      throw badRequest(`Mercado desconocido: ${mercado.type}`);
  }
}

/**
 * Estado final de un boleto a partir de sus tramos.
 * Devuelve null si todavía falta algún partido.
 */
export function resultadoBoleto(tramos, stakeCop) {
  if (tramos.some((t) => t.result == null)) {
    // Un tramo perdido ya decide el combinado aunque falten otros partidos.
    if (tramos.some((t) => t.result === 'lost')) return { status: 'lost', payoutCop: 0 };
    return null;
  }
  if (tramos.some((t) => t.result === 'lost')) return { status: 'lost', payoutCop: 0 };
  if (tramos.every((t) => t.result === 'void')) return { status: 'void', payoutCop: Number(stakeCop) };
  // Un tramo anulado cuenta como cuota 1.00: el combinado sigue con el resto.
  const cuota = tramos.reduce((c, t) => (t.result === 'won' ? c * Number(t.odds) : c), 1);
  return { status: 'won', payoutCop: pagoEnPesos(stakeCop, cuota) };
}
