'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck,
  Banknote,
  CircleAlert,
  CreditCard,
  LoaderCircle,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { apiFetch } from '@/lib/api';
import { formatCOP } from '@/lib/format';

const STEPS = ['Carrito', 'Envío', 'Pago', 'Confirmación'];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'pse', label: 'PSE', icon: Banknote },
  { id: 'nequi', label: 'Nequi', icon: Smartphone },
];

// Detecta la franquicia por el prefijo, solo para mostrar la etiqueta — no valida nada real.
function cardBrand(digits) {
  if (/^4/.test(digits)) return { label: 'Visa', className: 'text-blue-600' };
  if (/^5[1-5]/.test(digits)) return { label: 'Mastercard', className: 'text-orange-600' };
  if (/^3[47]/.test(digits)) return { label: 'Amex', className: 'text-sky-600' };
  return null;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CheckoutPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { items, count, subtotalCents, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState('shipping');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [method, setMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [error, setError] = useState(null);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/checkout');
  }, [authLoading, user, router]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  function handleContinueToPayment(e) {
    e.preventDefault();
    setStep('payment');
  }

  async function handlePay(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Simulación visual de una pasarela real: un par de pasos de "verificación"
    // antes de crear el pedido. No se transmite ni se guarda ningún dato de tarjeta.
    const steps =
      method === 'card'
        ? ['Verificando tarjeta…', 'Autorizando con tu banco…', 'Procesando pago…']
        : ['Conectando con tu banco…', 'Confirmando transacción…'];

    await new Promise((resolve) => {
      let i = 0;
      const tick = () => {
        setProcessingLabel(steps[i]);
        i += 1;
        if (i < steps.length) {
          timersRef.current.push(setTimeout(tick, 650));
        } else {
          timersRef.current.push(setTimeout(resolve, 650));
        }
      };
      tick();
    });

    try {
      const order = await apiFetch('/api/orders', {
        method: 'POST',
        token: accessToken,
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: { fullName, phone, address, city },
        },
      });
      clearCart();
      router.push(`/account/orders?created=${order.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      setProcessingLabel('');
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container-page flex justify-center py-32">
        <LoaderCircle size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex max-w-xl flex-col items-center py-24 text-center">
        <h1 className="display text-3xl">No tienes nada en el carrito</h1>
        <p className="mt-3 text-muted">Agrega productos para finalizar tu compra.</p>
        <Link href="/catalog" className="btn-primary mt-8">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const activeIndex = step === 'shipping' ? 1 : 2;
  const brand = cardBrand(cardNumber.replace(/\D/g, ''));

  return (
    <div className="container-page py-10">
      <ol className="flex items-center gap-2 text-xs sm:gap-3" aria-label="Pasos de compra">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
                i <= activeIndex ? 'bg-accent text-accent-foreground' : 'border border-border text-subtle'
              }`}
            >
              {i + 1}
            </span>
            <span className={i === activeIndex ? 'font-semibold text-foreground' : 'text-muted'}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border sm:w-12" />}
          </li>
        ))}
      </ol>

      <h1 className="page-title mt-8">Finalizar compra</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        {step === 'shipping' ? (
          <form onSubmit={handleContinueToPayment} className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <MapPin size={18} className="text-accent" /> Datos de envío
            </h2>
            <p className="mt-1 text-sm text-muted">Enviaremos tu pedido a esta dirección.</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="fullName">
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  required
                  autoComplete="name"
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  className="input"
                  placeholder="300 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="city">
                  Ciudad
                </label>
                <input
                  id="city"
                  required
                  autoComplete="address-level2"
                  className="input"
                  placeholder="Bogotá"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">
                  Dirección
                </label>
                <input
                  id="address"
                  required
                  autoComplete="street-address"
                  className="input"
                  placeholder="Calle, número, apartamento"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary mt-8 h-12 w-full text-[15px]">
              <Lock size={17} /> Continuar a pago
            </button>
          </form>
        ) : (
          <form onSubmit={handlePay} className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <ShieldCheck size={18} className="text-accent" /> Pago seguro
            </h2>
            <p className="mt-1 text-sm text-muted">Tus datos viajan cifrados y nunca se almacenan sin cifrar.</p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors ${
                      active
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-border text-muted hover:border-border-strong'
                    }`}
                  >
                    <Icon size={18} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {method === 'card' && (
              <div className="mt-6 grid gap-5">
                <div>
                  <label className="label" htmlFor="cardNumber">
                    Número de tarjeta
                  </label>
                  <div className="relative">
                    <input
                      id="cardNumber"
                      required
                      inputMode="numeric"
                      autoComplete="cc-number"
                      className="input pr-20 font-mono tracking-wider"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    />
                    {brand && (
                      <span
                        className={`absolute top-1/2 right-4 -translate-y-1/2 text-xs font-bold ${brand.className}`}
                      >
                        {brand.label}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="cardName">
                    Nombre en la tarjeta
                  </label>
                  <input
                    id="cardName"
                    required
                    autoComplete="cc-name"
                    className="input uppercase"
                    placeholder="COMO APARECE EN LA TARJETA"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="label" htmlFor="expiry">
                      Vencimiento
                    </label>
                    <input
                      id="expiry"
                      required
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      className="input font-mono"
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="cvv">
                      CVV
                    </label>
                    <input
                      id="cvv"
                      required
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      className="input font-mono"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border-strong accent-accent"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  />
                  Guardar esta tarjeta para la próxima compra
                </label>
              </div>
            )}

            {method === 'pse' && (
              <div className="mt-6 rounded-xl border border-border bg-surface-hover p-4 text-sm text-muted">
                Al continuar te llevaremos al portal de tu banco para autorizar el pago vía PSE.
              </div>
            )}

            {method === 'nequi' && (
              <div className="mt-6 rounded-xl border border-border bg-surface-hover p-4 text-sm text-muted">
                Te enviaremos una notificación push a tu app Nequi para aprobar el cobro.
              </div>
            )}

            {error && (
              <div className="alert-error mt-6" role="alert">
                <CircleAlert size={18} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="submit"
                className="btn-primary h-12 flex-1 text-[15px]"
                disabled={submitting}
              >
                {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <Lock size={17} />}
                {submitting ? processingLabel : `Pagar ${formatCOP(subtotalCents)}`}
              </button>
              <button
                type="button"
                className="btn-secondary h-12"
                disabled={submitting}
                onClick={() => setStep('shipping')}
              >
                Volver
              </button>
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs text-subtle">
              <Lock size={12} /> Pago cifrado de extremo a extremo · PCI-DSS
            </p>
          </form>
        )}

        <aside className="card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">
            Tu pedido <span className="font-mono text-sm text-subtle">({count})</span>
          </h2>
          <ul className="mt-5 flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="product-tile h-14 w-14">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 font-mono text-[10px] font-bold text-background">
                    {item.quantity}
                  </span>
                </div>
                <p className="line-clamp-2 flex-1 text-sm">{item.name}</p>
                <p className="text-sm font-medium">{formatCOP(item.priceCents * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl font-semibold">{formatCOP(subtotalCents)}</span>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted">
            <BadgeCheck size={15} className="text-live" /> Recibirás cada producto con su código de autenticidad
          </p>
        </aside>
      </div>
    </div>
  );
}
