import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Package, ScanLine, Truck } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { formatCOP } from '@/lib/format';
import AuthenticityValidator from '@/components/AuthenticityValidator';
import AddToCartButton from '@/components/AddToCartButton';
import ReviewsSection from '@/components/ReviewsSection';
import ProductGallery from '@/components/ProductGallery';
import ProductGrid from '@/components/ProductGrid';
import SectionHeading from '@/components/SectionHeading';
import StarRating from '@/components/StarRating';

// cache(): generateMetadata y la página comparten la misma petición en cada render
const getProduct = cache(async (slug) => {
  try {
    return await apiFetch(`/api/products/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? 'Producto' };
}

function StockStatus({ stock }) {
  if (stock <= 0) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-danger">
        <span className="h-2 w-2 rounded-full bg-danger" /> Agotado por ahora
      </p>
    );
  }
  if (stock <= 5) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-warning">
        <span className="h-2 w-2 animate-pulse rounded-full bg-warning" /> ¡Solo quedan {stock} unidades!
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-live">
      <span className="h-2 w-2 rounded-full bg-live" /> En stock · {stock} disponibles
    </p>
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    apiFetch(`/api/products/${product.id}/reviews`),
    product.category?.slug
      ? apiFetch(`/api/products?category=${encodeURIComponent(product.category.slug)}&limit=5`)
          .then((r) => r.items.filter((p) => p.id !== product.id).slice(0, 4))
          .catch(() => [])
      : [],
  ]);

  const images = product.images?.length ? product.images : product.coverUrl ? [{ url: product.coverUrl }] : [];
  const verified = product.authenticityStatus === 'active';
  const attributes = Object.entries(product.attributes ?? {}).filter(([, v]) => v !== null && v !== '');

  return (
    <div className="container-page py-8 sm:py-10">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-subtle" aria-label="Migas de pan">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-foreground">
          Catálogo
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="truncate text-muted">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <ProductGallery images={images} name={product.name} verified={verified} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">
            {product.brand ?? 'Vokter'}
            {product.category ? ` · ${product.category.name}` : ''}
          </p>
          <h1 className="display mt-3 text-3xl leading-tight sm:text-4xl">{product.name}</h1>

          <a href="#resenas" className="mt-4 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
            <StarRating value={product.rating ?? 0} />
            {product.reviewCount > 0
              ? `${product.rating.toFixed(1)} · ${product.reviewCount} reseña${product.reviewCount === 1 ? '' : 's'}`
              : 'Sin reseñas todavía'}
          </a>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-border py-6">
            <div>
              <p className="font-display text-4xl font-semibold tracking-tight">{formatCOP(product.priceCents)}</p>
              <p className="mt-1 text-xs text-subtle">Precio en pesos colombianos ({product.currency ?? 'COP'})</p>
            </div>
            <StockStatus stock={product.stock} />
          </div>

          {product.description && <p className="mt-6 leading-relaxed text-muted">{product.description}</p>}

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [BadgeCheck, 'Código de autenticidad único'],
              [ScanLine, 'Valídalo cuando quieras en la web'],
              [Truck, 'Envío a toda Colombia'],
            ].map(([Icon, text]) => (
              <li
                key={text}
                className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-3 text-xs text-muted"
              >
                <Icon size={16} className="shrink-0 text-accent" />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <AuthenticityValidator defaultCode={product.authenticityCode} />
          </div>

          {attributes.length > 0 && (
            <div className="mt-6">
              <h2 className="eyebrow mb-3 flex items-center gap-2">
                <Package size={13} /> Especificaciones
              </h2>
              <dl className="divide-y divide-border rounded-2xl border border-border">
                {attributes.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted capitalize">{key.replaceAll('_', ' ')}</dt>
                    <dd className="text-right font-medium">
                      {Array.isArray(value)
                        ? value.join(', ')
                        : typeof value === 'boolean'
                          ? value
                            ? 'Sí'
                            : 'No'
                          : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <ReviewsSection productId={product.id} initialReviews={reviews} />

      {related.length > 0 && (
        <section className="mt-20 border-t border-border pt-16">
          <SectionHeading
            eyebrow="Te puede interesar"
            title={`Más en ${product.category.name}`}
            href={`/catalog?category=${product.category.slug}`}
          />
          <div className="mt-8">
            <ProductGrid products={related} emptyAction={false} />
          </div>
        </section>
      )}
    </div>
  );
}
