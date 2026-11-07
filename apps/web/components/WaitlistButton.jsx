'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CircleCheck, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

export default function WaitlistButton({ dropSlug, disabled }) {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin() {
    if (!user) {
      router.push(`/login?next=/drops/${dropSlug}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/drops/${dropSlug}/waitlist`, { method: 'POST', token: accessToken });
      setJoined(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return (
      <div className="alert-success animate-fade-up">
        <CircleCheck size={20} className="shrink-0" />
        <div>
          <p className="font-semibold">Estás en la lista de espera</p>
          <p className="mt-0.5 opacity-90">Quedaste anotado: cuando abra el drop lo verás en esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn-primary h-12 w-full px-8 text-[15px] sm:w-auto"
        onClick={handleJoin}
        disabled={loading || disabled}
      >
        {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Bell size={18} />}
        {loading
          ? 'Uniendo…'
          : disabled
            ? 'Lista de espera cerrada'
            : user
              ? 'Unirme a la lista de espera'
              : 'Ingresa para unirte'}
      </button>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
