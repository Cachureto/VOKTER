// Mismos tokens que la web (apps/web/app/globals.css): el bloque `:root`
// es `dark` y el bloque `[data-theme="light"]` es `light`.
// Si cambias un color allá, cámbialo aquí también.

// Convierte '#rrggbb' + opacidad en 'rgba(...)'. Sirve para los fondos y
// bordes tenues de las alertas y badges, que antes estaban escritos a mano
// con los valores del tema oscuro y en modo claro quedaban desentonados.
export function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function conTonos(base) {
  return {
    ...base,
    accentSoft: alpha(base.accent, 0.1),
    accentLine: alpha(base.accent, 0.3),
    liveSoft: alpha(base.live, 0.1),
    liveLine: alpha(base.live, 0.3),
    dangerSoft: alpha(base.danger, 0.1),
    dangerLine: alpha(base.danger, 0.3),
    warningSoft: alpha(base.warning, 0.1),
    warningLine: alpha(base.warning, 0.3),
  };
}

export const palettes = {
  dark: conTonos({
    background: '#050507',
    surface: '#0d0d10',
    surface2: '#141419',
    surfaceHover: '#1b1b22',
    border: '#22222b',
    borderStrong: '#3d3d4b',
    foreground: '#ffffff',
    muted: '#a7a7b4',
    subtle: '#6e6e7c',
    // El blanco como detalle: botón/chip activo de alto contraste.
    contrast: '#ffffff',
    contrastForeground: '#050507',
    accent: '#00a2e8',
    accentHover: '#33b8ef',
    accentBright: '#6fdcff',
    accentForeground: '#050507',
    live: '#3ee089',
    danger: '#ff6b6b',
    warning: '#ffc53d',
    tile: '#ffffff',
  }),
  light: conTonos({
    background: '#ffffff',
    surface: '#f6f6f9',
    surface2: '#eeeef3',
    surfaceHover: '#e5e5ec',
    border: '#e3e3e9',
    borderStrong: '#c7c7d2',
    foreground: '#0a0a0c',
    muted: '#55555f',
    subtle: '#8a8a96',
    contrast: '#0d0d10',
    contrastForeground: '#ffffff',
    // #00a2e8 sobre blanco da 2.4:1 (ilegible en texto); este da 4.96:1.
    accent: '#0a76b0',
    accentHover: '#096293',
    accentBright: '#075a8a',
    accentForeground: '#ffffff',
    live: '#15803d',
    danger: '#c42626',
    warning: '#9a5b00',
    tile: '#f1f1f4',
  }),
};
