'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const CLAVE = 'vokter-theme';

/**
 * Interruptor de tema claro / oscuro.
 *
 * Quién manda sobre el tema, en orden:
 *   1. lo que el visitante eligió aquí (queda en localStorage)
 *   2. si no eligió nada, la preferencia del sistema operativo
 *
 * El tema real lo aplica el script en línea de `layout.js` antes del primer
 * pintado; este componente solo lo cambia y lo recuerda. Por eso aquí no se
 * lee localStorage para pintar el icono inicial: hacerlo provocaría un
 * desajuste de hidratación, porque el servidor no sabe qué guardó el
 * navegador. Se arranca mostrando el estado neutro y se corrige en cuanto
 * el componente monta.
 */
export default function ThemeToggle({ className = '' }) {
  const [tema, setTema] = useState(null);

  useEffect(() => {
    const actual = document.documentElement.dataset.theme;
    setTema(actual === 'light' ? 'light' : 'dark');

    // Si el visitante no ha elegido nada, la página sigue al sistema en
    // vivo: cambiar el modo del equipo cambia la tienda sin recargar.
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const alCambiar = (e) => {
      try {
        if (localStorage.getItem(CLAVE)) return;
      } catch {
        // localStorage bloqueado: se sigue al sistema igualmente.
      }
      const siguiente = e.matches ? 'light' : 'dark';
      document.documentElement.dataset.theme = siguiente;
      setTema(siguiente);
    };
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  const alternar = () => {
    const siguiente = tema === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = siguiente;
    setTema(siguiente);
    try {
      localStorage.setItem(CLAVE, siguiente);
    } catch {
      // En navegación privada o con el almacenamiento bloqueado el cambio
      // vale para esta visita y no se recuerda. No es motivo para fallar.
    }
  };

  const esClaro = tema === 'light';

  return (
    <button
      type="button"
      onClick={alternar}
      className={`icon-btn ${className}`}
      // Hasta que monta no se sabe el tema, así que la etiqueta se queda
      // genérica en vez de mentir sobre a cuál se va a cambiar.
      aria-label={tema ? (esClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro') : 'Cambiar de tema'}
      title={tema ? (esClaro ? 'Modo oscuro' : 'Modo claro') : 'Cambiar de tema'}
    >
      {/* Los dos iconos están siempre en el DOM y se cruzan girando: así el
          cambio se siente parte del mismo lenguaje de movimiento del resto
          de la página, y no hay salto de maquetación al intercambiarlos. */}
      <span className="relative block h-[18px] w-[18px]">
        <Sun
          size={18}
          className={`absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            esClaro ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          }`}
        />
        <Moon
          size={18}
          className={`absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            esClaro ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
          }`}
        />
      </span>
    </button>
  );
}
