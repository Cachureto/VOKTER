// Hermes trae Intl completo en Android, pero hay respaldo manual por si alguna
// build sale sin ICU.
const ZONA = 'America/Bogota';

export function formatCOP(value) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$ ${Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('es-CO').format(n);
  } catch {
    return String(n);
  }
}

/** Cuota con dos decimales y punto, como en la plantilla: 2.85 */
export const formatOdds = (o) => (Number(o) || 0).toFixed(2);

function partes(iso) {
  const d = new Date(iso);
  try {
    const f = new Intl.DateTimeFormat('es-CO', {
      timeZone: ZONA,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d);
    const v = (t) => f.find((p) => p.type === t)?.value ?? '';
    return { dia: v('weekday').replace('.', ''), num: v('day'), mes: v('month').replace('.', ''), hora: `${v('hour')}:${v('minute')}` };
  } catch {
    return { dia: '', num: d.getDate(), mes: '', hora: d.toTimeString().slice(0, 5) };
  }
}

const fechaBogota = (d) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

/** "21:55" */
export const formatTime = (iso) => partes(iso).hora;

/** "Hoy 20:00", "Mañana 15:30" o "sáb 8 nov 18:00", en hora de Colombia. */
export function formatKickoff(iso) {
  const d = new Date(iso);
  const hoy = fechaBogota(new Date());
  const manana = fechaBogota(new Date(Date.now() + 864e5));
  const dia = fechaBogota(d);
  const p = partes(iso);
  if (dia === hoy) return `Hoy ${p.hora}`;
  if (dia === manana) return `Mañana ${p.hora}`;
  return `${p.dia} ${p.num} ${p.mes} ${p.hora}`;
}

export function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA }).format(
      new Date(iso),
    );
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

export function formatDateTime(iso) {
  const p = partes(iso);
  return `${p.num} ${p.mes} · ${p.hora}`;
}

/** Código corto de un boleto para mostrar: "#E020F777". */
export const codigoBoleto = (id) => `#${String(id).replace(/-/g, '').slice(0, 8).toUpperCase()}`;
