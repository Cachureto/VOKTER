import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBetSlip } from '../lib/betslip-context';
import { ALTO_NAV, conNav } from '../lib/layout';
import { CURVAS, movimientoReducido, RESORTES } from '../lib/motion';
import { DORADO } from '../theme/colors';
import { makeStyles, useTheme } from '../theme';
import { Pop } from './Motion';

const ITEMS = [
  { ruta: '/', label: 'Inicio', icon: 'home' },
  { ruta: '/partidos', label: 'Partidos', icon: 'flame' },
  { ruta: '/boleto', label: 'Boleto', icon: 'ticket', boleto: true },
  { ruta: '/apuestas', label: 'Jugadas', icon: 'stats-chart' },
  { ruta: '/cuenta', label: 'Cuenta', icon: 'person' },
];

const BOTON = 48;
const ACTIVO = 108;

/**
 * Dock de navegación: una píldora flotante centrada abajo. La sección activa
 * se estira en una pastilla oscura con el ícono dorado y su nombre; las demás
 * son solo íconos. El boleto lleva el número de selecciones. Se esconde
 * deslizándose hacia abajo fuera de las pantallas principales.
 */
export default function BottomNav() {
  const styles = useStyles();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { count } = useBetSlip();
  const visible = conNav(pathname);
  const t = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (movimientoReducido()) {
      t.setValue(visible ? 1 : 0);
      return;
    }
    Animated.timing(t, {
      toValue: visible ? 1 : 0,
      duration: visible ? 360 : 220,
      easing: visible ? CURVAS.entrar : CURVAS.salir,
      useNativeDriver: true,
    }).start();
  }, [visible, t]);

  const ir = (ruta) => {
    if (ruta === pathname) return;
    if (ruta === '/') router.dismissTo('/');
    else if (ruta === '/boleto') router.push('/boleto');
    else router.navigate(ruta);
  };

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        {
          paddingBottom: insets.bottom + 14,
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [ALTO_NAV + 40, 0] }) }],
        },
      ]}
    >
      <View style={styles.dock}>
        {ITEMS.map((it) => (
          <Item
            key={it.ruta}
            item={it}
            activo={pathname === it.ruta}
            badge={it.boleto ? count : 0}
            onPress={() => ir(it.ruta)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function Item({ item, activo, badge, onPress }) {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  // Ancho: no se anima en el hilo nativo. Opacidad y escala del texto, sí.
  const on = useRef(new Animated.Value(activo ? 1 : 0)).current;

  useEffect(() => {
    if (movimientoReducido()) on.setValue(activo ? 1 : 0);
    else Animated.spring(on, { toValue: activo ? 1 : 0, ...RESORTES.deslizar, useNativeDriver: false }).start();
  }, [activo, on]);

  const inactivo = scheme === 'light' ? '#8a929e' : '#5b6371';
  const fondoActivo = scheme === 'light' ? '#ffffff' : '#0b0f15';
  const dorado = scheme === 'light' ? colors.accent : DORADO.fondo;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={badge ? `${item.label}, ${badge} selecciones` : item.label}
    >
      <Animated.View
        style={[
          styles.item,
          {
            width: on.interpolate({ inputRange: [0, 1], outputRange: [BOTON, ACTIVO] }),
            backgroundColor: on.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', fondoActivo] }),
          },
        ]}
      >
        <Ionicons name={activo ? item.icon : `${item.icon}-outline`} size={21} color={activo ? dorado : inactivo} />
        {activo && (
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.label,
              {
                color: dorado,
                opacity: on,
                transform: [{ translateX: on.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
              },
            ]}
          >
            {item.label}
          </Animated.Text>
        )}
        {badge > 0 && (
          <Pop trigger={badge} scale={1.4} style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </Pop>
        )}
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: ALTO_NAV,
    paddingHorizontal: 8,
    borderRadius: ALTO_NAV / 2,
    // Blanco sobre la app oscura y casi negro sobre la clara: siempre contrasta.
    backgroundColor: colors.contrast,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  item: {
    height: BOTON,
    borderRadius: BOTON / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'visible',
  },
  label: { fontSize: 13, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  badgeText: { color: DORADO.texto, fontSize: 10, fontWeight: '800' },
}));
