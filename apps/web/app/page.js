import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { categoryIcon } from '@/lib/categories';
import { formatCOP, formatDate } from '@/lib/format';
import ProductGrid from '@/components/ProductGrid';
import SectionHeading from '@/components/SectionHeading';
import Countdown from '@/components/Countdown';
import Marquee from '@/components/motion/Marquee';
import Reveal from '@/components/motion/Reveal';
import Counter from '@/components/motion/Counter';
import HeroShowcase from '@/components/motion/HeroShowcase';

// Stock, drops y listas de espera cambian a cada rato: se renderiza en cada visita, nunca en el build
export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [{ items: products, total }, drops, { items: categories }] = await Promise.all([
    apiFetch('/api/products?limit=8'),
    apiFetch('/api/drops'),
    apiFetch('/api/categories'),
  ]);

  const activeDrops = drops
    .filter((d) => ['live', 'scheduled'].includes(d.status))
    .sort((a, b) => new Date(a.launchAt) - new Date(b.launchAt));

  return {
    products,
    total,
    categories: categories.filter((c) => c.productCount > 0).sort((a, b) => b.productCount - a.productCount),
    liveDrop: activeDrops.find((d) => d.status === 'live') ?? null,
    nextDrop: activeDrops.find((d) => d.status === 'scheduled') ?? null,
    activeDrops,
  };
}

const TRUST = [
  { icon: ShieldCheck, title: 'Autenticidad verificada', text: 'Código VKT único por producto' },
  { icon: Sparkles, title: 'Asistente con IA', text: 'Solo recomienda stock real' },
  { icon: CalendarClock, title: 'Drops exclusivos', text: 'Lista de espera y alertas' },
  { icon: Truck, title: 'Envíos nacionales', text: 'Sigue tu pedido en tu cuenta' },
];

const AI_SUGGESTIONS = ['Power bank para viajar', 'Algo para jugar en la TV', 'Soporte de celular para la moto'];

// Palabras de la marquesina. Son las categorías y las promesas de la tienda:
// lo mismo que se diría en un escaparate.
const TICKER = [
  'Autenticidad verificada',
  'Sneakers',
  'Audio',
  'Ropa urbana',
  'Accesorios',
  'Drops limitados',
  'Hogar',
  'Envíos a toda Colombia',
];


