import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

/**
 * Lenguaje de movimiento de la app: las mismas curvas y resortes en todas
 * partes, para que cada animación se sienta de la misma familia.
 */

// Si el teléfono pide reducir movimiento, todo aparece directo. Se lee una vez
// al arrancar y se actualiza si el usuario lo cambia con la app abierta.
let reducir = false;
const oyentes = new Set();
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => {
    reducir = v;
    oyentes.forEach((fn) => fn(v));
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => {
  reducir = v;
  oyentes.forEach((fn) => fn(v));
});

export const movimientoReducido = () => reducir;

export function useMovimientoReducido() {
  const [v, setV] = useState(reducir);
  useEffect(() => {
    oyentes.add(setV);
    return () => oyentes.delete(setV);
  }, []);
  return v;
}

export const CURVAS = {
  // Entrada: arranca rápido y frena largo, sin rebote.
  entrar: Easing.bezier(0.16, 1, 0.3, 1),
  // Salida: suave en los dos extremos.
  salir: Easing.bezier(0.65, 0, 0.35, 1),
  // Cambios de estado (acordeón, selector): decidido pero sin brusquedad.
  estado: Easing.bezier(0.22, 1, 0.36, 1),
};

export const RESORTES = {
  // Al hundir un botón: firme y rápido.
  presionar: { speed: 40, bounciness: 0 },
  // Al soltarlo: vuelve con un pequeño rebote.
  soltar: { speed: 18, bounciness: 10 },
  // "Pop" de algo que acaba de activarse (una cuota elegida, un contador).
  pop: { speed: 14, bounciness: 14 },
  // Desplazamientos (indicador del selector, paneles).
  deslizar: { speed: 16, bounciness: 4 },
};
