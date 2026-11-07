import { BadgeCheck, Bell, Sparkles } from 'lucide-react';

const POINTS = [
  {
    icon: BadgeCheck,
    title: 'Compras con certificado',
    text: 'Valida el código de autenticidad de todo lo que compras.',
  },
  { icon: Bell, title: 'Acceso a drops', text: 'Únete a listas de espera y recibe alertas de lanzamientos.' },
  { icon: Sparkles, title: 'Asistente con IA', text: 'Encuentra productos describiendo lo que necesitas.' },
];

export default function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <div className="container-page grid min-h-[calc(100vh-6.25rem)] items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20">
      <div className="mx-auto w-full max-w-md animate-fade-up">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-3 text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-3 text-muted">{description}</p>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>

      <div className="relative hidden h-full min-h-[560px] overflow-hidden rounded-3xl border border-border bg-surface lg:block">
        <div className="bg-grid mask-fade absolute inset-0" />
        <div className="glow-accent absolute -top-32 -right-32 h-[460px] w-[460px]" />
        <div className="relative flex h-full flex-col justify-end p-10">
          <p className="display text-5xl leading-[0.95]">
            Original
            <br />o no es <span className="text-accent">Vokter.</span>
          </p>
          <ul className="mt-10 flex flex-col gap-5">
            {POINTS.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
