import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { ARCHIVOS, conFuente, marcarFuentes } from './fonts';
import { palettes } from './colors';

export { alpha, palettes } from './colors';
export { FUENTE } from './fonts';

// Clave propia: la preferencia de la app de la tienda no se mezcla con esta.
const CLAVE = 'f360-theme';
const ThemeContext = createContext(null);

/**
 * Tema claro / oscuro:
 *   1. lo que el usuario eligió en la app (queda guardado)
 *   2. si no eligió nada, oscuro, que es el de la marca
 *
 * `preference` es 'system' | 'light' | 'dark'; `scheme` es el que se pinta.
 */
export function ThemeProvider({ children }) {
  const sistema = useColorScheme();
  const [preference, setPreferenceState] = useState('dark');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Preferencia guardada y tipografías, en paralelo. Si las fuentes no
    // cargan, la app sigue con la del sistema en vez de quedarse en blanco.
    const preferencia = AsyncStorage.getItem(CLAVE)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => {});
    const fuentes = Font.loadAsync(ARCHIVOS)
      .then(() => marcarFuentes(true))
      .catch(() => marcarFuentes(false));
    Promise.all([preferencia, fuentes]).finally(() => setListo(true));
  }, []);

  const scheme =
    preference === 'system' ? (sistema === 'light' ? 'light' : 'dark') : preference;

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    // El oscuro es el de la marca y el valor por defecto, así que "Sistema"
    // también se guarda: si no, al reabrir volvería a oscuro.
    AsyncStorage.setItem(CLAVE, next).catch(() => {});
  }, []);

  const toggle = useCallback(
    () => setPreference(scheme === 'light' ? 'dark' : 'light'),
    [scheme, setPreference],
  );

  const value = useMemo(
    () => ({
      scheme,
      isLight: scheme === 'light',
      colors: palettes[scheme],
      preference,
      setPreference,
      toggle,
    }),
    [scheme, preference, setPreference, toggle],
  );

  // Hasta leer la preferencia guardada no se pinta nada: así no hay un
  // destello del tema equivocado (son milisegundos, detrás del splash).
  if (!listo) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

/**
 * Igual que StyleSheet.create, pero recibe los colores del tema activo.
 * Crea una hoja por tema (solo dos) y la reutiliza, así cambiar de modo no
 * recrea estilos en cada render.
 *
 *   const useStyles = makeStyles((colors) => ({ screen: { backgroundColor: colors.background } }));
 *   // dentro del componente:
 *   const styles = useStyles();
 */
export function makeStyles(factory) {
  const cache = {};
  return function useStyles() {
    const { scheme, colors } = useTheme();
    if (!cache[scheme]) {
      const crudo = factory(colors);
      const conFuentes = Object.fromEntries(Object.entries(crudo).map(([k, v]) => [k, conFuente(v)]));
      cache[scheme] = StyleSheet.create(conFuentes);
    }
    return cache[scheme];
  };
}
