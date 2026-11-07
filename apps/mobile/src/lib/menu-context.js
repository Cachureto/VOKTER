import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const MenuContext = createContext(null);

/** Estado del menú principal: cualquier pantalla puede abrirlo. */
export function MenuProvider({ children }) {
  const [abierto, setAbierto] = useState(false);
  const open = useCallback(() => setAbierto(true), []);
  const close = useCallback(() => setAbierto(false), []);
  const value = useMemo(() => ({ abierto, open, close }), [abierto, open, close]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu debe usarse dentro de <MenuProvider>');
  return ctx;
}
