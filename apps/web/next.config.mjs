/**
 * En producción la web y la API son dos proyectos de Vercel con dominios
 * distintos. Para el navegador eso rompería el login: la cookie httpOnly del
 * refresh token es sameSite=lax y el navegador no la manda entre dominios.
 *
 * Con este rewrite el navegador siempre habla con el dominio de la web y Next
 * reenvía /api/* al backend por detrás. Todo queda same-site, sin CORS y con
 * una sola URL pública.
 */

/**
 * Deja el origen de la API en la forma que Next acepta como destino de un
 * rewrite: una URL absoluta con protocolo y sin barra final.
 *
 * Se normaliza en vez de exigir el formato exacto porque el valor se escribe a
 * mano en el panel de Vercel, y los dos errores típicos —pegar el host pelado
 * y dejar la barra del final— fallan de formas poco obvias: sin protocolo Next
 * revienta al cargar la configuración, y con barra el destino queda con una
 * doble barra.
 */
function normalizarOrigen(valor) {
  const limpio = String(valor).trim().replace(/\/+$/, '');
  const conProtocolo = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
  try {
    // Valida de verdad: `new URL` rechaza espacios, rutas mal formadas, etc.
    return new URL(conProtocolo).origin;
  } catch {
    throw new Error(
      `API_ORIGIN no es una URL válida: ${JSON.stringify(valor)}. ` +
        'Debe ser el dominio de la API, por ejemplo https://mi-api.vercel.app',
    );
  }
}

// Los rewrites se resuelven al construir, no en cada petición: lo que quede
// aquí se congela en el build. Si la variable falta en Vercel, el fallback a
// localhost se hornea y el resultado es una web desplegada en la que /api/* da
// 404 y las páginas revientan al renderizar, sin ninguna pista de por qué. Es
// mejor que el build falle aquí y se vea el motivo.
const crudo = process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL;

// `next build` corre con NODE_ENV=production, así que esto salta en cualquier
// hosting (Vercel, Hostinger, Docker…), no solo en Vercel. Antes el aviso era
// solo para Vercel y en los demás se horneaba localhost:4000 en silencio: la
// web se desplegaba "bien" y luego todo /api/* daba 404 sin ninguna pista.
// Para construir en tu máquina sin definirla: API_ORIGIN=http://localhost:4000 npm run build
if (process.env.NODE_ENV === 'production' && !crudo) {
  throw new Error(
    'Falta API_ORIGIN. Defínela en las variables de entorno del despliegue ' +
      'con el dominio de la API, sin barra final (ej. https://mi-api.hostingersite.com).',
  );
}

const API_ORIGIN = normalizarOrigen(crudo ?? 'http://localhost:4000');

// Queda en el log del build: si la web no encuentra la API, lo primero que se
// quiere ver es contra qué origen se construyó.
console.log(`[next.config] /api/* se reenvía a ${API_ORIGIN}`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
