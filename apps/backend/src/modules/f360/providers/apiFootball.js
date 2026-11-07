/**
 * Proveedor real: API-Football (api-sports.io), versión 3.
 *
 * Cada consulta cuenta para el tope diario del plan, así que este módulo no
 * decide cuándo consultar: eso lo hace sync.service.js con su presupuesto.
 * Aquí solo se traduce la respuesta del proveedor a la forma de la app.
 *
 * Ojo con el plan gratuito: históricamente solo deja consultar algunas
 * temporadas pasadas. Si la temporada actual no está cubierta, el proveedor no
 * devuelve partidos sino un mensaje de error en `errors`, que se guarda y se ve
 * en GET /api/f360/estado.
 */
import { env } from '../../../config/env.js';
import { describirLiga, ES_ELIMINATORIA } from './ligas.js';


// Estados del proveedor → estado de la app.
const ESTADOS = {
  TBD: 'scheduled',
  NS: 'scheduled',
  '1H': 'live',
  HT: 'live',
  '2H': 'live',
  ET: 'live',
  BT: 'live',
  P: 'live',
  SUSP: 'live',
  INT: 'live',
  LIVE: 'live',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'cancelled',
  AWD: 'cancelled',
  WO: 'cancelled',
};

const DETALLES = {
  NS: 'Por jugar',
  TBD: 'Por confirmar',
  '1H': 'Primer tiempo',
  HT: 'Entretiempo',
  '2H': 'Segundo tiempo',
  ET: 'Prórroga',
  BT: 'Descanso de la prórroga',
  P: 'Penales',
  SUSP: 'Suspendido',
  INT: 'Interrumpido',
  FT: 'Finalizado',
  AET: 'Final (prórroga)',
  PEN: 'Final (penales)',
  PST: 'Aplazado',
  CANC: 'Cancelado',
  ABD: 'Abandonado',
  AWD: 'Resultado administrativo',
  WO: 'Walkover',
};

export class ErrorProveedor extends Error {}

/** El proveedor manda los errores en el cuerpo, a veces como objeto, a veces como arreglo. */
function erroresDe(cuerpo) {
  const e = cuerpo?.errors;
  if (!e) return null;
  const lista = Array.isArray(e) ? e : Object.values(e);
  return lista.length ? lista.map(String).join(' · ') : null;
}

