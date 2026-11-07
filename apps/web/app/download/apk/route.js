import { urlDelApk } from '@/lib/apk';

// Enlace fijo del QR y del botón: /download/apk redirige a donde esté el APK
// hoy. Si mañana cambia de sitio, basta con cambiar APK_URL.
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(null, {
    status: 302,
    headers: { Location: urlDelApk(), 'Cache-Control': 'no-store' },
  });
}
