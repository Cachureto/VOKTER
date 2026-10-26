import Link from 'next/link';

/**
 * Marca Vokter: el emblema de la V alada.
 *
 * Es un PNG con fondo transparente recortado del logo original. Se sirve con
 * <img> y no con next/image a propósito: mide unos pocos KB, aparece en todas
 * las páginas y no gana nada pasando por el optimizador de imágenes, que en
 * Vercel además se cobra por transformación.
 *
 * El emblema es apaisado (casi 2:1), así que se fija el alto y el ancho va
 * solo. Está pensado para fondo oscuro: el resplandor azul se compuso sobre
 * negro. En modo claro no se retoca el logo, se le pone detrás una placa
 * oscura (`.mark-plate` en globals.css), que conserva la marca intacta y de
 * paso la hace leer como un sello.
 */
export function VokterMark({ className = 'h-8 w-auto' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vokter-mark.png"
      alt=""
      aria-hidden="true"
      width={640}
      height={346}
      // `object-contain` es un seguro: si alguien le da una caja cuadrada, la
      // marca se centra dentro en vez de aplastarse. Aun así conviene pasar
      // solo el alto (`h-8 w-auto`), que es como está pensada.
      className={`object-contain ${className}`}
      style={{ filter: 'drop-shadow(0 0 10px rgba(0, 162, 232, 0.35))' }}
    />
  );
}

export default function Logo({ className = '' }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="Vokter, ir al inicio"
    >
      <span className="mark-plate">
        <VokterMark className="h-8 w-auto transition-transform duration-500 group-hover:scale-110" />
      </span>
      <span className="font-display text-lg font-bold tracking-[-0.04em]">Vokter</span>
    </Link>
  );
}
