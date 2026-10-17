import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImage } from '../lib/api';
import { makeStyles, useTheme } from '../theme';

const INTERVALO = 4500;
const FUNDIDO = 1100;

/**
 * Baldosa con fundido cruzado: mantiene la foto anterior debajo mientras la
 * nueva aparece encima con un leve zoom de 1.06 a 1 (igual que en la web, el
 * zoom es lo que hace que el cambio se lea como movimiento y no como parpadeo).
 */
function Baldosa({ product, style }) {
  const styles = useStyles();
  const router = useRouter();
  const [capas, setCapas] = useState({ actual: product, anterior: null });
  const t = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (product.id === capas.actual.id) return;
    setCapas((c) => ({ actual: product, anterior: c.actual }));
    t.setValue(0);
    Animated.timing(t, {
      toValue: 1,
      duration: FUNDIDO,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return (
    <Pressable
      onPress={() => router.push(`/product/${capas.actual.slug}`)}
      style={[styles.tile, style]}
      accessibilityRole="imagebutton"
      accessibilityLabel={capas.actual.name}
    >
      {capas.anterior && (
        <Image source={{ uri: resolveImage(capas.anterior.coverUrl) }} style={styles.fill} resizeMode="cover" />
      )}
      <Animated.Image
        source={{ uri: resolveImage(capas.actual.coverUrl) }}
        resizeMode="cover"
        style={[
          styles.fill,
          {
            opacity: t,
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }],
          },
        ]}
      />
    </Pressable>
  );
}

/** Texto que cambia con un fundido corto (código y nombre del certificado). */
function TextoQueCambia({ children, clave, style }) {
  const t = useRef(new Animated.Value(1)).current;
  const [texto, setTexto] = useState(children);

  useEffect(() => {
    if (children === texto) return;
    Animated.timing(t, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setTexto(children);
      Animated.timing(t, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return (
    <Animated.Text
      numberOfLines={1}
      style={[
        style,
        { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] },
      ]}
    >
      {texto}
    </Animated.Text>
  );
}

/**
 * Mosaico del hero (equivalente al HeroShowcase de la web): una foto grande
 * y dos pequeñas que rotan cada 4,5 s, y un certificado flotante que sigue a
 * la foto grande. Se detiene con la app en segundo plano o si el sistema
 * pide reducir movimiento.
 */
export default function HeroShowcase({ products }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const disponibles = (products ?? []).filter((p) => p?.coverUrl);
  const total = disponibles.length;
  const [i, setI] = useState(0);
  const [quieto, setQuieto] = useState(false);
  const activa = useRef(true);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setQuieto).catch(() => {});
    const sub = AppState.addEventListener('change', (s) => {
      activa.current = s === 'active';
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (quieto || total < 4) return undefined;
    const id = setInterval(() => {
      if (activa.current) setI((n) => (n + 1) % total);
    }, INTERVALO);
    return () => clearInterval(id);
  }, [quieto, total]);

  if (!total) return null;

  const en = (d) => disponibles[(i + d) % total];
  const principal = en(0);

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <Baldosa product={principal} style={styles.big} />
        {total > 1 && (
          <View style={styles.side}>
            <Baldosa product={en(1)} style={styles.small} />
            {total > 2 && <Baldosa product={en(2)} style={styles.small} />}
          </View>
        )}
      </View>

      <View style={styles.cert}>
        <View style={styles.certHead}>
          <View style={styles.certIcon}>
            <Ionicons name="shield-checkmark" size={19} color={colors.live} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.certTitle}>Certificado Vokter</Text>
            <TextoQueCambia clave={principal.id} style={styles.certCode}>
              {principal.authenticityCode ?? 'VKT-XXXXXXXX'}
            </TextoQueCambia>
          </View>
        </View>
        <View style={styles.certFoot}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <TextoQueCambia clave={principal.id} style={styles.certName}>
              {principal.name}
            </TextoQueCambia>
          </View>
          <View style={styles.activo}>
            <Text style={styles.activoText}>Activo</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { marginTop: 36, marginBottom: 46 },
  grid: { flexDirection: 'row', gap: 10, aspectRatio: 6 / 5 },
  big: { flex: 3, borderRadius: 24 },
  side: { flex: 2, gap: 10 },
  small: { flex: 1, borderRadius: 20 },
  tile: { overflow: 'hidden', backgroundColor: colors.tile },
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  cert: {
    position: 'absolute',
    left: 10,
    bottom: -30,
    width: '82%',
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  certHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  certIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.liveSoft,
  },
  certTitle: { color: colors.foreground, fontSize: 13.5, fontWeight: '700' },
  certCode: { color: colors.muted, fontSize: 11.5, fontFamily: 'monospace', marginTop: 1 },
  certFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  certName: { color: colors.muted, fontSize: 12 },
  activo: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.liveLine,
    backgroundColor: colors.liveSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  activoText: { color: colors.live, fontSize: 11, fontWeight: '700' },
}));
