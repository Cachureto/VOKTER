'use client';

import { motion } from 'motion/react';

/**
 * Revela su contenido cuando entra en pantalla.
 *
 * `once: true` es deliberado: en una tienda, un bloque que se vuelve a
 * desvanecer cada vez que pasas por encima marea y estorba al comparar
 * productos. Se anima una sola vez y se queda quieto.
 *
 * No hace falta comprobar `prefers-reduced-motion` aquí: `app/template.js`
 * envuelve la aplicación en <MotionConfig reducedMotion="user">, que
 * desactiva las animaciones de transformación y opacidad de todo el árbol.
 */
const DESPLAZAMIENTOS = {
  up: { y: 24, x: 0 },
  down: { y: -24, x: 0 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
};

export default function Reveal({
  children,
  as = 'div',
  from = 'up',
  delay = 0,
  duration = 0.6,
  /** Porción del elemento que debe verse para disparar la animación. */
  amount = 0.2,
  className,
  ...rest
}) {
  const Tag = motion[as] ?? motion.div;
  const desde = DESPLAZAMIENTOS[from] ?? DESPLAZAMIENTOS.up;

  return (
    <Tag
      // Motion escribe `opacity: 0` ya en el HTML del servidor. Si el
      // JavaScript no llega a ejecutarse, el bloque se quedaría invisible,
      // así que este atributo le da un asidero al <noscript> de layout.js
      // para devolverlo a la vista.
      data-reveal=""
      className={className}
      initial={{ opacity: 0, ...desde }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
