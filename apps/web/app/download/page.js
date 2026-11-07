import { headers } from 'next/headers';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Gauge, ListChecks, ShieldCheck, Smartphone, Ticket, Trophy, Wallet } from 'lucide-react';
import { origenDe } from '@/lib/apk';

export const metadata = {
  title: 'Fanáticos 360 · Descarga la app',
  description: 'App de apuestas deportivas de la Liga BetPlay, la Copa BetPlay y el fútbol internacional. Solo para mayores de 18 años.',
};

// El QR se arma con el dominio desde el que se abrió la página, así que nunca
// apunta a localhost aunque falte NEXT_PUBLIC_SITE_URL en el hosting.
export const dynamic = 'force-dynamic';

const ORO = '#e9b931';

const FEATURES = [
  { icon: Trophy, title: 'Liga BetPlay, Copa y fútbol internacional', text: 'Calendario, resultados y partidos en vivo con sus cuotas.' },
  { icon: Ticket, title: 'Simples y combinadas', text: 'Ganador, doble oportunidad, más/menos goles, ambos marcan, clasifica y marcador exacto.' },
  { icon: Wallet, title: 'Billetera en pesos', text: 'Deposita con PSE, tarjeta o Nequi y sigue cada movimiento.' },
  { icon: Gauge, title: 'Juego responsable', text: 'Límites de depósito diarios, semanales y mensuales, y pausa de la cuenta cuando quieras.' },
];

const PASOS = [
  ['Descarga el APK', 'Toca el botón desde tu teléfono Android o escanea el código QR.'],
  ['Permite la instalación', 'Android te pedirá permitir apps de esta fuente. Acéptalo solo para el navegador con el que descargaste.'],
  ['Abre Fanáticos 360', 'Confirma que eres mayor de edad, crea tu cuenta y listo.'],
];

export default async function DownloadPage() {
  const enlace = `${origenDe(await headers())}/download/apk`;

  return (
    <div className="relative overflow-hidden">
      <div className="bg-grid mask-fade pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${ORO}55, transparent)` }}
      />

      <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: `${ORO}66`, color: ORO, background: `${ORO}14` }}
            >
              <Smartphone size={13} /> App para Android
            </span>
            <span className="inline-flex items-center rounded-md border-2 border-red-500 px-1.5 text-xs font-black text-red-500">18+</span>
          </div>

          <div className="mt-6 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fanaticos-360-icon.png" alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl" />
            <p className="font-display text-2xl font-black tracking-[0.18em]">
              FANATICOS <span style={{ color: '#f5a20f' }}>360</span>
            </p>
          </div>
          <h1 className="display mt-6 text-4xl leading-[1.05] sm:text-6xl">
            Tu pasión, <span style={{ color: ORO }}>tu apuesta.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Sigue el FPC, la Copa BetPlay y el fútbol internacional, y apuesta desde tu teléfono con cuotas que se actualizan en vivo.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface"
                  style={{ color: ORO }}
                >
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md rounded-3xl border border-[#232a33] bg-[#0b0f15] p-8 text-center text-white shadow-2xl shadow-black/40 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9aa1ab]">Escanea para descargar</p>

          <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-5">
            <QRCodeSVG value={enlace} size={200} bgColor="#ffffff" fgColor="#0b0f15" level="M" />
          </div>

          <a
            href="/download/apk"
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold transition hover:brightness-105"
            style={{ background: ORO, color: '#1a1405', boxShadow: `0 8px 24px ${ORO}40` }}
          >
            <Download size={18} /> Descargar Fanáticos 360
          </a>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#9aa1ab]">
            <ShieldCheck size={14} className="text-[#22c55e]" /> Android 8 o superior · APK firmado
          </p>
          <p className="mt-6 text-[11px] leading-relaxed text-[#646c77]">
            Las apuestas son solo para mayores de 18 años. El juego puede causar adicción: juega con responsabilidad.
          </p>
        </div>
      </div>

      <section id="instalar" className="container-page relative pb-20">
        <div className="card p-6 sm:p-10">
          <p className="eyebrow flex items-center gap-2">
            <ListChecks size={15} /> Cómo instalar
          </p>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {PASOS.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black"
                  style={{ background: ORO, color: '#1a1405' }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div id="juego-responsable" className="mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-muted sm:p-8">
          <p className="font-semibold text-foreground">Juego responsable</p>
          <p className="mt-2 max-w-3xl">
            Fanáticos 360 es solo para mayores de 18 años. Dentro de la app puedes poner límites a tus depósitos y pausar tu cuenta
            entre 24 horas y un año. Si sientes que el juego dejó de ser diversión, busca apoyo: en Colombia la línea 192, opción 4,
            orienta en salud mental de forma gratuita.
          </p>
        </div>
      </section>
    </div>
  );
}
