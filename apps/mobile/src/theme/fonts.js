/**
 * Tipografía: Inter para el texto y Inter Display para títulos y cifras
 * grandes. Se cargan una vez al arrancar (ThemeProvider espera a que estén).
 *
 * En Android una fuente propia no responde a `fontWeight`: cada peso es una
 * familia distinta. Por eso `conFuente` traduce el peso de cada estilo a su
 * familia, y lo aplica `makeStyles` a todos los estilos de texto de la app.
 */
export const ARCHIVOS = {
  'Inter-Regular': require('../../assets/fonts/Inter-Regular.otf'),
  'Inter-Medium': require('../../assets/fonts/Inter-Medium.otf'),
  'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.otf'),
  'Inter-Bold': require('../../assets/fonts/Inter-Bold.otf'),
  'Inter-ExtraBold': require('../../assets/fonts/Inter-ExtraBold.otf'),
  'InterDisplay-Bold': require('../../assets/fonts/InterDisplay-Bold.otf'),
  'InterDisplay-ExtraBold': require('../../assets/fonts/InterDisplay-ExtraBold.otf'),
  'InterDisplay-Black': require('../../assets/fonts/InterDisplay-Black.otf'),
};

const TEXTO = { 400: 'Inter-Regular', 500: 'Inter-Medium', 600: 'Inter-SemiBold', 700: 'Inter-Bold', 800: 'Inter-ExtraBold', 900: 'InterDisplay-Black' };
// A partir de 20 px se usa la versión Display: más apretada y con más carácter.
const DISPLAY = { 400: 'InterDisplay-Bold', 500: 'InterDisplay-Bold', 600: 'InterDisplay-Bold', 700: 'InterDisplay-Bold', 800: 'InterDisplay-ExtraBold', 900: 'InterDisplay-Black' };

let disponibles = false;
export const marcarFuentes = (ok) => {
  disponibles = ok;
};

/** Familias directas, para estilos sueltos fuera de makeStyles. */
export const FUENTE = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  display: 'InterDisplay-ExtraBold',
  black: 'InterDisplay-Black',
};

/** Asigna la familia según peso y tamaño a un estilo de texto. */
export function conFuente(estilo) {
  if (!disponibles || !estilo || estilo.fontFamily) return estilo;
  // Con peso explícito, o un estilo base de texto (tamaño + color). Un estilo
  // que solo cambia el tamaño es un ajuste que se combina con otro: si se le
  // pusiera familia aquí, pisaría el peso del estilo base.
  const esTexto = estilo.fontWeight != null || (estilo.fontSize != null && estilo.color != null);
  if (!esTexto) return estilo;
  const peso = Number(estilo.fontWeight === 'bold' ? 700 : estilo.fontWeight === 'normal' ? 400 : estilo.fontWeight) || 400;
  const redondeado = Math.min(900, Math.max(400, Math.round(peso / 100) * 100));
  const tabla = (estilo.fontSize ?? 14) >= 20 ? DISPLAY : TEXTO;
  // eslint-disable-next-line no-unused-vars
  const { fontWeight, ...resto } = estilo;
  return { ...resto, fontFamily: tabla[redondeado] };
}
