import Link from 'next/link';
import { ArrowRight, Bell, CalendarClock, Package } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { DROP_STATUS } from '@/lib/status';
import Countdown from '@/components/Countdown';

export const metadata = { title: 'Drops' };

// Stock, drops y listas de espera cambian a cada rato: se renderiza en cada visita, nunca en el build
export const dynamic = 'force-dynamic';

function dayMonth(iso) {
  const d = new Date(iso);
  const opts = { timeZone: 'America/Bogota' };
  return {
    day: new Intl.DateTimeFormat('es-CO', { ...opts, day: '2-digit' }).format(d),
    month: new Intl.DateTimeFormat('es-CO', { ...opts, month: 'short' }).format(d).replace('.', ''),
  };
}

function DropCard({ drop, featured = false }) {
  const status = DROP_STATUS[drop.status] ?? { label: drop.status, badge: 'badge' };
  const { day, month } = dayMonth(drop.launchAt);
  const past = ['ended', 'cancelled', 'sold_out'].includes(drop.status);

  return (
    <Link
      href={`/drops/${drop.slug}`}
      className={`group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-border-strong ${
        featured ? 'lg:flex-row' : ''
      } ${past ? 'opacity-70 hover:opacity-100' : ''}`}
    >
      <div
        className={`product-tile m-2 rounded-[20px] ${featured ? 'aspect-[4/3] lg:aspect-auto lg:min-h-[400px] lg:w-1/2' : 'aspect-[16/10]'}`}
      >
        {drop.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={drop.coverUrl}
            alt={drop.name}
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${past ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl font-bold text-black/15">
            VOKTER DROP
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col items-center rounded-xl bg-black/80 px-3 py-2 text-white backdrop-blur">
          <span className="font-display text-xl leading-none font-semibold">{day}</span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/70">{month}</span>
        </div>
      </div>

      <div className={`flex flex-1 flex-col p-5 ${featured ? 'justify-center sm:p-10' : 'sm:p-6'}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={status.badge}>{status.label}</span>
          <span className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Bell size={13} /> {drop.waitlistCount}
            </span>
            <span className="flex items-center gap-1">
              <Package size={13} /> {drop.products?.length ?? 0}
            </span>
          </span>
        </div>
        <h2 className={`display mt-4 ${featured ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{drop.name}</h2>
        {drop.description && (
          <p className={`mt-2 text-sm leading-relaxed text-muted ${featured ? 'line-clamp-3' : 'line-clamp-2'}`}>
            {drop.description}
          </p>
        )}
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
          {formatDate(drop.launchAt)}
        </p>
        {drop.status === 'scheduled' && (
          <div className="mt-6">
            <Countdown target={drop.launchAt} size={featured ? 'lg' : 'md'} />
          </div>
        )}
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold group-hover:text-accent">
          {drop.status === 'live'
            ? 'Comprar ahora'
            : drop.status === 'scheduled'
              ? 'Unirme a la lista de espera'
              : 'Ver drop'}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default async function DropsPage() {
  const drops = await apiFetch('/api/drops');
  const byDate = (a, b) => new Date(a.launchAt) - new Date(b.launchAt);

  const live = drops.filter((d) => d.status === 'live').sort(byDate);
  const upcoming = drops.filter((d) => d.status === 'scheduled').sort(byDate);
  const past = drops.filter((d) => !['live', 'scheduled'].includes(d.status)).sort((a, b) => byDate(b, a));

  const active = [...live, ...upcoming];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid mask-fade pointer-events-none absolute inset-0" />
        <div className="container-page relative py-14 sm:py-20">
          <p className="eyebrow flex items-center gap-2">
            <CalendarClock size={13} /> Calendario de lanzamientos
          </p>
          <h1 className="display mt-4 max-w-3xl text-4xl leading-[1.05] sm:text-6xl">
            Drops limitados. <span className="text-accent">Cupos contados.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Únete a la lista de espera de cada lanzamiento y sé de los primeros cuando abra. Todos los productos
            vienen con su código de autenticidad.
          </p>
        </div>
      </section>

      <div className="container-page py-12">
        {drops.length === 0 && (
          <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
            <CalendarClock size={28} className="text-muted" />
            <p className="font-display text-lg font-semibold">No hay drops programados por ahora</p>
            <p className="text-sm text-muted">Vuelve pronto: aquí verás el próximo lanzamiento y podrás unirte a la lista de espera.</p>
            <Link href="/catalog" className="btn-primary mt-3">
              Ver el catálogo
            </Link>
          </div>
        )}

        {active.length > 0 && (
          <div className="flex flex-col gap-6">
            {active.map((drop) => (
              <DropCard key={drop.id} drop={drop} featured />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <section className="mt-20">
            <h2 className="eyebrow">Drops anteriores</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.map((drop) => (
                <DropCard key={drop.id} drop={drop} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
