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
  dark: conTonos({
    background: '#0b0f15',
    surface: '#141920',
    surface2: '#1b2129',
    surfaceHover: '#222932',
    border: '#232a33',
    borderStrong: '#363e49',
    foreground: '#ffffff',
    muted: '#9aa1ab',
    subtle: '#646c77',
    // "Contraste": blanco en oscuro, para chips y estados activos neutros.
    contrast: '#ffffff',
    contrastForeground: '#0b0f15',
    // Dorado de la marca. Sobre él va texto oscuro.
    accent: '#e9b931',
    accentHover: '#f3c94a',
    accentBright: '#f8d867',
    accentForeground: '#1a1405',
    // El "360" del logo.
    orange: '#f5a20f',
    teal: '#2dd4bf',
    live: '#22c55e',
    danger: '#f05252',
    warning: '#f5a20f',
    tile: '#1b2129',
  }),
  light: conTonos({
    background: '#f5f4ef',
    surface: '#ffffff',
    surface2: '#efede6',
    surfaceHover: '#e8e5dc',
    border: '#e4e0d5',
    borderStrong: '#cfc9ba',
    foreground: '#14171c',
    muted: '#5b616b',
    subtle: '#8d929a',
    contrast: '#14171c',
    contrastForeground: '#ffffff',
    // Sobre blanco el dorado claro no se lee como texto (2:1). Este oscuro sí.
    accent: '#b8860b',
    accentHover: '#a07408',
    accentBright: '#8f6905',
    accentForeground: '#ffffff',
    orange: '#d97706',
    teal: '#0f9488',
    live: '#15803d',
    danger: '#c42626',
    warning: '#b45309',
    tile: '#efede6',
  }),
};

// El botón dorado lleno conserva el dorado vivo de la marca en los dos temas:
// con texto oscuro encima se lee igual de bien sobre fondo claro u oscuro.
export const DORADO = { fondo: '#e9b931', brillo: '#f8d867', texto: '#1a1405' };
