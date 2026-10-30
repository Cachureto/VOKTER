'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';

export default function Error({ error, reset }) {
  return (
    <div className="container-page flex max-w-lg flex-col items-center py-28 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert size={26} />
      </span>
      <h1 className="display mt-6 text-3xl">Algo salió mal</h1>
      <p className="mt-3 text-muted">{error?.message ?? 'No pudimos cargar esta página.'}</p>
      {/* En producción React esconde el motivo real y deja solo un número.
          El digest es lo que permite encontrar la línea exacta en los
          registros del servidor, así que conviene tenerlo a la vista. */}
      {error?.digest && <p className="mt-2 font-mono text-xs text-subtle">digest: {error.digest}</p>}
      <button className="btn-primary mt-8" onClick={() => reset()}>
        <RotateCcw size={16} /> Reintentar
      </button>
    </div>
  );
}
