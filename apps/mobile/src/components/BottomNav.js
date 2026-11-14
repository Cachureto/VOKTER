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
import Tap from './Tap';

const ITEMS = [
  { ruta: '/', label: 'Inicio', icon: 'home' },
  { ruta: '/partidos', label: 'Partidos', icon: 'football' },
  { ruta: '/boleto', label: 'Boleto', icon: 'receipt', centro: true },
  { ruta: '/apuestas', label: 'Apuestas', icon: 'albums' },
  { ruta: '/cuenta', label: 'Cuenta', icon: 'person' },
];

/**
 * Barra de navegación inferior flotante, como en las apps actuales: las cinco
 * secciones a un toque. El boleto va al centro, en un botón dorado elevado con
 * el número de selecciones. Solo aparece en las pantallas principales; en el
 * detalle de un partido o en formularios se esconde deslizándose hacia abajo.
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
          paddingBottom: insets.bottom + 10,
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [ALTO_NAV + 40, 0] }) }],
        },
      ]}
    >
      <View style={styles.bar}>
        {ITEMS.map((it) =>
          it.centro ? (
            <Tap
              key={it.ruta}
              onPress={() => ir(it.ruta)}
              scaleTo={0.88}
              style={styles.centro}
              accessibilityRole="button"
              accessibilityLabel={`Boleto, ${count} selecciones`}
            >
              <Ionicons name="receipt" size={22} color={DORADO.texto} />
              {count > 0 && (
                <Pop trigger={count} scale={1.4} style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </Pop>
              )}
            </Tap>
          ) : (
            <Item key={it.ruta} item={it} activo={pathname === it.ruta} onPress={() => ir(it.ruta)} />
          ),
        )}
      </View>
    </Animated.View>
  );
}

function Item({ item, activo, onPress }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const on = useRef(new Animated.Value(activo ? 1 : 0)).current;

  useEffect(() => {
    if (movimientoReducido()) on.setValue(activo ? 1 : 0);
    else Animated.spring(on, { toValue: activo ? 1 : 0, ...RESORTES.deslizar, useNativeDriver: true }).start();
  }, [activo, on]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={item.label}
    >
      {/* Pastilla de fondo que crece detrás del ícono activo. */}
      <Animated.View
        style={[
          styles.indicator,
          { opacity: on, transform: [{ scaleX: on.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
        ]}
      />
      <Animated.View
        style={{ transform: [{ translateY: on.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) }] }}
      >
        <Ionicons
          name={activo ? item.icon : `${item.icon}-outline`}
          size={21}
          color={activo ? colors.accent : colors.muted}
        />
      </Animated.View>
      <Text style={[styles.label, activo && styles.labelOn]} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ALTO_NAV,
    paddingHorizontal: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  item: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 3 },
  indicator: {
    position: 'absolute',
    top: 9,
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accentSoft,
  },
  label: { color: colors.muted, fontSize: 10.5, fontWeight: '600' },
  labelOn: { color: colors.foreground, fontWeight: '700' },
  centro: {
    width: 54,
    height: 54,
    marginHorizontal: 4,
    marginTop: -26,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DORADO.fondo,
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: DORADO.fondo,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
}));
