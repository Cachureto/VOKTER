import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizarOrigen } from './lib/origen-api.mjs';

/**
 * En producción la web y la API son dos proyectos de Vercel con dominios
 * distintos. Para el navegador eso rompería el login: la cookie httpOnly del
 * refresh token es sameSite=lax y el navegador no la manda entre dominios.
 *
 * Con este rewrite el navegador siempre habla con el dominio de la web y Next
 * reenvía /api/* al backend por detrás. Todo queda same-site, sin CORS y con
 * una sola URL pública.
 */

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

// La normalización vive en lib/origen-api.mjs y la usan también el cliente y
// /diagnostico, para que los tres entiendan el valor igual.
if (!API_ORIGIN) {
  throw new Error(
    `API_ORIGIN no es una URL válida: ${JSON.stringify(crudo)}. Debe ser solo el ` +
      'dominio de la API (ej. https://mi-api.vercel.app), sin ninguna ruta detrás.',
  );
}

// Queda en el log del build: si la web no encuentra la API, lo primero que se
// quiere ver es contra qué origen se construyó.
console.log(`[next.config] /api/* se reenvía a ${API_ORIGIN}`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,

  // `standalone` deja en .next/standalone un servidor con solo las
  // dependencias que la web usa de verdad, que es lo que espera un hosting
  // de Node. Sin esto Next solo deja los archivos de la compilación y el
  // panel se queja de que no hay servidor que arrancar.
  output: 'standalone',

  // En un monorepo hay que decirle dónde empieza el proyecto: las
  // dependencias viven en el node_modules de la raíz, no dentro de apps/web,
  // y sin esto el servidor sale sin ellas y revienta al arrancar.
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),
  // El mismo origen con el que se construyeron los rewrites, incrustado en el
  // código. Así el servidor sabe a dónde llamar aunque el hosting solo pase
  // las variables al compilar y no al ejecutar, que es lo normal fuera de
  // Vercel: sin esto se caía al valor por defecto (localhost:4000), la
  // llamada moría y la página salía con "Algo salió mal".
  // Una variable de entorno en ejecución sigue teniendo prioridad.
  env: { API_ORIGIN_COMPILADO: API_ORIGIN },

  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
