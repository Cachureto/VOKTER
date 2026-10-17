// Formato de precio igual que la web (apps/web/lib/format.js).
// Hermes trae Intl completo en Android, pero dejamos un respaldo manual por si
// alguna build sale sin ICU.
export function formatCOP(value) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
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

/** "16 de octubre de 2026" en hora de Bogotá, igual que la web. */
export function formatDate(iso) {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bogota',
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}
