import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiFetch } from './api';

/**
 * Pide `path` a la API y lo mantiene al día.
 *
 *   const { data, error, loading, refreshing, reload } = useFetch('/matches?status=live', { every: 30000 });
 *
 * - `path` null = no pedir (por ejemplo, mientras no hay sesión).
 * - `every` (ms) vuelve a pedir en silencio cada tanto, solo con la app en primer plano.
 * - `reload()` es para "deslizar para actualizar": marca `refreshing`.
 * Los errores de una recarga silenciosa no borran los datos que ya se veían.
 */
export function useFetch(path, { auth = false, every = 0 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [refreshing, setRefreshing] = useState(false);
  const turno = useRef(0);

  const pedir = useCallback(
    async (modo) => {
      if (!path) {
        setLoading(false);
        return;
      }
      const yo = ++turno.current;
      if (modo === 'inicial') setLoading(true);
      if (modo === 'manual') setRefreshing(true);
      try {
        const res = await apiFetch(path, { auth });
        if (yo !== turno.current) return;
        setData(res);
        setError(null);
      } catch (err) {
        if (yo !== turno.current) return;
        if (modo !== 'silencio') setError(err);
      } finally {
        if (yo === turno.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [path, auth],
  );

  useEffect(() => {
    setData(null);
    pedir('inicial');
  }, [pedir]);

  useEffect(() => {
    if (!every || !path) return undefined;
    const id = setInterval(() => {
      if (AppState.currentState === 'active') pedir('silencio');
    }, every);
    return () => clearInterval(id);
  }, [every, path, pedir]);

  const reload = useCallback(() => pedir('manual'), [pedir]);
  const refetch = useCallback(() => pedir('silencio'), [pedir]);
  return { data, error, loading, refreshing, reload, refetch, setData };
}
