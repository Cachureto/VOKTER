import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE = 'f360.boleto';
const MAX_SELECCIONES = 10;
const BoletoContext = createContext(null);

/** Pago posible, en pesos enteros, igual que lo calcula el servidor. */
export function pagoPosible(stake, cuota) {
  const s = Number(stake) || 0;
  return Math.floor((s * Math.round(cuota * 100)) / 100);
}

const redondear = (n) => Math.round(n * 100) / 100;

/**
 * Boleto de apuestas: las selecciones que el usuario va tocando en los
 * partidos, el valor a apostar y la cuota total. Se guarda en el teléfono para
 * que no se pierda al cerrar la app.
 *
 * Regla igual a la del servidor: una sola selección por partido. Tocar otra
 * del mismo partido la reemplaza, y tocar la misma la quita.
 */
export function BetSlipProvider({ children }) {
  const [selections, setSelections] = useState([]);
  const [stake, setStake] = useState('10000');
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((raw) => {
        const datos = raw ? JSON.parse(raw) : null;
        if (Array.isArray(datos?.selections)) setSelections(datos.selections);
        if (datos?.stake) setStake(String(datos.stake));
      })
      .catch(() => {})
      .finally(() => setCargado(true));
  }, []);

  useEffect(() => {
    if (!cargado) return;
    AsyncStorage.setItem(CLAVE, JSON.stringify({ selections, stake })).catch(() => {});
  }, [selections, stake, cargado]);

  /** sel: { selectionId, odds, label, marketName, matchId, matchLabel, kickoffAt, league } */
  const toggle = useCallback((sel) => {
    setSelections((prev) => {
      if (prev.some((s) => s.selectionId === sel.selectionId)) {
        return prev.filter((s) => s.selectionId !== sel.selectionId);
      }
      const sinEsePartido = prev.filter((s) => s.matchId !== sel.matchId);
      if (sinEsePartido.length >= MAX_SELECCIONES) return prev;
      return [...sinEsePartido, sel];
    });
  }, []);

  const remove = useCallback((selectionId) => {
    setSelections((prev) => prev.filter((s) => s.selectionId !== selectionId));
  }, []);

  const clear = useCallback(() => setSelections([]), []);

  /** Aplica cuotas nuevas que devolvió el servidor: [{ selectionId, now }]. */
  const updateOdds = useCallback((cambios) => {
    setSelections((prev) =>
      prev.map((s) => {
        const c = cambios.find((x) => x.selectionId === s.selectionId);
        return c ? { ...s, previousOdds: s.odds, odds: c.now } : s;
      }),
    );
  }, []);

  const value = useMemo(() => {
    const totalOdds = selections.length ? redondear(selections.reduce((c, s) => c * s.odds, 1)) : 0;
    return {
      selections,
      count: selections.length,
      stake,
      setStake,
      totalOdds,
      potentialPayout: pagoPosible(stake, totalOdds),
      has: (selectionId) => selections.some((s) => s.selectionId === selectionId),
      toggle,
      remove,
      clear,
      updateOdds,
      max: MAX_SELECCIONES,
    };
  }, [selections, stake, toggle, remove, clear, updateOdds]);

  return <BoletoContext.Provider value={value}>{children}</BoletoContext.Provider>;
}

export function useBetSlip() {
  const ctx = useContext(BoletoContext);
  if (!ctx) throw new Error('useBetSlip debe usarse dentro de <BetSlipProvider>');
  return ctx;
}
