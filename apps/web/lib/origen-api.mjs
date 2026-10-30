/**
 * Normaliza el origen de la API a la forma que todos esperan: protocolo,
 * dominio y nada más. Sin barra final y sin ninguna ruta pegada.
 *
 * Existe porque este valor se escribe a mano en el panel de un hosting, y ahí
 * se cuelan siempre los mismos tres errores: pegar el host pelado sin
 * `https://`, dejar la barra del final, o pegar una URL completa de una ruta
 * concreta (por ejemplo la de `/api/health`, que es la que uno abre para
 * comprobar que la API vive). Ese último caso es el más traicionero: la web
 * compila sin quejarse y luego cada llamada va a `/api/health/api/products`.
 *
 * Devuelve `null` si el valor no sirve, en vez de lanzar: quien lo use decide
 * si eso es motivo para abortar. Este módulo también acaba en el paquete del
 * navegador, donde una excepción al importar dejaría la página en blanco.
 */
export function normalizarOrigen(valor) {
  const limpio = String(valor ?? '').trim();
  if (!limpio) return null;

  const conProtocolo = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
  try {
    // `new URL(...).origin` se queda solo con protocolo + dominio + puerto, así
    // que de paso descarta la ruta, la barra final y cualquier parámetro.
    return new URL(conProtocolo).origin;
  } catch {
    return null;
  }
}
