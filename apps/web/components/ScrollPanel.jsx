'use client';

import { useEffect, useRef } from 'react';

/**
 * Contenedor con scroll propio para columnas fijas (sticky) que pueden ser
 * más altas que la ventana, como el panel de filtros del catálogo.
 *
 * Además del scroll, marca con `data-fade-top` / `data-fade-bottom` si queda
 * contenido oculto arriba o abajo; el CSS (`.scroll-panel` en globals.css)
 * usa eso para difuminar ese borde y avisar que hay más sin mostrar una
 * barra gruesa. Los atributos se escriben directo en el nodo para no volver
 * a renderizar React en cada evento de scroll.
 */
export default function ScrollPanel({ className = '', children, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const medir = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      el.dataset.fadeTop = String(scrollTop > 4);
      el.dataset.fadeBottom = String(scrollTop + clientHeight < scrollHeight - 4);
    };

    medir();
    el.addEventListener('scroll', medir, { passive: true });
    // El alto cambia al redimensionar la ventana o cuando el contenido crece
    // (más categorías, aparece "Limpiar filtros"…).
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    return () => {
      el.removeEventListener('scroll', medir);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={`scroll-panel ${className}`} {...props}>
      {children}
    </div>
  );
}
