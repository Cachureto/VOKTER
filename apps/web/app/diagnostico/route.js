/**
 * Diagnóstico de la conexión con la API, pensado para desplegar.
 *
 * Cuando el servidor no alcanza la API, las páginas revientan y el navegador
 * solo enseña un error de React con un número: el motivo real se queda en los
 * registros del servidor, que no siempre están a mano. Esta ruta hace la misma
 * llamada que haría una página, pero sin fallar nunca, y cuenta en texto plano
 * qué pasó.
 *
 * Es información de infraestructura, no datos de nadie: el origen de la API es
 * público y aquí no se toca la base ni la sesión.
 */
import { normalizarOrigen } from '@/lib/origen-api.mjs';

export const dynamic = 'force-dynamic';

const CRUDO =
  process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.API_ORIGIN_COMPILADO;
const ORIGEN = normalizarOrigen(CRUDO) ?? 'http://localhost:4000';

// De dónde salió el valor, que es justo lo que se discute al desplegar.
const FUENTE = process.env.API_ORIGIN
  ? 'variable API_ORIGIN del entorno'
  : process.env.NEXT_PUBLIC_API_URL
    ? 'variable NEXT_PUBLIC_API_URL del entorno'
    : process.env.API_ORIGIN_COMPILADO
      ? 'valor incrustado al compilar'
      : 'valor por defecto (no hay ninguna variable)';

const PISTAS = {
  ENOTFOUND: 'El servidor no logra resolver ese dominio. Revisa que esté bien escrito y que siga existiendo.',
  EAI_AGAIN: 'Falló la resolución de nombres del servidor. Suele ser pasajero; si no, el hosting no tiene DNS de salida.',
  ECONNREFUSED: 'El dominio resuelve pero nadie contesta ahí. La API probablemente no está corriendo.',
  ETIMEDOUT: 'La conexión se quedó esperando. Lo más común es que el hosting bloquee las conexiones salientes.',
  UND_ERR_CONNECT_TIMEOUT:
    'La conexión se quedó esperando. Lo más común es que el hosting bloquee las conexiones salientes.',
  UND_ERR_HEADERS_TIMEOUT: 'La API aceptó la conexión pero no respondió a tiempo.',
  CERT_HAS_EXPIRED: 'El certificado HTTPS de la API está vencido.',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'El servidor no confía en el certificado HTTPS de la API.',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'La API usa un certificado propio que el servidor no acepta.',
};

export async function GET() {
  const inicio = Date.now();
  const url = `${ORIGEN}/api/health`;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      cache: 'no-store',
      // Sin esto una salida bloqueada deja la petición colgada mucho tiempo.
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    const codigo = error?.cause?.code ?? error?.code ?? error?.name ?? 'DESCONOCIDO';
    return Response.json(
      {
        alcanzaLaApi: false,
        origen: ORIGEN,
        valorDeLaVariable: CRUDO ?? '(ninguna)',
        fuenteDelOrigen: FUENTE,
        urlProbada: url,
        codigo,
        detalle: error?.message ?? String(error),
        pista:
          PISTAS[codigo] ??
          'El servidor no pudo completar la llamada. El código de arriba es la mejor pista.',
        ms: Date.now() - inicio,
      },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  }

  const texto = await respuesta.text().catch(() => '');
  let cuerpo;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    // Si no es JSON suele ser una página de error del hosting o del proxy:
    // un trozo basta para reconocerla.
    cuerpo = texto.slice(0, 300);
  }

  return Response.json(
    {
      alcanzaLaApi: respuesta.ok,
      origen: ORIGEN,
      valorDeLaVariable: CRUDO ?? '(ninguna)',
      fuenteDelOrigen: FUENTE,
      urlProbada: url,
      estado: respuesta.status,
      cuerpo,
      pista: respuesta.ok
        ? 'La API responde. Si la web sigue fallando, el problema ya no es la conexión.'
        : 'La API contesta pero con error. Mira el cuerpo: si habla de la base de datos, revisa DATABASE_URL en la API.',
      ms: Date.now() - inicio,
    },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
}
