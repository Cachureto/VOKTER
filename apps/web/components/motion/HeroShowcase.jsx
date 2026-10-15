'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BadgeCheck, Sparkles } from 'lucide-react';

const INTERVALO = 4500;
const FUNDIDO = 1.1;

/**
 * Una baldosa del hero. Mantiene en pantalla la foto saliente y la entrante a
 * la vez durante el fundido: AnimatePresence conserva el elemento que sale
 * hasta que su animación termina, y ahí está el cruce.
 *
 * El leve zoom de 1.06 a 1 es lo que hace que el cambio se lea como un
 * movimiento y no como un parpadeo.
 */
function Baldosa({ product, className, priority = false }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`product-tile group block ${className}`}
      aria-label={product.name}
    >
      {/* initial={false} evita que la primera foto entre con opacidad 0:
          así el HTML del servidor ya la muestra y no hay parpadeo al cargar
          ni un hueco si el JavaScript no llega a ejecutarse. */}
      <AnimatePresence initial={false}>
        <motion.img
          key={product.id}
          src={product.coverUrl}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FUNDIDO, ease: 'easeInOut' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      <span className="tile-shine" aria-hidden="true" />
    </Link>
  );
}

/** Texto que se cambia con un fundido corto, para el pie del certificado. */
function TextoQueCambia({ children, claveTexto, className }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={claveTexto}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

export default function HeroShowcase({ products }) {
  const disponibles = (products ?? []).filter((p) => p?.coverUrl);
  const total = disponibles.length;
  const sinMovimiento = useReducedMotion();
  const [i, setI] = useState(0);
  const pausado = useRef(false);

  useEffect(() => {
    // Con menos de cuatro fotos la rotación repetiría lo que ya se ve en las
    // otras baldosas, así que no se mueve. Y si el sistema pide menos
    // movimiento, tampoco.
    if (sinMovimiento || total < 4) return undefined;

    const id = setInterval(() => {
      // No se gasta trabajo ni ancho de banda mientras la pestaña está
      // oculta o el cursor está encima mirando una foto concreta.
      if (pausado.current || document.hidden) return;
      setI((n) => (n + 1) % total);
    }, INTERVALO);

    return () => clearInterval(id);
  }, [sinMovimiento, total]);

  if (!total) return null;

  const en = (desplazamiento) => disponibles[(i + desplazamiento) % total];
  const principal = en(0);
  const segunda = total > 1 ? en(1) : null;
  const tercera = total > 2 ? en(2) : null;

  return (
    <div
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
      onMouseEnter={() => {
        pausado.current = true;
      }}
      onMouseLeave={() => {
        pausado.current = false;
      }}
    >
      <div className="grid aspect-[6/5] grid-cols-5 grid-rows-2 gap-3 sm:gap-4">
        <Baldosa product={principal} priority className="col-span-3 row-span-2 rounded-3xl" />
        {segunda && <Baldosa product={segunda} className="col-span-2 rounded-3xl" />}
        {tercera && <Baldosa product={tercera} className="col-span-2 rounded-3xl" />}
      </div>

      {/* Certificado flotante. Sigue a la foto grande: al rotar, el código y
          el nombre cambian con ella, que es lo que hace creíble la promesa de
          "un código por producto". */}
      <div className="absolute -bottom-6 left-3 w-[min(19rem,85%)] animate-fade-up rounded-2xl border border-border-strong bg-background/90 p-4 shadow-2xl shadow-black/70 backdrop-blur-xl sm:-left-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-live/15 text-live">
            <BadgeCheck size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Certificado Vokter</p>
            <p className="truncate font-mono text-xs text-muted">
              <TextoQueCambia claveTexto={principal.id} className="block truncate">
                {principal.authenticityCode}
              </TextoQueCambia>
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="min-w-0 truncate pr-2 text-muted">
            <TextoQueCambia claveTexto={principal.id} className="block truncate">
              {principal.name}
            </TextoQueCambia>
          </span>
          <span className="badge-live shrink-0">Activo</span>
        </div>
      </div>

      {/* Chip del asistente */}
      <div
        className="absolute -top-4 right-3 hidden animate-fade-up items-center gap-2 rounded-full border border-border-strong bg-background/90 py-2 pr-4 pl-2 text-xs shadow-xl backdrop-blur-xl sm:flex"
        style={{ animationDelay: '150ms' }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Sparkles size={14} />
        </span>
        <span className="text-muted">
          IA: <span className="text-foreground">solo productos reales</span>
        </span>
      </div>
    </div>
  );
}
