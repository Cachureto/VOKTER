'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, LogOut, Menu, Package, ShieldCheck, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import Logo from './Logo';

const LINKS = [
  { href: '/catalog', label: 'Catálogo' },
  { href: '/drops', label: 'Drops' },
  { href: '/search', label: 'Asistente IA', icon: Sparkles },
  { href: '/download', label: 'App' },
];

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-surface pr-3 pl-1 transition-colors hover:border-border-strong"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover font-mono text-xs font-semibold">
          {initials}
        </span>
        <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 origin-top-right animate-fade-up rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-black/60"
        >
          <div className="border-b border-border px-3 pt-2 pb-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="flex flex-col py-1">
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <Package size={16} /> Mis pedidos
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
              >
                <LayoutDashboard size={16} /> Panel admin
              </Link>
            )}
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-hover hover:text-danger"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bloquea el scroll del body con el menú móvil abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="container-page flex h-9 items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck size={14} className="text-live" />
          <span>
            Cada producto con <span className="font-medium text-foreground">código de autenticidad verificable</span>
            <span className="hidden sm:inline"> · Envíos a toda Colombia</span>
          </span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          scrolled ? 'border-border bg-background/85 backdrop-blur-xl' : 'border-transparent bg-background'
        }`}
      >
        <div className="container-page flex h-16 items-center justify-between gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                  isActive(href) ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                {Icon && <Icon size={15} className="text-accent" />}
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 lg:justify-self-end">
            <Link href="/cart" className="icon-btn" aria-label={`Carrito, ${count} productos`}>
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              {loading ? (
                <div className="skeleton h-10 w-28 rounded-full" />
              ) : user ? (
                <UserMenu user={user} logout={logout} />
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">
                    Ingresar
                  </Link>
                  <Link href="/register" className="btn-primary h-10 px-5">
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>

            <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-fade-up flex-col border-l border-border bg-background">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar menú">
                <X size={22} />
              </button>
            </div>

            <nav className="flex flex-col p-4" aria-label="Móvil">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg font-medium tracking-tight ${
                    isActive(href) ? 'bg-surface text-foreground' : 'text-muted'
                  }`}
                >
                  {label}
                  {Icon && <Icon size={18} className="text-accent" />}
                </Link>
              ))}
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg font-medium tracking-tight text-muted"
              >
                Carrito
                {count > 0 && <span className="badge-accent">{count}</span>}
              </Link>
            </nav>

            <div className="mt-auto border-t border-border p-4">
              {loading ? null : user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-1 pb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover">
                      <User size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/account/orders" className="btn-secondary" onClick={() => setOpen(false)}>
                    <Package size={16} /> Mis pedidos
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="btn-secondary" onClick={() => setOpen(false)}>
                      <LayoutDashboard size={16} /> Panel admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="btn-ghost"
                  >
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className="btn-secondary" onClick={() => setOpen(false)}>
                    Ingresar
                  </Link>
                  <Link href="/register" className="btn-primary" onClick={() => setOpen(false)}>
                    Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
