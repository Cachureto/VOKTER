import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useBetSlip } from '../lib/betslip-context';
import { useMenu } from '../lib/menu-context';
import { makeStyles, useTheme } from '../theme';
import { Pop } from './Motion';
import Tap from './Tap';
import ThemeToggle from './ThemeToggle';

/**
 * Botón ☰ del menú. Va a la izquierda, del mismo lado por el que entra el
 * panel: así el gesto y la animación cuentan la misma historia.
 */
export function MenuButton({ bordered = false }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { open } = useMenu();
  return (
    <Tap
      onPress={open}
      hitSlop={6}
      scaleTo={0.88}
      style={({ pressed }) => [styles.button, bordered && styles.bordered, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
    >
      <Ionicons name="menu" size={bordered ? 24 : 22} color={colors.foreground} />
    </Tap>
  );
}

/**
 * Lado izquierdo de la barra nativa: volver (si hay a dónde) + menú.
 * Al definir headerLeft la flecha nativa desaparece, por eso se dibuja aquí.
 */
export function HeaderLeft({ canGoBack }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const puedeVolver = canGoBack ?? router.canGoBack();

  return (
    <View style={[styles.row, styles.leftRow]}>
      {puedeVolver && (
        <Pressable
          onPress={() => router.back()}
          hitSlop={6}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={22} color={colors.foreground} />
        </Pressable>
      )}
      <MenuButton />
    </View>
  );
}

/** Ícono del boleto con el número de selecciones. */
export function SlipButton({ bordered = false }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useBetSlip();
  return (
    <Tap
      onPress={() => pathname !== '/boleto' && router.push('/boleto')}
      hitSlop={6}
      scaleTo={0.88}
      style={({ pressed }) => [styles.button, bordered && styles.bordered, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Boleto, ${count} selecciones`}
    >
      <Ionicons name="receipt-outline" size={19} color={colors.foreground} />
      {count > 0 && (
        <Pop trigger={count} scale={1.45} style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </Pop>
      )}
    </Tap>
  );
}

/** Lado derecho de la barra: modo claro/oscuro y boleto. */
export default function HeaderActions({ bordered = false }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <ThemeToggle style={[styles.button, bordered && styles.bordered]} />
      <SlipButton bordered={bordered} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // La barra nativa ya deja margen a la izquierda; se compensa para que el
  // primer botón quede alineado con el contenido.
  leftRow: { marginLeft: Platform.OS === 'android' ? -8 : -4, marginRight: 4 },
  button: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  bordered: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceHover },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.accentForeground, fontSize: 10, fontWeight: '900' },
}));
