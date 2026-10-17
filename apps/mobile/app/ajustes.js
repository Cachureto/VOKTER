import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, detectApiUrl, detectWebUrl, getApiUrl, setApiUrl } from '../src/lib/api';
import { makeStyles, useTheme } from '../src/theme';

const STORAGE_KEY = 'vokter.apiUrl';

const MODOS = [
  { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
];

// Diagnóstico de conexión: aquí se ve y se corrige la URL del backend.
export default function Ajustes() {
  const styles = useStyles();
  const { colors, preference, setPreference } = useTheme();
  const [url, setUrl] = useState(detectApiUrl());
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState({ status: 'loading' });

  const check = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [health, products] = await Promise.all([
        apiFetch('/api/health'),
        apiFetch('/api/products?limit=1'),
      ]);
      setState({ status: 'ok', total: products.total, dbTime: health?.dbTime });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved) {
          setApiUrl(saved);
          setUrl(getApiUrl());
        }
      } catch {
        // Sin SecureStore seguimos con la URL detectada.
      }
      check();
    })();
  }, [check]);

  const applyUrl = async () => {
    const next = setApiUrl(url) ?? detectApiUrl();
    setUrl(next);
    setEditing(false);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, next);
    } catch {
      // La URL ya quedó activa en memoria aunque no se pueda guardar.
    }
    check();
  };

  const resetUrl = async () => {
    setApiUrl(null);
    setUrl(detectApiUrl());
    setEditing(false);
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch {
      // ignorar
    }
    check();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Apariencia</Text>
        <Text style={styles.subtitle}>
          «Sistema» sigue el modo claro u oscuro del teléfono. El botón de sol/luna del inicio
          cambia entre los dos al instante.
        </Text>
        <View style={styles.segment}>
          {MODOS.map((m) => {
            const activo = preference === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setPreference(m.value)}
                style={[styles.segmentItem, activo && styles.segmentItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
              >
                <Ionicons
                  name={m.icon}
                  size={16}
                  color={activo ? colors.contrastForeground : colors.muted}
                />
                <Text style={[styles.segmentText, activo && styles.segmentTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.title, { marginTop: 36 }]}>Conexión</Text>
        <Text style={styles.subtitle}>
          La app detecta sola la IP del PC donde corre Expo. Cámbiala solo si el backend está en
          otra máquina o en otro puerto.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.label}>API</Text>
            <Pressable onPress={() => setEditing((v) => !v)} hitSlop={10}>
              <Text style={styles.link}>{editing ? 'Cancelar' : 'Cambiar'}</Text>
            </Pressable>
          </View>

          {editing ? (
            <>
              <TextInput
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="http://192.168.1.10:4000"
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
              <View style={styles.row}>
                <Pressable onPress={applyUrl} style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Guardar y probar</Text>
                </Pressable>
                <Pressable onPress={resetUrl} style={styles.smallButtonGhost}>
                  <Text style={styles.smallButtonGhostText}>Detectar sola</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.mono}>{url}</Text>
          )}

          <Text style={[styles.label, { marginTop: 18 }]}>Fotos (web)</Text>
          <Text style={styles.mono}>{detectWebUrl()}</Text>

          {state.status === 'loading' && (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
          )}

          {state.status === 'ok' && (
            <View style={[styles.alert, styles.alertOk]}>
              <Text style={[styles.alertTitle, { color: colors.live }]}>✓ Conectado</Text>
              <Text style={styles.alertText}>{state.total} productos en el catálogo</Text>
            </View>
          )}

          {state.status === 'error' && (
            <View style={[styles.alert, styles.alertError]}>
              <Text style={[styles.alertTitle, { color: colors.danger }]}>Sin conexión</Text>
              <Text style={styles.alertText}>{state.message}</Text>
              <Text style={styles.hint}>
                Revisa que el backend esté corriendo en el PC y que el firewall de Windows permita
                el puerto 4000. Si no, toca «Cambiar» y escribe la IP del PC.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={check}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
          disabled={state.status === 'loading'}
        >
          <Text style={styles.buttonText}>Probar de nuevo</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  title: { color: colors.foreground, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 8, lineHeight: 20 },
  segment: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 18,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 999,
  },
  segmentItemActive: { backgroundColor: colors.contrast },
  segmentText: { color: colors.muted, fontSize: 13.5, fontWeight: '600' },
  segmentTextActive: { color: colors.contrastForeground },
  card: {
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.subtle, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  link: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  mono: { color: colors.foreground, fontFamily: 'monospace', fontSize: 14, marginTop: 6 },
  input: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.foreground,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  smallButton: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: { color: colors.accentForeground, fontSize: 14, fontWeight: '700' },
  smallButtonGhost: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonGhostText: { color: colors.foreground, fontSize: 14, fontWeight: '600' },
  alert: { marginTop: 20, padding: 14, borderRadius: 14, borderWidth: 1 },
  alertOk: { borderColor: colors.liveLine, backgroundColor: colors.liveSoft },
  alertError: { borderColor: colors.dangerLine, backgroundColor: colors.dangerSoft },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  alertText: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  hint: { color: colors.subtle, fontSize: 12, marginTop: 10, lineHeight: 18 },
  button: {
    marginTop: 16,
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.accentForeground, fontSize: 15, fontWeight: '700' },
}));
