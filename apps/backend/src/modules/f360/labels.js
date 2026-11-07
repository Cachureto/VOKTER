/** Texto de cada selección, igual venga del modelo o del proveedor. */
export function etiqueta(type, line, code, local, visitante) {
  switch (type) {
    case '1x2':
      return { 1: local, X: 'Empate', 2: visitante }[code] ?? code;
    case 'dc':
      return { '1X': `${local} o empate`, 12: `${local} o ${visitante}`, X2: `Empate o ${visitante}` }[code] ?? code;
    case 'ou':
      return code === 'over' ? `Más de ${Number(line)}` : `Menos de ${Number(line)}`;
    case 'btts':
      return code === 'yes' ? 'Sí' : 'No';
    case 'cs':
      return code === 'otro' ? 'Otro marcador' : code.replace(':', ' - ');
    case 'qualify':
      return code === '1' ? local : visitante;
    default:
      return code;
  }
}

export const NOMBRES_MERCADO = {
  '1x2': 'Ganador del partido',
  dc: 'Doble oportunidad',
  ou: 'Más/Menos goles',
  btts: 'Ambos marcan',
  cs: 'Marcador exacto',
  qualify: 'Clasifica',
};

// Orden en que se muestran en la ficha del partido.
export const ORDEN_MERCADOS = ['1x2', 'dc', 'ou', 'btts', 'qualify', 'cs'];
