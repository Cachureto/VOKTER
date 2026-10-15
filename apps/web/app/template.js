'use client';

import { MotionConfig, motion } from 'motion/react';

/**
 * Transición entre páginas.
 *
 * Es un `template` y no un `layout` a propósito: Next monta de nuevo un
 * template en cada navegación, que es justo lo que hace falta para que la
 * animación de entrada se repita. Un layout se conserva y solo animaría una
 * vez, al cargar el sitio.
 *
 * `MotionConfig reducedMotion="user"` cubre de una vez todas las animaciones
 * de Motion del árbol: si el sistema pide menos movimiento, las
 * transformaciones y opacidades se saltan. El CSS ya lo respeta por su lado
 * con la media query de globals.css.
 *
 * El movimiento vertical es mínimo (6 px) porque este contenedor envuelve
 * páginas con columnas `sticky` — cart, checkout y la ficha de producto — y
 * conviene no darles un ancestro con transformaciones grandes.
 */
export default function Template({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        // Sin JavaScript este contenedor se quedaría en opacity: 0 y la
        // página entera quedaría en negro. El <noscript> de layout.js lo
        // reactiva a través de este atributo.
        data-page-enter=""
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
