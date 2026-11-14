/**
 * Medidas compartidas de lo que flota abajo (barra de navegación y barra del
 * boleto), para que las pantallas dejen el espacio justo al final.
 */
export const ALTO_NAV = 68;
export const ALTO_BOLETO = 76;

// Pantallas principales: muestran la barra de navegación inferior.
export const RUTAS_CON_NAV = ['/', '/partidos', '/apuestas', '/cuenta', '/billetera'];

export const conNav = (pathname) => RUTAS_CON_NAV.includes(pathname);
