import '@fontsource-variable/inter';
import '@fontsource-variable/unbounded';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: {
    default: 'Vokter — Tecnología urbana con autenticidad verificada',
    template: '%s · Vokter',
  },
  description:
    'Vokter: cada producto con código de autenticidad verificable, un asistente de compras con IA que solo conoce el catálogo real y drops exclusivos con lista de espera.',
};

export const viewport = {
  themeColor: '#09090b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {/* Red de seguridad para todo lo que anima Motion: escribe opacity: 0
            ya en el HTML del servidor, y sin JavaScript nadie lo volvería a
            encender. `data-page-enter` es el contenedor de la transición de
            página: si se quedara apagado, la web entera saldría en negro.
            Esta regla solo se aplica cuando el navegador no ejecuta scripts. */}
        <noscript>
          <style>{`[data-reveal],[data-page-enter]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