export default async function HomePage() {
  const { products, total, categories, liveDrop, nextDrop, activeDrops } = await getHomeData();
  const spotlightDrop = liveDrop ?? nextDrop;

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid mask-fade pointer-events-none absolute inset-0" />
        <div className="glow-accent pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2" />

        <div className="container-page relative grid items-center gap-16 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-24">
          <div className="animate-fade-up">
            {liveDrop ? (
              <Link href={`/drops/${liveDrop.slug}`} className="badge-live group py-1.5 pr-3 pl-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
                </span>
                Drop en vivo: {liveDrop.name}
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <span className="badge-accent py-1.5">
                <Sparkles size={13} /> Autenticidad · IA · Drops
              </span>
            )}

            <h1 className="display mt-6 text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl">
              Original
              <br />o no es <span className="text-gradient">Vokter.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Tecnología urbana, accesorios y hogar con un código de autenticidad único en cada producto. Encuentra lo
              que buscas con nuestro asistente de IA y entérate antes que nadie de los próximos drops.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalog" className="btn-primary h-12 px-7 text-[15px]">
                Explorar catálogo <ArrowRight size={18} />
              </Link>
              <Link href="/search" className="btn-secondary h-12 px-7 text-[15px]">
                <Sparkles size={17} className="text-accent" /> Pregúntale a la IA
              </Link>
            </div>

            {/* Las tres cifras cuentan desde cero al entrar en pantalla. El
                valor final ya viene renderizado del servidor, así que sin
                JavaScript se sigue leyendo el número correcto. */}
            <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-border border-t border-border pt-6">
              <div className="pr-4">
                <dt className="eyebrow">Productos</dt>
                <dd className="mt-1.5 font-display text-2xl font-semibold sm:text-3xl">
                  <Counter value={total} />
                </dd>
              </div>
              <div className="px-4">
                <dt className="eyebrow">Con código</dt>
                <dd className="mt-1.5 font-display text-2xl font-semibold sm:text-3xl">
                  <Counter value={100} suffix="%" />
                </dd>
              </div>
              <div className="pl-4">
                <dt className="eyebrow">Drops activos</dt>
                <dd className="mt-1.5 font-display text-2xl font-semibold sm:text-3xl">
                  <Counter value={activeDrops.length} />
                </dd>
              </div>
            </dl>
          </div>

          <HeroShowcase products={products} />
        </div>
      </section>

      {/* ================= FRANJA DE CONFIANZA ================= */}
      <section className="border-b border-border bg-surface/40">
        <div className="container-page grid grid-cols-2 gap-x-6 gap-y-6 py-8 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.08} className="group flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-white/30 group-hover:text-accent-bright">
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted sm:text-sm">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= TICKER ================= */}
      {/* Tipografía grande en contorno blanco: mete blanco en la página sin
          encender una superficie entera, y el movimiento continuo rompe la
          quietud entre dos bloques estáticos. */}
      <section className="border-b border-border bg-background py-5">
        <Marquee speed="42s" className="select-none">
          {TICKER.map((palabra, i) => (
            <span key={i} className="flex items-center gap-8 px-8">
              <span className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground/85 sm:text-3xl">
                {palabra}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ================= CATEGORÍAS ================= */}
      {categories.length > 0 && (
        <section className="container-page pt-20 lg:pt-28">
          <SectionHeading
            eyebrow="01 — Categorías"
            title="Explora por categoría"
            description="Todo el catálogo organizado para que llegues directo a lo que necesitas."
            href="/catalog"
            linkLabel="Ver catálogo"
          />
          <div
            className={`mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${
              categories.slice(0, 8).length % 3 === 0 && categories.length < 8 ? '' : 'lg:grid-cols-4'
            }`}
          >
            {categories.slice(0, 8).map((c) => {
              const Icon = categoryIcon(c);
              return (
                <Link
                  key={c.slug}
                  href={`/catalog?category=${c.slug}`}
                  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-5"
                >
                  {c.coverUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.coverUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-50 transition-all duration-700 group-hover:scale-105 group-hover:opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
                    </>
                  )}
                  <span className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-accent backdrop-blur sm:top-5 sm:left-5">
                    <Icon size={18} />
                  </span>
                  <div className="relative flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-display text-sm leading-tight font-semibold tracking-tight text-white sm:text-lg">
                        {c.name}
                      </h3>
                      <p className="font-mono text-[11px] text-white/60">
                        {c.productCount} producto{c.productCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-white/70 transition-all group-hover:translate-x-1 group-hover:text-accent"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= RECIÉN LLEGADOS ================= */}
      <section className="container-page pt-20 lg:pt-28">
        <SectionHeading
          eyebrow="02 — Recién llegados"
          title="Lo último en Vokter"
          description="Cada uno con su certificado de autenticidad listo para validar."
          href="/catalog"
        />
        <div className="mt-10">
          <ProductGrid products={products} emptyAction={false} />
        </div>
      </section>

      {/* ================= POR QUÉ VOKTER ================= */}
      <section className="container-page pt-20 lg:pt-28">
        <SectionHeading eyebrow="03 — Por qué Vokter" title="Tres razones para comprar sin dudas" />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {/* Autenticidad */}
          <div className="card flex flex-col p-6 sm:p-8">
            <span className="font-mono text-xs text-subtle">01</span>
            <h3 className="display mt-4 text-xl">Autenticidad verificada</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Cada producto trae un código único. Valídalo en su ficha o escanéalo con la app para confirmar que es
              original y está activo.
            </p>
            <div className="mt-auto pt-8">
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate rounded-lg border border-border px-3 py-2 font-mono text-xs text-muted">
                    {products[0]?.authenticityCode ?? 'VKT-XXXXXXXX'}
                  </span>
                  <span className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">
                    Validar
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-live">
                  <BadgeCheck size={15} /> Código auténtico y activo
                </p>
              </div>
            </div>
          </div>

          {/* IA */}
          <div className="card flex flex-col p-6 sm:p-8">
            <span className="font-mono text-xs text-subtle">02</span>
            <h3 className="display mt-4 text-xl">Asistente de compras IA</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Escribe lo que necesitas en tus palabras. La IA solo consulta el catálogo real: nunca inventa productos,
              precios ni stock.
            </p>
            <div className="mt-auto flex flex-col gap-2 pt-8 text-xs">
              <span className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 font-medium text-accent-foreground">
                Busco un power bank para viajar
              </span>
              <span className="max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-2.5 text-muted">
                Encontré opciones con stock real.{' '}
                {products[0] && (
                  <span className="text-foreground">
                    {products[0].name} · {formatCOP(products[0].priceCents)}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Drops */}
          <div className="card flex flex-col p-6 sm:p-8">
            <span className="font-mono text-xs text-subtle">03</span>
            <h3 className="display mt-4 text-xl">Drops con lista de espera</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Lanzamientos limitados con cupos. Únete a la lista de espera y recibe la alerta en tu celular cuando
              abran.
            </p>
            <div className="mt-auto pt-8">
              {nextDrop ? (
                <Link
                  href={`/drops/${nextDrop.slug}`}
                  className="block rounded-xl border border-border bg-background p-4"
                >
                  <p className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold">{nextDrop.name}</span>
                    <span className="badge shrink-0">
                      <Bell size={12} /> {nextDrop.waitlistCount}
                    </span>
                  </p>
                  <div className="mt-3">
                    <Countdown target={nextDrop.launchAt} />
                  </div>
                </Link>
              ) : (
                <Link href="/drops" className="btn-secondary w-full">
                  Ver calendario de drops
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= DROP DESTACADO ================= */}
      {spotlightDrop && (
        <section className="container-page pt-20 lg:pt-28">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative grid lg:grid-cols-2">
              <div className="product-tile m-2 aspect-[4/3] rounded-[20px] lg:m-3 lg:aspect-auto lg:min-h-[400px]">
                {spotlightDrop.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={spotlightDrop.coverUrl}
                    alt={spotlightDrop.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-black/15">
                    VOKTER DROP
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                {spotlightDrop.status === 'live' ? (
                  <span className="badge-live w-fit">● En vivo ahora</span>
                ) : (
                  <span className="badge-accent w-fit">
                    <CalendarClock size={13} /> Próximo drop
                  </span>
                )}
                <h2 className="display mt-5 text-3xl sm:text-4xl">{spotlightDrop.name}</h2>
                {spotlightDrop.description && (
                  <p className="mt-4 line-clamp-3 leading-relaxed text-muted">{spotlightDrop.description}</p>
                )}
                <p className="mt-4 font-mono text-xs text-subtle uppercase tracking-[0.14em]">
                  {formatDate(spotlightDrop.launchAt)} · {spotlightDrop.waitlistCount} en lista de espera
                </p>
                {spotlightDrop.status === 'scheduled' && (
                  <div className="mt-8">
                    <Countdown target={spotlightDrop.launchAt} size="lg" />
                  </div>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={`/drops/${spotlightDrop.slug}`} className="btn-primary">
                    {spotlightDrop.status === 'live' ? 'Ver productos del drop' : 'Unirme a la lista de espera'}
                    <ArrowRight size={17} />
                  </Link>
                  <Link href="/drops" className="btn-secondary">
                    Todos los drops
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= ASISTENTE IA ================= */}
      <section className="container-page pt-20 lg:pt-28">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface-2 via-surface to-background px-6 py-12 sm:px-12 sm:py-16">
          <div className="glow-accent pointer-events-none absolute -top-48 left-1/2 h-[420px] w-[720px] -translate-x-1/2" />
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Sparkles size={22} />
            </span>
            <h2 className="display mt-6 text-3xl sm:text-4xl">¿No sabes qué buscar? Pregúntale a Vokter.</h2>
            <p className="mt-4 text-muted">
              Describe lo que necesitas y tu presupuesto. Te mostramos productos reales con precio y stock actualizados.
            </p>
            <form action="/search" className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                name="q"
                required
                className="input h-12 rounded-full px-5"
                placeholder="Ej: cargador rápido bajo $100.000"
                aria-label="Pregunta para el asistente"
              />
              <button type="submit" className="btn-primary h-12 shrink-0">
                Preguntar <ArrowRight size={17} />
              </button>
            </form>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {AI_SUGGESTIONS.map((s) => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="badge transition-colors hover:border-border-strong hover:text-foreground"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= APP MÓVIL ================= */}
      <section className="container-page pt-20 lg:pt-28">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
          <div>
            <p className="eyebrow">App Vokter para Android</p>
            <h2 className="display mt-4 text-3xl sm:text-4xl">Verifica en la calle, no solo en la web.</h2>
            <ul className="mt-8 flex flex-col gap-4">
              {[
                [ScanLine, 'Escanea el QR del producto y valida su autenticidad al instante'],
                [Bell, 'Recibe una notificación cuando se anuncie un nuevo drop'],
                [Smartphone, 'Tu misma cuenta, pedidos y reseñas que en la web'],
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon size={15} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <Link href="/download" className="btn-primary mt-10">
              Descargar la app <ArrowRight size={17} />
            </Link>
          </div>

          {/* Mockup de teléfono */}
          <div className="relative mx-auto">
            <div className="glow-accent pointer-events-none absolute inset-0 scale-150" />
            <div className="relative w-64 rounded-[2.5rem] border-[6px] border-surface-hover bg-background p-3 shadow-2xl shadow-black">
              <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-surface-hover" />
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
                Escanear código
              </p>
              <div className="relative mx-auto mt-4 flex aspect-square w-44 items-center justify-center rounded-2xl border border-border bg-surface">
                <QrCode size={96} strokeWidth={1.2} className="text-foreground/80" />
                <span className="absolute inset-x-4 top-1/2 h-0.5 bg-accent shadow-[0_0_16px_2px_rgba(0,174,239,0.7)]" />
                {[
                  'top-2 left-2 border-t-2 border-l-2',
                  'top-2 right-2 border-t-2 border-r-2',
                  'bottom-2 left-2 border-b-2 border-l-2',
                  'right-2 bottom-2 border-r-2 border-b-2',
                ].map((pos) => (
                  <span key={pos} className={`absolute h-6 w-6 rounded-sm border-accent ${pos}`} />
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-live/30 bg-live/10 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-live">
                  <BadgeCheck size={16} /> Producto original
                </p>
                <p className="mt-1 truncate font-mono text-[10px] text-muted">
                  {products[0]?.authenticityCode ?? 'VKT-XXXXXXXX'}
                </p>
              </div>
              <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-surface-hover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
