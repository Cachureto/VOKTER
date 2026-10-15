import Link from 'next/link';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import { formatCOP } from '@/lib/format';
import StarRating from './StarRating';

export default function ProductCard({ product, priority = false }) {
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const verified = product.authenticityStatus ? product.authenticityStatus === 'active' : true;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group edge-light flex flex-col rounded-2xl border border-border bg-surface p-2 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-surface-2 hover:shadow-[0_28px_56px_-28px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <div className="product-tile aspect-square w-full">
        {product.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.coverUrl}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            className={`h-full w-full object-cover transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07] ${
              outOfStock ? 'opacity-60 grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-black/15">
            VOKTER
          </div>
        )}

        <span className="tile-shine" aria-hidden="true" />

        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {verified ? (
            <span
              title="Autenticidad verificada"
              className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur"
            >
              <BadgeCheck size={13} className="text-live" />
              <span className="hidden sm:inline">Verificado</span>
            </span>
          ) : (
            <span />
          )}
          {outOfStock ? (
            <span className="rounded-full bg-black/75 px-2 py-1 text-[11px] font-semibold text-danger backdrop-blur">
              Agotado
            </span>
          ) : lowStock ? (
            <span className="rounded-full bg-black/75 px-2 py-1 text-[11px] font-semibold text-warning backdrop-blur">
              Últimas {product.stock}
            </span>
          ) : null}
        </div>

        <span className="absolute right-2 bottom-2 flex h-9 w-9 translate-y-3 scale-75 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2 pt-3.5 pb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
            {product.brand || product.category?.name || 'Vokter'}
          </span>
          {product.reviewCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <StarRating value={product.rating} size={11} />
              <span className="font-mono">({product.reviewCount})</span>
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-medium text-foreground transition-colors duration-300 group-hover:text-accent-bright">
          {product.name}
        </h3>
        <p className="mt-auto pt-2 font-display text-lg font-semibold tracking-tight transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
          {formatCOP(product.priceCents)}
        </p>
      </div>
    </Link>
  );
}
