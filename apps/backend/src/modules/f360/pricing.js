/**
 * Modelo de cuotas propio.
 *
 * Se usa cuando el proveedor no trae cuotas para un partido (pasa a menudo con
 * ligas como la colombiana en los planes gratuitos) y en el modo demostración.
 *
 * Es el modelo clásico de Poisson: cada equipo marca un número de goles que
 * sigue una distribución de Poisson cuya media depende de su ataque, de la
 * defensa del rival y de la ventaja de jugar en casa. Con la matriz de
 * marcadores salen todas las probabilidades, y la cuota es el inverso de la
 * probabilidad con un margen para la casa.
 */

const MAX_GOLES = 10;

// Margen de la casa por mercado. Marcador exacto lleva más porque tiene muchas
// salidas y una estimación más incierta.
const MARGEN = { '1x2': 0.06, dc: 0.05, ou: 0.06, btts: 0.06, cs: 0.18, qualify: 0.06 };

export const LINEAS_OU = [1.5, 2.5, 3.5];

const MARCADORES = [];
for (let h = 0; h <= 4; h++) for (let a = 0; a <= 4; a++) MARCADORES.push(`${h}:${a}`);

function poisson(k, lambda) {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

/**
 * Goles esperados de cada equipo.
 *
 * `fuerzas` son índices relativos a la media de la liga (1 = promedio). Se
 * encogen hacia 1 según los partidos jugados: con tres fechas una racha no
 * dice gran cosa, y sin esto un equipo que ganó 4-0 la primera fecha saldría
 * favorito absoluto toda la temporada.
 */
export function golesEsperados({ local, visitante, neutral = false }) {
  const encoger = (valor, jugados) => ((jugados ?? 0) * (valor ?? 1) + 6) / ((jugados ?? 0) + 6);
  const ataL = encoger(local?.ataque, local?.jugados);
  const defL = encoger(local?.defensa, local?.jugados);
  const ataV = encoger(visitante?.ataque, visitante?.jugados);
  const defV = encoger(visitante?.defensa, visitante?.jugados);
  const baseLocal = neutral ? 1.3 : 1.45;
  const baseVisita = neutral ? 1.3 : 1.1;
  return {
    local: Math.min(4.5, Math.max(0.2, baseLocal * ataL * defV)),
    visitante: Math.min(4.5, Math.max(0.2, baseVisita * ataV * defL)),
  };
}

function cuota(prob, margen) {
  if (!(prob > 0)) return null;
  const c = 1 / (prob * (1 + margen));
  return Math.min(500, Math.max(1.01, Math.round(c * 100) / 100));
}

/**
 * Todas las selecciones de un partido.
 * Devuelve [{ type, line, selections: [{ code, label, odds, sort }] }].
 */
export function cuotasDelModelo({ lambdaLocal, lambdaVisitante, local = 'Local', visitante = 'Visitante', eliminatoria = false }) {
  const pL = [];
  const pV = [];
  for (let g = 0; g <= MAX_GOLES; g++) {
    pL.push(poisson(g, lambdaLocal));
    pV.push(poisson(g, lambdaVisitante));
  }

  let gana = 0;
  let empate = 0;
  let pierde = 0;
  let ambos = 0;
  const total = new Array(2 * MAX_GOLES + 1).fill(0);
  const marcador = {};
  for (let h = 0; h <= MAX_GOLES; h++) {
    for (let a = 0; a <= MAX_GOLES; a++) {
      const p = pL[h] * pV[a];
      if (h > a) gana += p;
      else if (h === a) empate += p;
      else pierde += p;
      if (h > 0 && a > 0) ambos += p;
      total[h + a] += p;
      marcador[`${h}:${a}`] = p;
    }
  }

  const mercados = [
    {
      type: '1x2',
      line: 0,
      selections: [
        { code: '1', label: local, prob: gana },
        { code: 'X', label: 'Empate', prob: empate },
        { code: '2', label: visitante, prob: pierde },
      ],
    },
    {
      type: 'dc',
      line: 0,
      selections: [
        { code: '1X', label: `${local} o empate`, prob: gana + empate },
        { code: '12', label: `${local} o ${visitante}`, prob: gana + pierde },
        { code: 'X2', label: `Empate o ${visitante}`, prob: empate + pierde },
      ],
    },
    ...LINEAS_OU.map((linea) => {
      let menos = 0;
      for (let t = 0; t < total.length; t++) if (t < linea) menos += total[t];
      return {
        type: 'ou',
        line: linea,
        selections: [
          { code: 'over', label: `Más de ${linea}`, prob: 1 - menos },
          { code: 'under', label: `Menos de ${linea}`, prob: menos },
        ],
      };
    }),
    {
      type: 'btts',
      line: 0,
      selections: [
        { code: 'yes', label: 'Sí', prob: ambos },
        { code: 'no', label: 'No', prob: 1 - ambos },
      ],
    },
    {
      type: 'cs',
      line: 0,
      selections: [
        ...MARCADORES.map((m) => ({ code: m, label: m.replace(':', ' - '), prob: marcador[m] })),
        {
          code: 'otro',
          label: 'Otro marcador',
          prob: 1 - MARCADORES.reduce((s, m) => s + marcador[m], 0),
        },
      ],
    },
  ];

  if (eliminatoria) {
    // Si empatan en los 90 se decide en prórroga o penales: se reparte el
    // empate según la fuerza relativa, que es lo más honesto sin más datos.
    const peso = lambdaLocal / (lambdaLocal + lambdaVisitante);
    mercados.push({
      type: 'qualify',
      line: 0,
      selections: [
        { code: '1', label: local, prob: gana + empate * peso },
        { code: '2', label: visitante, prob: pierde + empate * (1 - peso) },
      ],
    });
  }

  return mercados.map((m) => ({
    type: m.type,
    line: m.line,
    selections: m.selections
      .map((s, i) => ({ code: s.code, label: s.label, odds: cuota(s.prob, MARGEN[m.type]), sort: i }))
      .filter((s) => s.odds !== null),
  }));
}

/**
 * Fuerzas de cada equipo a partir de la tabla de posiciones.
 * `tabla`: [{ teamProviderId, jugados, golesFavor, golesContra }].
 */
export function fuerzasDesdeTabla(tabla) {
  const conPartidos = tabla.filter((t) => t.jugados > 0);
  if (conPartidos.length === 0) return new Map();
  const media =
    conPartidos.reduce((s, t) => s + t.golesFavor / t.jugados, 0) / conPartidos.length || 1;
  return new Map(
    tabla.map((t) => [
      String(t.teamProviderId),
      t.jugados > 0
        ? {
            ataque: t.golesFavor / t.jugados / media,
            defensa: t.golesContra / t.jugados / media,
            jugados: t.jugados,
          }
        : { ataque: 1, defensa: 1, jugados: 0 },
    ]),
  );
}