export function crearApiFootball({ contarConsulta }) {
  async function pedir(ruta, params) {
    await contarConsulta();
    const url = new URL(ruta, env.API_FOOTBALL_URL);
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v));
    const res = await fetch(url, {
      headers: { 'x-apisports-key': env.API_FOOTBALL_KEY },
      signal: AbortSignal.timeout(8000),
    });
    const cuerpo = await res.json().catch(() => null);
    if (!res.ok) throw new ErrorProveedor(`API-Football respondió ${res.status}`);
    const error = erroresDe(cuerpo);
    if (error) throw new ErrorProveedor(`API-Football: ${error}`);
    return cuerpo?.response ?? [];
  }

  const traducir = (f) => {
    const corto = f.fixture?.status?.short;
    const ronda = f.league?.round ?? null;
    const ganador = f.teams?.home?.winner === true ? 'home' : f.teams?.away?.winner === true ? 'away' : null;
    const status = ESTADOS[corto] ?? 'scheduled';
    return {
      providerId: String(f.fixture.id),
      leagueProviderId: String(f.league.id),
      kickoffAt: f.fixture.date,
      status,
      statusDetail: DETALLES[corto] ?? f.fixture?.status?.long ?? null,
      minute: f.fixture?.status?.elapsed ?? null,
      round: ronda,
      venue: f.fixture?.venue?.name ?? null,
      home: { providerId: String(f.teams.home.id), name: f.teams.home.name, logo: f.teams.home.logo ?? null },
      away: { providerId: String(f.teams.away.id), name: f.teams.away.name, logo: f.teams.away.logo ?? null },
      goals: { home: f.goals?.home ?? null, away: f.goals?.away ?? null },
      // `fulltime` es el marcador al terminar los 90: con eso se liquida.
      fulltime: { home: f.score?.fulltime?.home ?? null, away: f.score?.fulltime?.away ?? null },
      winner: status === 'finished' ? (ganador ?? 'draw') : null,
      isKnockout: Boolean(ronda && ES_ELIMINATORIA.test(ronda)),
      leagueName: f.league?.name,
      leagueLogo: f.league?.logo ?? null,
    };
  };

  return {
    nombre: 'api-football',
    cuentaConsultas: true,

    ligas(ids, temporada) {
      return ids.map((id) => describirLiga(Number(id), temporada));
    },

    /** Partidos de una liga entre dos días antes y dos semanas después. */
    async partidos(ligaId, ahora = new Date()) {
      const dia = (d) => new Date(ahora.getTime() + d * 864e5).toISOString().slice(0, 10);
      const filas = await pedir('/fixtures', {
        league: ligaId,
        season: env.F360_TEMPORADA,
        from: dia(-2),
        to: dia(14),
        timezone: 'America/Bogota',
      });
      return filas.map(traducir);
    },

    /** Todo lo que está en vivo en las ligas seguidas: una sola consulta. */
    async enVivo(ligaIds) {
      const filas = await pedir('/fixtures', { live: ligaIds.join('-'), timezone: 'America/Bogota' });
      return filas.map(traducir);
    },

    /** Hasta 20 partidos concretos por consulta. */
    async porIds(ids) {
      const salida = [];
      for (let i = 0; i < ids.length; i += 20) {
        const filas = await pedir('/fixtures', { ids: ids.slice(i, i + 20).join('-'), timezone: 'America/Bogota' });
        salida.push(...filas.map(traducir));
      }
      return salida;
    },

    async tabla(ligaId) {
      const filas = await pedir('/standings', { league: ligaId, season: env.F360_TEMPORADA });
      // Una liga puede traer varias tablas (grupos, cuadrangulares): se juntan.
      const grupos = filas[0]?.league?.standings ?? [];
      return grupos.flat().map((t) => ({
        teamProviderId: String(t.team.id),
        teamName: t.team.name,
        teamLogo: t.team.logo ?? null,
        jugados: t.all?.played ?? 0,
        golesFavor: t.all?.goals?.for ?? 0,
        golesContra: t.all?.goals?.against ?? 0,
      }));
    },

    /**
     * Cuotas de un día de una liga, del primer corredor que las tenga.
     * Devuelve Map(idPartido → [{ type, line, selections: [{ code, label, odds }] }]).
     */
    async cuotas(ligaId, fecha) {
      const filas = await pedir('/odds', { league: ligaId, season: env.F360_TEMPORADA, date: fecha });
      const mapa = new Map();
      for (const fila of filas) {
        const apuestas = fila.bookmakers?.[0]?.bets ?? [];
        const mercados = traducirCuotas(apuestas);
        if (mercados.length) mapa.set(String(fila.fixture.id), mercados);
      }
      return mapa;
    },
  };
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1.01 ? Math.round(n * 100) / 100 : null;
};

/** Mercados del proveedor → los de la app. Lo que no reconoce, lo ignora. */
export function traducirCuotas(apuestas) {
  const por = (nombre) => apuestas.find((b) => b.name === nombre)?.values ?? [];
  const valor = (lista, v) => num(lista.find((x) => String(x.value) === v)?.odd);
  const salida = [];

  const mw = por('Match Winner');
  if (mw.length) {
    salida.push({
      type: '1x2',
      line: 0,
      selections: [
        { code: '1', odds: valor(mw, 'Home') },
        { code: 'X', odds: valor(mw, 'Draw') },
        { code: '2', odds: valor(mw, 'Away') },
      ],
    });
  }

  const dc = por('Double Chance');
  if (dc.length) {
    salida.push({
      type: 'dc',
      line: 0,
      selections: [
        { code: '1X', odds: valor(dc, 'Home/Draw') },
        { code: '12', odds: valor(dc, 'Home/Away') },
        { code: 'X2', odds: valor(dc, 'Draw/Away') },
      ],
    });
  }

  const ou = por('Goals Over/Under');
  for (const linea of [1.5, 2.5, 3.5]) {
    const mas = valor(ou, `Over ${linea}`);
    const menos = valor(ou, `Under ${linea}`);
    if (mas && menos) {
      salida.push({
        type: 'ou',
        line: linea,
        selections: [
          { code: 'over', odds: mas },
          { code: 'under', odds: menos },
        ],
      });
    }
  }

  const btts = por('Both Teams Score');
  if (btts.length) {
    salida.push({
      type: 'btts',
      line: 0,
      selections: [
        { code: 'yes', odds: valor(btts, 'Yes') },
        { code: 'no', odds: valor(btts, 'No') },
      ],
    });
  }

  const cs = por('Exact Score');
  if (cs.length) {
    salida.push({
      type: 'cs',
      line: 0,
      selections: cs.map((x) => ({ code: String(x.value), odds: num(x.odd) })),
    });
  }

  // Un mercado al que le falta una salida no se publica: no se puede apostar
  // a medias ni liquidar bien.
  return salida
    .map((m) => ({ ...m, selections: m.selections.filter((s) => s.odds) }))
    .filter((m) => m.selections.length >= 2);
}
