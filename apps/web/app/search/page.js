'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUp, BatteryCharging, Cable, Gamepad2, RotateCcw, ShieldCheck, Smartphone } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import { VokterMark } from '@/components/Logo';

const SUGGESTIONS = [
  { icon: Cable, text: 'Cargador rápido bajo $100.000' },
  { icon: BatteryCharging, text: 'Un power bank para viajar' },
  { icon: Gamepad2, text: 'Algo para jugar en la TV' },
  { icon: Smartphone, text: 'Accesorios para el celular en la moto' },
];

/**
 * Avatar del asistente.
 *
 * El emblema es apaisado (640×346), así que se le fija solo el alto y el ancho
 * sale solo; antes se le daba una caja cuadrada y salía aplastado. La placa
 * ocupa 2rem de lado para que la cuadrícula de productos, que se alinea con
 * `sm:pl-11`, siga cuadrando con el texto de la respuesta. `mark-plate` le
 * pone fondo oscuro en modo claro, igual que en la barra superior, porque el
 * resplandor del logo se compuso sobre negro.
 */
function MarcaAsistente({ className = '' }) {
  return (
    // `px-0.5 py-0` anula el relleno de `.mark-plate`: con el suyo, la marca
    // no cabía a lo ancho en los 2rem y el flex la encogía.
    <span className={`mark-plate h-8 w-8 shrink-0 rounded-xl border border-border px-0.5 py-0 ${className}`}>
      <VokterMark className="h-3.5 w-auto shrink-0" />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <MarcaAsistente />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function SearchChat() {
  const initialQuery = useSearchParams().get('q');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const autoSent = useRef(false);

  async function send(text) {
    const message = text ?? input;
    if (!message.trim() || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setLoading(true);
    try {
      const res = await apiFetch('/api/ai/search', { method: 'POST', body: { message, conversationId } });
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, products: res.products }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.message, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  // Si llega ?q= desde el home, se envía automáticamente una sola vez
  useEffect(() => {
    if (!initialQuery || autoSent.current) return;
    autoSent.current = true;
    const t = setTimeout(() => send(initialQuery), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    if (messages.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  function handleSubmit(e) {
    e.preventDefault();
    send();
  }

  function reset() {
    setMessages([]);
    setConversationId(undefined);
  }

  const empty = messages.length === 0 && !loading;

  return (
    <div className="container-page flex min-h-[calc(100vh-6.25rem)] max-w-4xl flex-col py-8">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <span className="mark-plate shrink-0">
            <VokterMark className="h-7 w-auto" />
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight">Asistente de compras Vokter</h1>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <ShieldCheck size={13} className="text-live" /> Responde solo con productos, precios y stock reales
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="btn-ghost shrink-0" disabled={loading}>
            <RotateCcw size={15} /> <span className="hidden sm:inline">Nueva búsqueda</span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {empty ? (
          <div className="relative flex flex-1 flex-col items-center justify-center py-12 text-center">
            <div className="glow-accent pointer-events-none absolute h-72 w-72" />
            <h2 className="display relative text-3xl sm:text-4xl">¿Qué estás buscando hoy?</h2>
            <p className="relative mt-3 max-w-md text-muted">
              Escríbelo como se lo dirías a un amigo. Incluye tu presupuesto y te mostramos lo que tenemos en stock.
            </p>
            <div className="relative mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => send(text)}
                  className="card-interactive flex items-center gap-3 p-4 text-left text-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon size={18} />
                  </span>
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 py-8">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] animate-fade-up rounded-2xl rounded-br-md bg-accent px-4 py-3 text-sm font-medium text-accent-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex animate-fade-up flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <MarcaAsistente className="mt-0.5" />
                    <div
                      className={`max-w-[85%] rounded-2xl rounded-tl-md border px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        m.error ? 'border-danger/30 bg-danger/10 text-danger' : 'border-border bg-surface'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                  {m.products?.length > 0 && (
                    <div className="sm:pl-11">
                      <ProductGrid products={m.products} columns="compact" emptyAction={false} />
                    </div>
                  )}
                </div>
              ),
            )}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="sticky bottom-4 mt-4">
        <div className="flex items-center gap-2 rounded-full border border-border-strong bg-surface/95 p-1.5 pl-5 shadow-2xl shadow-black/60 backdrop-blur-xl focus-within:border-accent">
          <input
            className="h-10 flex-1 bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
            placeholder="Ej: cargador rápido bajo $100.000"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Mensaje para el asistente"
          />
          <button
            type="submit"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all hover:bg-accent-hover disabled:opacity-30"
            disabled={loading || !input.trim()}
            aria-label="Enviar"
          >
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-subtle">
          La IA interpreta tu mensaje; los productos y precios siempre salen de la base de datos de Vokter.
        </p>
      </form>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchChat />
    </Suspense>
  );
}
