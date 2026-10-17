'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Check, Search, SlidersHorizontal, X } from 'lucide-react';
import ScrollPanel from './ScrollPanel';

const SORTS = [
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor calificados' },
];

const PRICE_PRESETS = [
  { label: 'Hasta $50.000', min: '', max: '50000' },
  { label: '$50.000 – $100.000', min: '50000', max: '100000' },
  { label: '$100.000 – $200.000', min: '100000', max: '200000' },
  { label: 'Más de $200.000', min: '200000', max: '' },
];

// Actualiza la URL con los filtros; cualquier cambio vuelve a la página 1
function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(changes) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value === null || value === undefined) params.delete(key);
      else params.set(key, value);
    }
    params.delete('page');
    if (params.get('sort') === 'newest') params.delete('sort');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return { update, searchParams, clear: () => router.push(pathname, { scroll: false }) };
}

export function SortSelect() {
  const { update, searchParams } = useFilterNavigation();
  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-sm text-muted sm:inline">Ordenar:</span>
      <select
        className="input h-10 w-auto min-w-48 rounded-full"
        value={searchParams.get('sort') ?? 'newest'}
        onChange={(e) => update({ sort: e.target.value })}
        aria-label="Ordenar productos"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterPanel({ categories }) {
  const { update, searchParams, clear } = useFilterNavigation();
  const current = {
    category: searchParams.get('category') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    q: searchParams.get('q') ?? '',
  };

  const [q, setQ] = useState(current.q);
  const [minPrice, setMinPrice] = useState(current.minPrice);
  const [maxPrice, setMaxPrice] = useState(current.maxPrice);

  const hasFilters = Boolean(current.category || current.minPrice || current.maxPrice || current.q);

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() });
        }}
        className="relative"
      >
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle" />
        <input
          className="input pl-10"
          placeholder="Buscar en el catálogo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar productos"
        />
      </form>

      <div>
        <h3 className="eyebrow mb-3">Categoría</h3>
        <ul className="flex flex-col gap-0.5">
          {[{ slug: '', name: 'Todas las categorías' }, ...categories].map((c) => {
            const active = current.category === c.slug;
            return (
              <li key={c.slug || 'all'}>
                <button
                  onClick={() => update({ category: c.slug })}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-surface-hover font-semibold text-foreground'
                      : 'text-muted hover:bg-surface hover:text-foreground'
                  }`}
                  aria-pressed={active}
                >
                  <span className="truncate">{c.name}</span>
                  {active ? (
                    <Check size={15} className="shrink-0 text-accent" />
                  ) : (
                    c.productCount !== undefined && (
                      <span className="shrink-0 font-mono text-[11px] text-subtle">{c.productCount}</span>
                    )
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="eyebrow mb-3">Precio (COP)</h3>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const active = current.minPrice === p.min && current.maxPrice === p.max;
            return (
              <button
                key={p.label}
                onClick={() => {
                  setMinPrice(p.min);
                  setMaxPrice(p.max);
                  update(active ? { minPrice: '', maxPrice: '' } : { minPrice: p.min, maxPrice: p.max });
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted hover:border-border-strong hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ minPrice, maxPrice });
          }}
          className="mt-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              aria-label="Precio mínimo"
              className="input h-10"
              placeholder="Mín."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-subtle">–</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              aria-label="Precio máximo"
              className="input h-10"
              placeholder="Máx."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary h-10">
            Aplicar precio
          </button>
        </form>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setQ('');
            setMinPrice('');
            setMaxPrice('');
            clear();
          }}
          className="btn-ghost justify-start px-3 text-danger hover:text-danger"
        >
          <X size={15} /> Limpiar filtros
        </button>
      )}
    </div>
  );
}

export default function FilterBar({ categories }) {
  const searchParams = useSearchParams();
  const activeCount = ['category', 'minPrice', 'maxPrice', 'q'].filter((k) => searchParams.get(k)).length;
  // La key reinicia los inputs locales cuando los filtros cambian desde afuera (chips, limpiar, etc.)
  const key = searchParams.toString();

  return (
    <>
      <aside className="hidden lg:block">
        {/* El panel se queda fijo bajo la barra superior y, si es más alto que
            la ventana, se desliza por su cuenta: antes había que bajar hasta
            el final de los productos para ver los últimos filtros.
            7.5rem = los 6rem del top (barra de 4rem + aire) + 1.5rem de margen abajo. */}
        <ScrollPanel className="sticky top-24 max-h-[calc(100dvh-7.5rem)]">
          <FilterPanel key={key} categories={categories} />
        </ScrollPanel>
      </aside>

      <details className="group card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filtros
            {activeCount > 0 && <span className="badge-accent">{activeCount}</span>}
          </span>
          <span className="text-xs text-muted group-open:hidden">Mostrar</span>
          <span className="hidden text-xs text-muted group-open:inline">Ocultar</span>
        </summary>
        <div className="border-t border-border p-4">
          <FilterPanel key={key} categories={categories} />
        </div>
      </details>
    </>
  );
}
