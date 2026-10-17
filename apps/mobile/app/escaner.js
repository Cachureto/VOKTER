import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/lib/api';
import { extractCode, RESULTS, validateCode } from '../src/lib/authenticity';
import { makeStyles, useTheme } from '../src/theme';

export default function Escaner() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [typing, setTyping] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { code, result, product, slug? }
  const [error, setError] = useState(null);

  const check = useCallback(async (raw) => {
    const code = extractCode(raw);
    if (!code) return;
    setChecking(true);
    setError(null);
    try {
      const data = await validateCode(code);
      // El endpoint devuelve el id del producto, no el slug: lo buscamos para
      // poder abrir la ficha desde aquí.
      let slug = null;
      if (data.product?.id) {
        slug = await apiFetch(`/api/products/${data.product.id}`)
          .then((p) => p.slug)
          .catch(() => null);
      }
      setResult({ ...data, slug });
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }, []);

  const reset = () => {
    setResult(null);
    setError(null);
    setManual('');
  };

  // ---------- Permisos ----------
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permIcon}>
          <Ionicons name="camera-outline" size={28} color={colors.accent} />
        </View>
        <Text style={styles.permTitle}>Necesitamos la cámara</Text>
        <Text style={styles.permText}>
          Solo se usa para leer el código QR del producto. No se guarda ninguna foto.
        </Text>
        <Pressable
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setTyping(true)} hitSlop={8}>
          <Text style={styles.link}>Escribir el código a mano</Text>
        </Pressable>
        {typing && (
          <ManualEntry value={manual} onChange={setManual} onSubmit={check} checking={checking} />
        )}
        {result && <ResultCard data={result} onReset={reset} router={router} />}
      </View>
    );
  }

  // ---------- Resultado ----------
  if (result || error) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.resultContent}>
        {error ? (
          <View style={[styles.resultCard, { borderColor: colors.dangerLine }]}>
            <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
            <Text style={styles.resultTitle}>No se pudo verificar</Text>
            <Text style={styles.resultText}>{error}</Text>
          </View>
        ) : (
          <ResultCard data={result} onReset={reset} router={router} />
        )}
        <Pressable onPress={reset} style={styles.button}>
          <Text style={styles.buttonText}>Escanear otro</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- Cámara ----------
  return (
    <View style={styles.screen}>
      <View style={styles.cameraBox}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={checking ? undefined : ({ data }) => check(data)}
        />
        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        {checking && (
          <View style={styles.checking}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.checkingText}>Verificando…</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.bottom} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Apunta al código QR del producto. También puedes escribir el código impreso en la caja.
        </Text>

        {typing ? (
          <ManualEntry value={manual} onChange={setManual} onSubmit={check} checking={checking} />
        ) : (
          <Pressable onPress={() => setTyping(true)} style={styles.buttonGhost}>
            <Ionicons name="keypad-outline" size={17} color={colors.foreground} />
            <Text style={styles.buttonGhostText}>Escribir el código</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function ManualEntry({ value, onChange, onSubmit, checking }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.manual}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="VKT-XXXXXXXX"
        placeholderTextColor={colors.subtle}
        autoCapitalize="characters"
        autoCorrect={false}
        style={styles.input}
        onSubmitEditing={() => onSubmit(value)}
        returnKeyType="search"
      />
      <Pressable
        onPress={() => onSubmit(value)}
        disabled={checking || value.trim().length < 4}
        style={({ pressed }) => [
          styles.manualButton,
          (pressed || checking || value.trim().length < 4) && { opacity: 0.5 },
        ]}
      >
        {checking ? (
          <ActivityIndicator color={colors.accentForeground} />
        ) : (
          <Ionicons name="arrow-forward" size={20} color={colors.accentForeground} />
        )}
      </Pressable>
    </View>
  );
}

function ResultCard({ data, onReset, router }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const info = RESULTS[data.result] ?? RESULTS.suspicious;
  const tone = colors[info.tone];

  return (
    <View style={[styles.resultCard, { borderColor: `${tone}4d` }]}>
      <Ionicons name={info.icon} size={34} color={tone} />
      <Text style={[styles.resultTitle, { color: tone }]}>{info.title}</Text>
      <Text style={styles.resultText}>{info.text}</Text>

      <Text style={styles.codeLabel}>Código</Text>
      <Text style={styles.code}>{data.code}</Text>

      {data.product && (
        <>
          <Text style={styles.codeLabel}>Producto</Text>
          <Text style={styles.productName}>{data.product.name}</Text>
          {data.slug && (
            <Pressable
              onPress={() => {
                onReset();
                router.push(`/product/${data.slug}`);
              }}
              style={styles.buttonGhost}
            >
              <Text style={styles.buttonGhostText}>Ver producto</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.foreground} />
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 28,
  },
  permIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 6 },
  permText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  cameraBox: {
    height: '52%',
    backgroundColor: '#000',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  frame: {
    position: 'absolute',
    top: '18%',
    bottom: '18%',
    left: '14%',
    right: '14%',
  },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.accent },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  checking: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(5,5,7,0.72)',
  },
  checkingText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  bottom: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 40, gap: 18 },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  manual: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginTop: 4 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    color: colors.foreground,
    fontFamily: 'monospace',
    fontSize: 15,
  },
  manualButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  resultCard: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  resultTitle: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 12 },
  resultText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  codeLabel: {
    color: colors.subtle,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 22,
  },
  code: { color: colors.foreground, fontFamily: 'monospace', fontSize: 15, marginTop: 5 },
  productName: { color: colors.foreground, fontSize: 16, fontWeight: '600', marginTop: 5, textAlign: 'center' },
  button: {
    width: '100%',
    marginTop: 22,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.accentForeground, fontSize: 15, fontWeight: '700' },
  buttonGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonGhostText: { color: colors.foreground, fontSize: 14.5, fontWeight: '600' },
  link: { color: colors.accent, fontSize: 14, fontWeight: '600', marginTop: 4 },
}));
