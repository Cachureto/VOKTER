import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from './motion/Reveal';

// Casi todas las secciones de la tienda entran por aquí, así que envolverlo
// en Reveal da el revelado al hacer scroll en toda la página con un solo
// cambio. El enlace entra un pelo después que el título.
export default function SectionHeading({ eyebrow, title, description, href, linkLabel = 'Ver todo' }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <Reveal className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="display mt-3 text-2xl sm:text-3xl lg:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-muted">{description}</p>}
      </Reveal>
      {href && (
        <Reveal delay={0.12} className="shrink-0">
          <Link
            href={href}
            className="group link-sweep inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-accent-bright"
          >
            {linkLabel}
            <ArrowRight
              size={16}
              className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
            />
          </Link>
        </Reveal>
      )}
    </div>
  );
}
