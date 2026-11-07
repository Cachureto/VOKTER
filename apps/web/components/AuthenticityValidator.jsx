'use client';

import { useState } from 'react';
import { BadgeCheck, Check, Copy, LoaderCircle, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/api';

const RESULTS = {
  valid: {
    icon: BadgeCheck,
    tone: 'alert-success',
    title: 'Código auténtico',
    text: (p) => `Corresponde a ${p?.name ?? 'un producto Vokter'} y está activo.`,
  },
  revoked: {
    icon: ShieldX,
    tone: 'alert-error',
    title: 'Código revocado',
    text: () => 'Este código fue desactivado. No confíes en este producto.',
  },
  not_found: {
    icon: ShieldX,
    tone: 'alert-error',
    title: 'Código no registrado',
    text: () => 'No existe en la base de datos de Vokter. El producto podría no ser original.',
  },
  suspicious: {
    icon: ShieldAlert,
    tone: 'alert-error',
    title: 'Formato inválido',
    text: () => 'El código no tiene el formato de Vokter (VKT-XXXXXXXX).',
  },
};

export default function AuthenticityValidator({ defaultCode }) {
  const [code, setCode] = useState(defaultCode ?? '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch('/api/authenticity/validate', {
        method: 'POST',
        body: { code, source: 'web' },
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // el portapapeles puede no estar disponible
    }
  }

  const info = result ? RESULTS[result.result] : null;
  const Icon = info?.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-live/10 text-live">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="font-semibold">Certificado de autenticidad</h2>
            <p className="mt-0.5 text-sm text-muted">
              Valida el código impreso en tu producto contra el registro de Vokter.
            </p>
          </div>
        </div>

        {defaultCode && (
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-background p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${API_URL}/api/authenticity/${encodeURIComponent(defaultCode)}/qr.svg`}
              alt={`Código QR de autenticidad ${defaultCode}`}
              width={112}
              height={112}
              className="shrink-0 rounded-lg bg-white p-1.5"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold">El QR lleva este mismo código</p>
              <p className="mt-1 text-sm text-muted">
                Cualquier lector de QR muestra el código; pégalo aquí para verificarlo contra el registro.
              </p>
              <p className="mt-2 truncate font-mono text-xs text-subtle">{defaultCode}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <input
              className="input pr-11 font-mono tracking-wide uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VKT-XXXXXXXX"
              aria-label="Código de autenticidad"
              spellCheck={false}
            />
            {code && (
              <button
                type="button"
                onClick={copyCode}
                className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-subtle hover:bg-surface-hover hover:text-foreground"
                aria-label="Copiar código"
              >
                {copied ? <Check size={15} className="text-live" /> : <Copy size={15} />}
              </button>
            )}
          </div>
          <button type="submit" className="btn-secondary shrink-0" disabled={loading || !code.trim()}>
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {loading ? 'Validando…' : 'Validar código'}
          </button>
        </form>

        {error && (
          <div className="alert-error mt-4" role="alert">
            {error}
          </div>
        )}

        {info && (
          <div className={`${info.tone} mt-4 animate-fade-up`} role="status">
            <Icon size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{info.title}</p>
              <p className="mt-0.5 opacity-90">{info.text(result.product)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
