// Paleta de Fanáticos 360: azul noche, tarjetas grafito y dorado.
// Los nombres de los tokens son los de siempre, así los componentes que ya
// existían (campos, menú, acordeón) se pintan solos con la marca nueva.

// '#rrggbb' + opacidad → 'rgba(...)', para fondos y bordes tenues.
export function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function conTonos(base) {
  return {
    ...base,
    accentSoft: alpha(base.accent, 0.14),
    accentLine: alpha(base.accent, 0.4),
    liveSoft: alpha(base.live, 0.12),
    liveLine: alpha(base.live, 0.35),
    dangerSoft: alpha(base.danger, 0.12),
    dangerLine: alpha(base.danger, 0.35),
    warningSoft: alpha(base.warning, 0.12),
    warningLine: alpha(base.warning, 0.35),
    teal: base.teal,
    tealSoft: alpha(base.teal, 0.18),
    orangeSoft: alpha(base.orange, 0.18),
  };
}

export const palettes = {
  // Oscuro: casi negro azulado, superficies apenas más claras y bordes de
  // un pelo (blanco al 7%), como las apps actuales. El dorado se reserva para
  // lo accionable: cuotas, botones principales y estados activos.
  dark: conTonos({
    background: '#07090d',
    surface: '#0f131a',
    surface2: '#161b24',
    surfaceHover: '#1d232e',
    border: 'rgba(255,255,255,0.07)',
    borderStrong: 'rgba(255,255,255,0.14)',
    foreground: '#f5f7fa',
    muted: '#8b93a1',
    subtle: '#5b6371',
    // "Contraste": blanco en oscuro, para chips y estados activos neutros.
    contrast: '#f5f7fa',
    contrastForeground: '#07090d',
    // Dorado de la marca. Sobre él va texto oscuro.
    accent: '#f0bf3a',
    accentHover: '#f6cc55',
    accentBright: '#f8d867',
    accentForeground: '#1a1405',
    // El "360" del logo.
    orange: '#f5a20f',
    teal: '#2dd4bf',
    live: '#22c55e',
    danger: '#f43f5e',
    warning: '#f59e0b',
    tile: '#161b24',
  }),
  // Claro: gris neutro frío de fondo y tarjetas blancas.
  light: conTonos({
    background: '#f3f4f6',
    surface: '#ffffff',
    surface2: '#eef0f3',
    surfaceHover: '#e5e8ec',
    border: 'rgba(15,23,42,0.08)',
    borderStrong: 'rgba(15,23,42,0.16)',
    foreground: '#0f141a',
    muted: '#5b6472',
    subtle: '#8a929e',
    contrast: '#0f141a',
    contrastForeground: '#ffffff',
    // Sobre blanco el dorado claro no se lee como texto (2:1). Este oscuro sí.
    accent: '#b8860b',
    accentHover: '#a07408',
    accentBright: '#8f6905',
    accentForeground: '#ffffff',
    orange: '#d97706',
    teal: '#0f9488',
    live: '#16a34a',
    danger: '#e11d48',
    warning: '#b45309',
    tile: '#eef0f3',
  }),
};

// El botón dorado lleno conserva el dorado vivo de la marca en los dos temas:
// con texto oscuro encima se lee igual de bien sobre fondo claro u oscuro.
export const DORADO = { fondo: '#f0bf3a', brillo: '#f8d867', texto: '#1a1405' };
