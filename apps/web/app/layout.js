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
    default: 'Vokter',
    template: '%s · Vokter',
  },
  description:
    'Vokter: cada producto con código de autenticidad verificable, un asistente de compras con IA que solo conoce el catálogo real y drops exclusivos con lista de espera.',
};

// Dos colores de barra del navegador, uno por tema, para que en el móvil la
// franja de arriba acompañe a la página en vez de quedarse negra sobre blanco.
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#050507' },
  ],
};

/**
 * Fija el tema antes del primer pintado.
 *
 * Tiene que ser un script en línea y síncrono: si esperara a que React
 * hidrate, el visitante vería un fogonazo blanco (o negro) durante unos
 * milisegundos. Lee lo que eligió en su última visita y, si no eligió nada,
 * cae en la preferencia del sistema.
 */
const SCRIPT_TEMA = `(function(){try{var e=localStorage.getItem('vokter-theme');var m=window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.dataset.theme=e==='light'||e==='dark'?e:(m?'light':'dark')}catch(_){document.documentElement.dataset.theme='dark'}})()`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning porque el script de abajo escribe data-theme
    // en <html> antes de que React hidrate: el atributo no coincide con lo
    // que renderizó el servidor, y es justo lo que se busca.
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {/* Primer hijo del <body>, y no un <head> escrito a mano ni
            next/script.

            Tiene que ejecutarse mientras el navegador parsea el HTML, antes
            de pintar nada: medido con la CPU ralentizada 6×, `next/script`
            con strategy="beforeInteractive" llegaba después de la primera
            pintura y el parpadeo volvía. Aquí, al estar antes de todo el
            contenido, <html> ya tiene su data-theme cuando hay algo que
            pintar. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
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
