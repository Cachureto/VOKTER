# Deploy de Vokter en Vercel

Guía paso a paso para poner Vokter en internet. Al final tendrás:

| Pieza | Dónde | Qué es |
|---|---|---|
| Base de datos | Neon | PostgreSQL gestionado (plan gratis) |
| API | Vercel, proyecto `vokter-api` | `apps/backend` como una Vercel Function |
| Web | Vercel, proyecto `vokter` | `apps/web`, y además hace de puerta de entrada a la API |
| App móvil | APK de EAS | apunta al dominio de la web |

## Cómo encaja

**Solo hay un dominio público: el de la web.** El navegador nunca habla con el
dominio de la API; pide `/api/...` a la web y Next lo reenvía por detrás
(`rewrites` en `next.config.mjs`).

No es un capricho: la cookie del refresh token es `httpOnly` y `sameSite=lax`.
Si el navegador tuviera que mandarla al dominio de la API, que es otro sitio, la
descartaría y **el login de la web se rompería**. Con el proxy todo queda
same-site, sin CORS y con una sola URL que recordar.

La app móvil no usa cookies (guarda los tokens en `expo-secure-store`), pero
apunta al mismo dominio para no depender de dos.

---

## Paso 1 · Base de datos en Neon

1. Entra a [neon.tech](https://neon.tech), crea una cuenta y un proyecto
   (PostgreSQL 16, la región más cercana).
2. Copia la **connection string con pooling**: la que lleva `-pooler` en el
   host. Se ve así:

   ```
   postgresql://usuario:clave@ep-algo-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   Usa la *pooled*, no la directa. En serverless cada instancia de la función
   abre su propia conexión, y sin el pooler de Neon se agota el límite en
   cuanto haya algo de tráfico.

3. Carga el catálogo y el esquema desde tu máquina. En **PowerShell**, dentro
   del repo:

   ```powershell
   $env:DATABASE_URL = "postgresql://...-pooler.../neondb?sslmode=require"

   # comprueba que quedó puesta (sin imprimir la contraseña)
   if (-not $env:DATABASE_URL) { "FALTA la variable" } else { "ok, $($env:DATABASE_URL.Length) caracteres" }

   # 1. el esquema y los 89 productos, desde el dump del repo
   docker cp apps/backend/db/dump-latest.sql nova-db:/tmp/dump.sql
   docker exec nova-db psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/dump.sql

   # 2. registrar las migraciones
   npm run db:migrate
   ```

   Se usa el contenedor de Docker solo porque ya trae `psql`; la conexión va a
   Neon, no a la base local. Si tienes `psql` instalado, sirve igual sin
   `docker exec` ni `docker cp`.

   **Por qué `docker cp` y no una tubería.** PowerShell no acepta `<` para
   redirigir un archivo, y la alternativa obvia (`Get-Content ... | docker exec -i`)
   reescribe el texto en la codificación de la consola: el dump está en UTF-8 y
   lleno de acentos (`Audífonos`, `Conducción`, `360°`), que llegarían corruptos.
   Copiando el archivo al contenedor viajan los bytes tal cual.

   **Si ves `role "root" does not exist`**, es que `$env:DATABASE_URL` está vacía
   en esa terminal: `psql` no recibió cadena de conexión y cayó en sus valores por
   defecto. La variable solo vive en la terminal donde la definiste; si abriste
   una nueva, vuelve a ponerla.

   > La variable del shell tiene prioridad sobre `apps/backend/.env`, así que
   > estos comandos van contra Neon sin tocar tu configuración local. **Cierra
   > esa terminal al terminar** para no seguir apuntando a producción sin darte
   > cuenta.

4. Comprueba que llegó:

   ```powershell
   docker exec nova-db psql "$env:DATABASE_URL" -c "select count(*) from products"
   ```

   Deben salir 89.

---

## Paso 2 · Proyecto de la API

En Vercel → **Add New → Project** → importa `Cachureto/NOVA`.

| Ajuste | Valor |
|---|---|
| Project Name | `vokter-api` |
| Root Directory | `apps/backend` |
| Framework Preset | **Other** |
| Build Command | déjalo vacío |
| Output Directory | déjalo vacío |

Marca **"Include source files outside of the Root Directory"**. Es un monorepo
con npm workspaces: sin eso, el `package-lock.json` de la raíz no sube y la
instalación falla.

> **Si el build falla con `No Output Directory named "public" found`**, es que
> Vercel está tratando el proyecto como un sitio estático en vez de como una
> API. El repo ya trae lo necesario para que no pase: `apps/backend/vercel.json`
> fija `framework: null` y desactiva el build, `apps/backend/api/[...path].js`
> declara la app de Express como función, y `apps/backend/public/` existe para
> que el directorio de salida esté ahí. Si aun así falla, revisa que el Root
> Directory sea `apps/backend` y que Build Command y Output Directory estén
> vacíos en Settings → Build & Deployment.

Variables de entorno (Settings → Environment Variables):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la cadena *pooled* de Neon |
| `JWT_ACCESS_SECRET` | una cadena aleatoria de 32+ caracteres — **distinta de la que usas en local** |
| `JWT_ACCESS_TTL` | `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | `30` |
| `CORS_ORIGINS` | la URL de la web (la pones en el paso 3 y redespliegas) |
| `GEMINI_API_KEY` | tu clave, si quieres el asistente |
| `AI_MODEL` | `gemini-3.6-flash` |

`NODE_ENV=production` lo pone Vercel solo; no lo agregues.

Despliega y prueba:

```
https://vokter-api.vercel.app/api/health
```

Debe responder `{"status":"ok","dbTime":"..."}`. Guarda esa URL.

---

## Paso 3 · Proyecto de la web

Otro proyecto en Vercel, mismo repositorio.

| Ajuste | Valor |
|---|---|
| Project Name | `vokter` |
| Root Directory | `apps/web` |
| Framework Preset | Next.js |

También con **"Include source files outside of the Root Directory"**.

Variables de entorno:

| Variable | Valor |
|---|---|
| `API_ORIGIN` | `https://vokter-api.vercel.app` (la del paso 2) |
| `NEXT_PUBLIC_SITE_URL` | `https://vokter.vercel.app` |
| `NEXT_PUBLIC_APK_URL` | el enlace del APK de EAS |
| `NEXT_PUBLIC_API_URL` | **no la agregues** |

Lo de `NEXT_PUBLIC_API_URL` importa: si la dejas sin definir, el navegador usa
rutas relativas y entra por el proxy. Si le pones la URL de la API, el navegador
empieza a hablar directo con el otro dominio y el login se rompe por la cookie.

Despliega, y luego vuelve al proyecto de la API a poner `CORS_ORIGINS` con esta
URL y redesplegarlo.

---

## Paso 4 · Verificar

Sobre la web publicada:

1. **`/api/health`** en el dominio de la **web** responde `ok` → el proxy
   funciona.
2. El **catálogo** muestra los 89 productos con sus fotos.
3. **Crea una cuenta y entra.** Recarga la página: si sigues dentro, la cookie
   del refresh token está viajando bien. Es la prueba que importa.
4. Abre una ficha de producto: el **QR de autenticidad** se ve, y el validador
   responde al pegar el código.
5. Crea tu admin: con `$env:DATABASE_URL` apuntando a Neon,
   `npm run db:admin -- tu@correo.com`.

---

## Paso 5 · Rehacer el APK

El APK actual tiene horneada tu IP local, así que solo funciona en tu Wi-Fi. En
`apps/mobile/eas.json`, perfil `preview`:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://vokter.vercel.app",
  "EXPO_PUBLIC_WEB_URL": "https://vokter.vercel.app"
}
```

Las dos apuntan a la web: la API entra por su proxy y las fotos las sirve ella
misma. Después:

```bash
cd apps/mobile
eas build -p android --profile preview
```

Y actualiza `NEXT_PUBLIC_APK_URL` en Vercel con el enlace nuevo.

Con todo en HTTPS ya no hace falta `usesCleartextTraffic` en `app.json`;
puedes quitarlo si no vas a volver a probar contra un backend local.

---

## Qué esperar (y qué no)

- **La primera petición después de un rato es lenta.** Neon suspende la base
  cuando no hay actividad y Vercel enfría la función. Hablamos de unos segundos
  la primera vez; las siguientes van rápido. Es normal en los planes gratuitos.
- **El asistente de IA sigue con la cuota de Gemini.** El plan gratis permite
  pocas solicitudes por día y por modelo; si devuelve error, casi siempre es
  eso.
- **Las notificaciones push** necesitan las credenciales de FCM en EAS. No
  dependen del deploy.
- **Los pedidos no cobran nada.** El checkout registra el pedido y descuenta
  stock; no hay pasarela de pago conectada.

## Si algo falla

- **`No Output Directory named "public" found`** en el build de la API → Vercel no
  detectó que es Express y la trató como sitio estático. Pasa cuando ningún
  archivo cumple sus dos condiciones a la vez: importar `express` **y** exportar
  la app por defecto o llamar a `listen()`. `src/app.js` la exporta por defecto
  justo para esto; si alguien quita ese `export default`, vuelve el error.
- **`password authentication failed` o timeouts en la API** → revisa que
  `DATABASE_URL` sea la cadena *pooled* y termine en `?sslmode=require`.
- **La web carga pero el catálogo aparece vacío** → los Server Components no
  están llegando a la API: revisa `API_ORIGIN` en el proyecto de la web.
- **Entras y al recargar te saca** → hay una `NEXT_PUBLIC_API_URL` definida en
  el proyecto de la web. Bórrala y redespliega.
- **`FUNCTION_INVOCATION_TIMEOUT`** → la base estaba dormida y tardó en
  despertar. Reintenta; si es constante, mira los logs de la función en Vercel.
