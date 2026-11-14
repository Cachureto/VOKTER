import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBetSlip } from '../lib/betslip-context';
import { ALTO_BOLETO, ALTO_NAV, conNav } from '../lib/layout';
import { formatCOP, formatOdds } from '../lib/format';
import { DORADO } from '../theme/colors';
import { Pop, useCountUp } from './Motion';
import Tap from './Tap';
import { makeStyles } from '../theme';

// En estas pantallas la barra estorbaría (o ya se está viendo el boleto).
const OCULTA_EN = [
  '/boleto',
  '/login',
  '/registro',
  '/billetera',
  '/juego-responsable',
  '/ajustes',
  '/terminos',
  '/cuenta',
  '/apuestas',
];

/**
 * Espacio que dejan libre al final las pantallas principales: la barra de
 * navegación más la del boleto, que va justo encima.
 */
export const ALTO_BARRA = ALTO_NAV + ALTO_BOLETO + 16;

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
  const ganancia = useCountUp(potentialPayout);
  const cuota = useCountUp(totalOdds);
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
          // Con la barra de navegación visible, el boleto flota justo encima.
          paddingBottom: insets.bottom + (conNav(pathname) ? ALTO_NAV + 18 : 12),
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
        },
      ]}
    >
      <Tap
        onPress={() => router.push('/boleto')}
        scaleTo={0.97}
        style={styles.bar}
        accessibilityRole="button"
        accessibilityLabel={`Ver boleto: ${count} selecciones, cuota ${formatOdds(totalOdds)}`}
      >
        <Pop trigger={count} scale={1.35} style={styles.count}>
          <Text style={styles.countText}>{count}</Text>
        </Pop>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{count === 1 ? 'Apuesta simple' : `Combinada de ${count}`}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            Cuota {formatOdds(cuota)} · Ganas {formatCOP(Math.round(ganancia))}
          </Text>
        </View>
        <Text style={styles.cta}>Ver boleto</Text>
        <Ionicons name="chevron-forward" size={18} color={DORADO.texto} />
      </Tap>
    </Animated.View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 58,
    paddingHorizontal: 12,
    borderRadius: 18,
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
