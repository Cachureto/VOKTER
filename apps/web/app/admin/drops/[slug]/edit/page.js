'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import DropForm from '@/components/admin/DropForm';
import AdminHeader from '@/components/admin/AdminHeader';

export default function EditDropPage() {
  const { slug } = useParams();
  const [drop, setDrop] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/api/drops/${slug}`)
      .then(setDrop)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <div className="alert-error">{error}</div>;
  if (!drop) return <div className="skeleton h-96 max-w-3xl" />;

  return (
    <div>
      <AdminHeader title="Editar drop" description={drop.name} backHref="/admin/drops" />
      <DropForm initial={drop} />
    </div>
  );
}
