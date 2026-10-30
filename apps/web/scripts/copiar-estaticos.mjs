/**
 * Completa la carpeta que deja `output: 'standalone'`.
 *
 * Next deja ahí el servidor y sus dependencias, pero a propósito NO copia
 * `.next/static` ni `public`: da por hecho que un CDN los sirve. En un hosting
 * normal no hay tal CDN, así que sin esto el sitio arranca pero sale sin CSS,
 * sin JavaScript y sin imágenes, con todo dando 404.
 *
 * La ruta de destino repite `apps/web` porque en un monorepo la carpeta
 * standalone conserva la estructura del repositorio.
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = dirname(dirname(fileURLToPath(import.meta.url)));
const raiz = join(web, '.next', 'standalone');

if (!existsSync(raiz)) {
  console.error('[estaticos] No existe .next/standalone. ¿Falta output: "standalone" en next.config.mjs?');
  process.exit(1);
}

// Dentro de standalone, la app vive donde vive en el repositorio.
const destinoApp = join(raiz, 'apps', 'web');

for (const [origen, destino] of [
  [join(web, '.next', 'static'), join(destinoApp, '.next', 'static')],
  [join(web, 'public'), join(destinoApp, 'public')],
]) {
  if (!existsSync(origen)) continue;
  cpSync(origen, destino, { recursive: true });
  console.log(`[estaticos] copiado ${origen.replace(web, 'apps/web')}`);
}

// En un monorepo el servidor queda en standalone/apps/web/server.js, pero los
// paneles de hosting buscan un server.js en la raíz de la carpeta publicada y,
// si no lo encuentran, no arrancan nada y el dominio responde 503. Este
// archivo es solo un puente: el servidor real se localiza por su propia ruta,
// así que cargarlo desde aquí funciona igual.
writeFileSync(
  join(raiz, 'server.js'),
  "// Generado por scripts/copiar-estaticos.mjs — no lo edites a mano.\n" +
    "require('./apps/web/server.js');\n",
);
console.log('[estaticos] creado standalone/server.js');

// Y por si el panel arranca con `npm start` en vez de `node server.js`.
const pkg = join(raiz, 'package.json');
if (existsSync(pkg)) {
  const datos = JSON.parse(readFileSync(pkg, 'utf8'));
  datos.scripts = { ...datos.scripts, start: 'node server.js' };
  writeFileSync(pkg, `${JSON.stringify(datos, null, 2)}\n`);
  console.log('[estaticos] package.json de standalone con "start"');
}
