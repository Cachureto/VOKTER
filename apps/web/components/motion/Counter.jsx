'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

/**
 * Cuenta de 0 al valor dado cuando el número entra en pantalla.
 *
 * Se anima con requestAnimationFrame y no con un valor de Motion porque lo
 * que cambia es texto, no una propiedad CSS: así el número que queda en el
 * DOM es el real y se puede seleccionar y leer con un lector de pantalla.
 *
 * El valor final se pinta desde el servidor (`value` ya viene resuelto), de
 * modo que sin JavaScript la cifra correcta igualmente se ve.
 */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function Counter({
  value,
  duration = 1600,
  prefix = '',
  suffix = '',
  className,
  /** Cómo formatear el número; por defecto, separador de miles local. */
  format = (n) => n.toLocaleString('es-CO'),
}) {
  const ref = useRef(null);
  const enPantalla = useInView(ref, { once: true, amount: 0.6 });
  const sinMovimiento = useReducedMotion();
  const objetivo = Number(value) || 0;
  const [actual, setActual] = useState(objetivo);

  // El estado arranca en el valor final para que el HTML del servidor y el
  // del primer render del cliente coincidan; la cuenta empieza al entrar en
  // pantalla. Sin esto React avisaría de un desajuste de hidratación.
  useEffect(() => {
    if (!enPantalla || sinMovimiento) {
      setActual(objetivo);
      return undefined;
    }

    let frame;
    const inicio = performance.now();

    const paso = (ahora) => {
      const avance = Math.min((ahora - inicio) / duration, 1);
      setActual(Math.round(easeOutExpo(avance) * objetivo));
      if (avance < 1) frame = requestAnimationFrame(paso);
    };

    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [enPantalla, sinMovimiento, objetivo, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(actual)}
      {suffix}
    </span>
  );
}
