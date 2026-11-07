import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBetSlip } from '../lib/betslip-context';
import { formatCOP, formatOdds } from '../lib/format';
import { DORADO } from '../theme/colors';
import { makeStyles } from '../theme';

// En estas pantallas la barra estorbaría (o ya se está viendo el boleto).
const OCULTA_EN = ['/boleto', '/login', '/registro', '/billetera', '/juego-responsable', '/ajustes', '/terminos', '/cuenta'];

/** Alto que ocupa la barra: las pantallas lo dejan libre al final de su lista. */
export const ALTO_BARRA = 96;

/**
 * Barra flotante del boleto: aparece desde abajo en cuanto hay una selección
 * y lleva al boleto con un toque. Muestra cuántas van, la cuota total y lo
 * que se podría ganar con el valor elegido.
 */
export default function BetSlipBar() {
  const styles = useStyles();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { count, totalOdds, potentialPayout } = useBetSlip();
  const visible = count > 0 && !OCULTA_EN.some((r) => pathname.startsWith(r));
  const t = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: visible ? 1 : 0,
      duration: visible ? 380 : 240,
      easing: visible ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.bezier(0.65, 0, 0.35, 1),
      useNativeDriver: true,
    }).start();
  }, [visible, t]);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        {
          paddingBottom: insets.bottom + 12,
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
        },
      ]}
    >
      <Pressable
        onPress={() => router.push('/boleto')}
        style={({ pressed }) => [styles.bar, pressed && { transform: [{ scale: 0.98 }] }]}
        accessibilityRole="button"
        accessibilityLabel={`Ver boleto: ${count} selecciones, cuota ${formatOdds(totalOdds)}`}
      >
        <View style={styles.count}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{count === 1 ? 'Apuesta simple' : `Combinada de ${count}`}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            Cuota {formatOdds(totalOdds)} · Ganas {formatCOP(potentialPayout)}
          </Text>
        </View>
        <Text style={styles.cta}>Ver boleto</Text>
        <Ionicons name="chevron-forward" size={18} color={DORADO.texto} />
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 64,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: DORADO.fondo,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  count: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DORADO.texto,
  },
  countText: { color: DORADO.fondo, fontSize: 16, fontWeight: '900' },
  title: { color: DORADO.texto, fontSize: 15, fontWeight: '900' },
  sub: { color: DORADO.texto, opacity: 0.75, fontSize: 12.5, fontWeight: '600', marginTop: 1 },
  cta: { color: DORADO.texto, fontSize: 14, fontWeight: '900' },
}));
