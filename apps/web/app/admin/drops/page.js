'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Package, Pencil } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { DROP_STATUS } from '@/lib/status';
import AdminHeader from '@/components/admin/AdminHeader';

const STATUSES = ['scheduled', 'live', 'sold_out', 'ended', 'cancelled'];

export default function AdminDropsPage() {
  const { accessToken } = useAuth();
  const [drops, setDrops] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setDrops(await apiFetch('/api/drops'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    apiFetch('/api/drops')
      .then(setDrops)
      .catch((err) => setError(err.message));
  }, []);

  async function handleStatusChange(slug, status) {
    try {
      await apiFetch(`/api/drops/${slug}/status`, { method: 'PATCH', token: accessToken, body: { status } });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Drops"
        description="Cambia el estado de cada lanzamiento desde aquí."
        actionHref="/admin/drops/new"
        actionLabel="Nuevo drop"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="flex flex-col gap-3">
        {drops === null && [0, 1].map((i) => <div key={i} className="skeleton h-24" />)}
        {drops?.map((d) => {
          const status = DROP_STATUS[d.status] ?? { label: d.status, badge: 'badge' };
          return (
            <div key={d.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="product-tile h-16 w-16 shrink-0">
                {d.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/drops/${d.slug}`} className="font-semibold hover:text-accent">
                    {d.name}
                  </Link>
                  <span className={status.badge}>{status.label}</span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span>{formatDate(d.launchAt)}</span>
                  <span className="flex items-center gap-1">
                    <Bell size={12} /> {d.waitlistCount} en espera
                  </span>
                  <span className="flex items-center gap-1">
                    <Package size={12} /> {d.products.length} producto{d.products.length === 1 ? '' : 's'}
                  </span>
                </p>
              </div>
              <select
                className="input h-10 w-44"
                value={d.status}
                onChange={(e) => handleStatusChange(d.slug, e.target.value)}
                aria-label={`Estado de ${d.name}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {DROP_STATUS[s].label}
                  </option>
                ))}
              </select>
              <Link
                href={`/admin/drops/${d.slug}/edit`}
                className="icon-btn h-10 w-10 text-muted"
                aria-label={`Editar ${d.name}`}
              >
                <Pencil size={16} />
              </Link>
            </div>
          );
        })}
        {drops?.length === 0 && <p className="card px-4 py-10 text-center text-muted">No hay drops todavía.</p>}
      </div>
    </div>
  );
}
