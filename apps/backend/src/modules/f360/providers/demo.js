/**
 * Proveedor de demostración.
 *
 * Genera un calendario creíble alrededor de la fecha actual —partidos jugados,
 * en vivo y por jugar— con equipos reales y marcadores simulados. Todo es
 * determinista: el mismo partido siempre tiene el mismo resultado, así que un
 * partido que se vio en vivo termina con el marcador que iba mostrando, y las
 * apuestas se liquidan como en producción.
 *
 * Se usa cuando no hay clave de API-Football. La app lo indica en pantalla:
 * nada de esto es un partido de verdad.
 */
import { describirLiga } from './ligas.js';

// ataque > 1 marca más que el promedio; defensa < 1 recibe menos.
const LIGA_BETPLAY = [
  ['Atlético Nacional', 'NAC', 1.35, 0.8],
  ['Millonarios', 'MIL', 1.25, 0.85],
  ['América de Cali', 'AME', 1.2, 0.9],
  ['Junior', 'JUN', 1.2, 0.9],
  ['Independiente Santa Fe', 'SFE', 1.05, 0.9],
  ['Deportes Tolima', 'TOL', 1.1, 0.9],
  ['Independiente Medellín', 'DIM', 1.1, 1.0],
  ['Deportivo Cali', 'CAL', 1.0, 1.0],
  ['Once Caldas', 'ONC', 1.0, 1.05],
  ['Atlético Bucaramanga', 'BUC', 0.95, 0.9],
  ['Deportivo Pasto', 'PAS', 0.9, 1.0],
  ['Águilas Doradas', 'AGU', 0.9, 1.05],
  ['Deportivo Pereira', 'PER', 0.9, 1.1],
  ['Alianza FC', 'ALI', 0.85, 1.1],
  ['Boyacá Chicó', 'CHI', 0.8, 1.15],
  ['Unión Magdalena', 'UMA', 0.8, 1.2],
];

const SELECCIONES = [
  ['Francia', 'FRA', 1.35, 0.75],
  ['Inglaterra', 'ING', 1.3, 0.8],
  ['Argentina', 'ARG', 1.35, 0.75],
  ['Brasil', 'BRA', 1.35, 0.8],
  ['España', 'ESP', 1.3, 0.8],
  ['Colombia', 'COL', 1.15, 0.85],
  ['Alemania', 'ALE', 1.25, 0.9],
  ['Portugal', 'POR', 1.25, 0.85],
  ['Países Bajos', 'PBA', 1.2, 0.85],
  ['Uruguay', 'URU', 1.05, 0.85],
  ['Croacia', 'CRO', 1.05, 0.9],
  ['Marruecos', 'MAR', 1.0, 0.85],
];

// [liga, lista de equipos, días de la semana con partido (0=domingo), horas en Bogotá]
const CALENDARIO = [
  [239, LIGA_BETPLAY, [0, 1, 2, 3, 4, 5, 6], ['15:00', '17:30', '20:10']],
  [241, LIGA_BETPLAY, [2, 3], ['19:30']],
  [1, SELECCIONES, [0, 5, 6], ['13:00', '17:00']],
];

const DIAS_ATRAS = 3;
const DIAS_ADELANTE = 10;

// Generador pseudoaleatorio con semilla (mulberry32).
function semilla(texto) {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function poissonAleatorio(lambda, rnd) {
  const limite = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rnd();
  } while (p > limite && k < 12);
  return k - 1;
}

const slug = (t) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const fechaBogota = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d);

function equipo([nombre, corto]) {
  return { providerId: `demo-${slug(nombre)}`, name: nombre, shortName: corto, logo: null };
}

/** Marcador "al minuto" a partir de los goles con su minuto. */
function marcadorAlMinuto(goles, minuto) {
  return {
    home: goles.filter((g) => g.lado === 'home' && g.min <= minuto).length,
    away: goles.filter((g) => g.lado === 'away' && g.min <= minuto).length,
  };
}

