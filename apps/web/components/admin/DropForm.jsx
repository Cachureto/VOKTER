'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageOff, LoaderCircle, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

// "2026-10-16T20:00:00.000Z" -> "2026-10-16T20:00", lo que acepta <input type="datetime-local">
function toLocalInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DropForm({ initial }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [products, setProducts] = useState([]);
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? '');
  const [launchAt, setLaunchAt] = useState(toLocalInput(initial?.launchAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [selected, setSelected] = useState(initial?.products?.map((p) => p.id) ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/products?limit=60').then((r) => setProducts(r.items));
  }, []);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await apiFetch(`/api/drops/${initial.slug}`, {
          method: 'PATCH',
          token: accessToken,
          body: {
            name,
            description,
            coverUrl: coverUrl || null,
            launchAt: launchAt ? new Date(launchAt).toISOString() : undefined,
            endsAt: endsAt ? new Date(endsAt).toISOString() : null,
            productIds: selected,
          },
        });
      } else {
        await apiFetch('/api/drops', {
          method: 'POST',
          token: accessToken,
          body: {
            name,
            slug,
            description,
            coverUrl: coverUrl || undefined,
            launchAt: new Date(launchAt).toISOString(),
            productIds: selected,
          },
        });
      }
      router.push('/admin/drops');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="card flex flex-col gap-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Nombre
            </label>
            <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="slug">
              Slug
            </label>
            <input
              id="slug"
              className="input font-mono disabled:opacity-60"
              required
              disabled={isEdit}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            className="input min-h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="coverUrl">
            URL de imagen <span className="text-subtle">(opcional)</span>
          </label>
          <input
            id="coverUrl"
            className="input"
            placeholder="https://… o /products/foto.jpg"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="launchAt">
              Fecha de lanzamiento
            </label>
            <input
              id="launchAt"
              type="datetime-local"
              className="input"
              required
              value={launchAt}
              onChange={(e) => setLaunchAt(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="endsAt">
              Fecha de cierre <span className="text-subtle">(opcional)</span>
            </label>
            <input
              id="endsAt"
              type="datetime-local"
              className="input"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">
            Productos incluidos <span className="font-mono text-subtle">({selected.length} seleccionados)</span>
          </label>
          <div className="grid max-h-80 gap-2 overflow-y-auto rounded-xl border border-border p-2 sm:grid-cols-2">
            {products.map((p) => {
              const checked = selected.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 text-sm transition-colors ${
                    checked ? 'border-accent bg-accent/5' : 'border-transparent hover:bg-surface-hover'
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(p.id)} />
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      checked ? 'border-accent bg-accent text-accent-foreground' : 'border-border-strong'
                    }`}
                  >
                    {checked && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="product-tile h-9 w-9 shrink-0 rounded-md">
                    {p.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="truncate">{p.name}</span>
                </label>
              );
            })}
            {products.length === 0 && <p className="text-sm text-muted">No hay productos creados todavía.</p>}
          </div>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <button type="submit" className="btn-primary self-start" disabled={submitting || selected.length === 0}>
          {submitting && <LoaderCircle size={17} className="animate-spin" />}
          {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear drop'}
        </button>
      </div>

      <aside className="card p-4 lg:sticky lg:top-24">
        <p className="eyebrow mb-3 px-1">Vista previa</p>
        <div className="product-tile aspect-square">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-black/30">
              <ImageOff size={32} />
            </div>
          )}
        </div>
        <div className="px-1 pt-4 pb-1">
          <p className="font-medium">{name || 'Nombre del drop'}</p>
          <p className="mt-1 text-xs text-muted">{description || 'Descripción del drop'}</p>
        </div>
      </aside>
    </form>
  );
}
