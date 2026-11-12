/**
 * Punto de entrada de la API en Vercel.
 *
 * Vercel convierte este archivo en una función, y el rewrite de `vercel.json`
 * le manda todas las peticiones conservando la ruta original, así que el
 * enrutado de Express funciona tal cual. Es el patrón que documenta la guía de
 * Express de Vercel.
 *
 * No se usa la detección automática del servidor (`src/server.js` con
 * `app.listen`): esa exige que el proyecto no declare build command, y aquí
 * hace falta declararlo vacío para que Vercel no ejecute el `turbo run build`
 * del monorepo, que no produce nada para el backend.
 *
 * Tampoco se usa un nombre comodín (`[...path].js`): en este proyecto Vercel
 * solo lo hacía coincidir con un segmento, así que /api/products entraba pero
 * /api/auth/login daba 404 antes de llegar a Express.
 *
 * `src/server.js` sigue siendo el arranque de local y no se toca.
 */
export { app as default } from '../src/app.js';
