import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import { GoldButton, OutlineButton, Segmented } from '../src/components/ui';
import { apiFetch, detectApiUrl, getApiUrl, saveApiUrl } from '../src/lib/api';
import { makeStyles, useTheme } from '../src/theme';

const MODOS = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const PROVEEDOR = { demo: 'Demostración (simulado)', 'api-football': 'API-Football (en vivo)' };

/** Apariencia y diagnóstico de la conexión con el servidor. */
export default function Ajustes() {
  const styles = useStyles();
  const { colors, preference, setPreference } = useTheme();
  const [url, setUrl] = useState(getApiUrl());
  const [editando, setEditando] = useState(false);
  const [estado, setEstado] = useState({ status: 'loading' });

  const probar = useCallback(async () => {
    setEstado({ status: 'loading' });
    try {
      setEstado({ status: 'ok', data: await apiFetch('/estado') });
    } catch (err) {
      setEstado({ status: 'error', message: err.message });
    }
  }, []);

  useEffect(() => {
    probar();
  }, [probar]);

  const guardar = async (nueva) => {
    setUrl(await saveApiUrl(nueva));
    setEditando(false);
    probar();
  };

  const d = estado.data;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Apariencia</Text>
        <Text style={styles.subtitle}>«Sistema» sigue el modo claro u oscuro del teléfono.</Text>
        <Segmented options={MODOS} value={preference} onChange={setPreference} style={{ marginTop: 14 }} />

        <Text style={[styles.title, { marginTop: 32 }]}>Conexión</Text>
        <Text style={styles.subtitle}>Servidor de Fanáticos 360. Cámbialo solo si te lo indica soporte o estás probando en local.</Text>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.label}>API</Text>
            <Pressable onPress={() => setEditando((v) => !v)} hitSlop={10}>
              <Text style={styles.link}>{editando ? 'Cancelar' : 'Cambiar'}</Text>
            </Pressable>
          </View>
          {editando ? (
            <>
              <TextInput
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://mi-api.com"
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
              <View style={styles.row}>
                <GoldButton label="Guardar y probar" size="sm" onPress={() => guardar(url)} style={{ flex: 1 }} />
                <OutlineButton label="Restablecer" tone="neutral" onPress={() => guardar(null)} style={{ flex: 1, height: 44 }} />
              </View>
              <Text style={styles.hint}>Por defecto: {detectApiUrl()}</Text>
            </>
          ) : (
            <Text style={styles.mono}>{url}</Text>
          )}

          {estado.status === 'loading' && <ActivityIndicator color={colors.accent} style={{ marginTop: 18 }} />}
          {estado.status === 'ok' && (
            <View style={[styles.alert, styles.alertOk]}>
              <Text style={[styles.alertTitle, { color: colors.live }]}>✓ Conectado</Text>
              <Text style={styles.alertText}>Datos: {PROVEEDOR[d.proveedor] ?? d.proveedor}</Text>
              <Text style={styles.alertText}>Pagos: {d.pagos === 'pruebas' ? 'modo pruebas (simulados)' : 'reales'}</Text>
              {d.proveedor === 'api-football' && (
                <Text style={styles.alertText}>
                  Consultas hoy: {d.consultasHoy} de {d.presupuestoDiario}
                </Text>
              )}
            </View>
          )}
          {estado.status === 'error' && (
            <View style={[styles.alert, styles.alertError]}>
              <Text style={[styles.alertTitle, { color: colors.danger }]}>Sin conexión</Text>
              <Text style={styles.alertText}>{estado.message}</Text>
              <Text style={styles.hint}>Revisa tu conexión a internet e inténtalo de nuevo.</Text>
            </View>
          )}
        </View>

        <OutlineButton label="Probar de nuevo" tone="neutral" icon="refresh" onPress={probar} style={{ marginTop: 16 }} />
        <Text style={styles.version}>Fanáticos 360 · v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { color: colors.foreground, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20 },
  card: { marginTop: 18, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.subtle, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  link: { color: colors.accent, fontSize: 13.5, fontWeight: '800' },
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
  hint: { color: colors.subtle, fontSize: 12.5, marginTop: 8, lineHeight: 18 },
  alert: { marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1, gap: 3 },
  alertOk: { borderColor: colors.liveLine, backgroundColor: colors.liveSoft },
  alertError: { borderColor: colors.dangerLine, backgroundColor: colors.dangerSoft },
  alertTitle: { fontSize: 15, fontWeight: '900', marginBottom: 3 },
  alertText: { color: colors.foreground, fontSize: 13.5, lineHeight: 19 },
  version: { color: colors.subtle, fontSize: 12, textAlign: 'center', marginTop: 24, fontFamily: 'monospace' },
}));