function construirPartido(ligaId, equipos, dia, hora, indice, ahora) {
  const fecha = new Date(`${dia}T${hora}:00-05:00`);
  const id = `demo-${ligaId}-${dia}-${hora.replace(':', '')}`;
  const rnd = semilla(id);

  // Emparejamiento estable por día: baraja con la semilla del día y toma parejas.
  const orden = [...equipos.keys()];
  const rndDia = semilla(`${ligaId}-${dia}`);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(rndDia() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  const local = equipos[orden[indice * 2]];
  const visita = equipos[orden[indice * 2 + 1]];

  const neutral = ligaId === 1;
  const lambdaL = (neutral ? 1.3 : 1.45) * local[2] * visita[3];
  const lambdaV = (neutral ? 1.3 : 1.1) * visita[2] * local[3];
  const goles = [];
  for (let g = poissonAleatorio(lambdaL, rnd); g > 0; g--) goles.push({ lado: 'home', min: 1 + Math.floor(rnd() * 90) });
  for (let g = poissonAleatorio(lambdaV, rnd); g > 0; g--) goles.push({ lado: 'away', min: 1 + Math.floor(rnd() * 90) });

  const eliminatoria = ligaId !== 239;
  const transcurrido = (ahora - fecha) / 60000;
  let status = 'scheduled';
  let minuto = null;
  let detalle = 'Por jugar';
  if (transcurrido >= 112) {
    status = 'finished';
    detalle = 'Finalizado';
  } else if (transcurrido >= 0) {
    status = 'live';
    // 45' de primer tiempo, 15' de descanso, 45' más el descuento.
    if (transcurrido <= 47) [minuto, detalle] = [Math.max(1, Math.floor(transcurrido)), 'Primer tiempo'];
    else if (transcurrido <= 62) [minuto, detalle] = [45, 'Entretiempo'];
    else [minuto, detalle] = [Math.min(90, Math.floor(transcurrido - 17)), 'Segundo tiempo'];
  }

  const ft = marcadorAlMinuto(goles, 90);
  const actual = status === 'scheduled' ? { home: null, away: null } : marcadorAlMinuto(goles, minuto ?? 90);
  let ganador = null;
  if (status === 'finished') {
    if (ft.home !== ft.away) ganador = ft.home > ft.away ? 'home' : 'away';
    else ganador = eliminatoria ? (rnd() < lambdaL / (lambdaL + lambdaV) ? 'home' : 'away') : 'draw';
  }

  return {
    providerId: id,
    leagueProviderId: String(ligaId),
    kickoffAt: fecha.toISOString(),
    status,
    statusDetail: status === 'finished' && eliminatoria && ft.home === ft.away ? 'Final (penales)' : detalle,
    minute: minuto,
    round: eliminatoria ? (ligaId === 1 ? 'Eliminatoria' : 'Octavos de final') : `Fecha ${Math.abs(Math.floor(new Date(dia) / 864e5)) % 19 + 1}`,
    venue: null,
    home: equipo(local),
    away: equipo(visita),
    goals: actual,
    fulltime: status === 'finished' ? ft : { home: null, away: null },
    winner: ganador,
    isKnockout: eliminatoria,
  };
}

export const demo = {
  nombre: 'demo',
  cuentaConsultas: false,

  async partidos(ligaId, ahora = new Date()) {
    const fila = CALENDARIO.find(([id]) => id === Number(ligaId));
    if (!fila) return [];
    const [, equipos, diasSemana, horas] = fila;
    const salida = [];
    for (let d = -DIAS_ATRAS; d <= DIAS_ADELANTE; d++) {
      const dia = fechaBogota(new Date(ahora.getTime() + d * 864e5));
      const diaSemana = new Date(`${dia}T12:00:00-05:00`).getUTCDay();
      if (!diasSemana.includes(diaSemana)) continue;
      horas.forEach((hora, i) => salida.push(construirPartido(Number(ligaId), equipos, dia, hora, i, ahora)));
    }
    return salida;
  },

  async enVivo(ligaIds, ahora = new Date()) {
    const todos = (await Promise.all(ligaIds.map((id) => this.partidos(id, ahora)))).flat();
    return todos.filter((p) => p.status === 'live');
  },

  async porIds(ids, ahora = new Date()) {
    const ligas = [...new Set(ids.map((id) => id.split('-')[1]))];
    const todos = (await Promise.all(ligas.map((l) => this.partidos(l, ahora)))).flat();
    return todos.filter((p) => ids.includes(p.providerId));
  },

  // Tabla coherente con las fuerzas de cada equipo, para que el modelo de
  // cuotas tenga de dónde partir.
  async tabla(ligaId) {
    const fila = CALENDARIO.find(([id]) => id === Number(ligaId));
    if (!fila) return [];
    return fila[1].map(([nombre, corto, ataque, defensa]) => ({
      teamProviderId: `demo-${slug(nombre)}`,
      teamName: nombre,
      teamShort: corto,
      jugados: 14,
      golesFavor: Math.round(ataque * 1.27 * 14),
      golesContra: Math.round(defensa * 1.27 * 14),
    }));
  },

  async cuotas() {
    return new Map();
  },

  ligas(ids, temporada) {
    return ids.map((id) => describirLiga(Number(id), temporada));
  },
};
