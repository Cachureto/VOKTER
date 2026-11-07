'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CircleAlert, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthShell from '@/components/AuthShell';
import PasswordInput from '@/components/PasswordInput';

function RegisterForm() {
  const { register, user } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const rules = [
    { ok: password.length >= 8, label: 'Mínimo 8 caracteres' },
    { ok: /[A-Za-z]/.test(password), label: 'Una letra' },
    { ok: /\d/.test(password), label: 'Un número' },
  ];

  return (
    <AuthShell
      eyebrow="Únete a Vokter"
      title="Crea tu cuenta"
      description="Tu cuenta para comprar, seguir tus pedidos y unirte a los drops."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link href={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">
            Ingresa aquí
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            required
            autoComplete="name"
            className="input"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <PasswordInput
            id="password"
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {rules.map((r) => (
              <li
                key={r.label}
                className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? 'text-live' : 'text-subtle'}`}
              >
                <Check size={13} /> {r.label}
              </li>
            ))}
          </ul>
        </div>
        {error && (
          <div className="alert-error" role="alert">
            <CircleAlert size={18} className="shrink-0" />
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary h-12 text-[15px]" disabled={loading}>
          {loading && <LoaderCircle size={18} className="animate-spin" />}
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
