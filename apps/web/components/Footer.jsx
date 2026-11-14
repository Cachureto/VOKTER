import Link from 'next/link';
import { BadgeCheck, Bell, Sparkles } from 'lucide-react';
import Logo from './Logo';

const COLUMNS = [
  {
    title: 'Tienda',
    links: [
      { href: '/catalog', label: 'Catálogo completo' },
      { href: '/drops', label: 'Próximos drops' },
      { href: '/search', label: 'Asistente de compras IA' },
    ],
  },
  {
    title: 'Tu cuenta',
    links: [
      { href: '/login', label: 'Ingresar' },
      { href: '/register', label: 'Crear cuenta' },
      { href: '/account/orders', label: 'Mis pedidos' },
      { href: '/cart', label: 'Carrito' },
    ],
  },
  {
    title: 'App Vokter',
    links: [
      { href: '/download', label: 'Descargar para Android' },
      { href: '/download', label: 'Escáner de autenticidad' },
      { href: '/download', label: 'Alertas de drops' },
    ],
  },
];

const PILLARS = [
  { icon: BadgeCheck, label: 'Autenticidad verificada' },
  { icon: Sparkles, label: 'IA sobre catálogo real' },
  { icon: Bell, label: 'Drops con lista de espera' },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/40">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Tecnología urbana, accesorios y hogar con origen comprobable. Cada producto de Vokter tiene un código único
            que puedes validar en la web o con la app.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {PILLARS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-foreground">
                <Icon size={16} className="text-accent" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Vokter. Todos los derechos reservados.</p>
          <p className="font-mono uppercase tracking-[0.18em]">Hecho en Colombia · Verificado por Vokter</p>
        </div>
      </div>
    </footer>
  );
}
