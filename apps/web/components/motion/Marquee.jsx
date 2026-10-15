/**
 * Marquesina de desplazamiento infinito.
 *
 * Es CSS puro (ver `.marquee` en globals.css), así que no lleva 'use client':
 * funciona dentro de componentes de servidor y no suma nada al bundle.
 *
 * El contenido se renderiza dos veces. La primera copia es la real; la
 * segunda se marca `aria-hidden` para que un lector de pantalla no lea la
 * lista repetida.
 */
export default function Marquee({
  children,
  /** 'left' avanza hacia la izquierda; 'right', al revés. */
  direction = 'left',
  /** Duración de una vuelta completa. Más alto = más lento. */
  speed = '38s',
  className = '',
  trackClassName = '',
}) {
  return (
    <div
      className={`marquee ${className}`}
      data-direction={direction}
      style={{ '--marquee-duration': speed }}
    >
      <div className={`marquee-track ${trackClassName}`}>{children}</div>
      <div className={`marquee-track ${trackClassName}`} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
