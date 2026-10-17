import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useCart } from '../lib/cart-context';
import { useMenu } from '../lib/menu-context';
import { makeStyles, useTheme } from '../theme';
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
    <Pressable
      onPress={open}
      hitSlop={6}
      style={({ pressed }) => [styles.button, bordered && styles.bordered, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
    >
      <Ionicons name="menu-outline" size={22} color={colors.foreground} />
    </Pressable>
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
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={22}
            color={colors.foreground}
          />
        </Pressable>
      )}
      <MenuButton />
    </View>
  );
}

/**
 * Lado derecho de la barra, igual en todas las pantallas: modo claro/oscuro
 * y carrito con su contador. `bordered` los pinta como botones redondos con
 * borde (inicio); sin él quedan planos, para no recargar la barra nativa.
 */
export default function HeaderActions({ bordered = false }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const boton = [styles.button, bordered && styles.bordered];

  return (
    <View style={styles.row}>
      <ThemeToggle style={boton} />
      <Pressable
        onPress={() => pathname !== '/carrito' && router.push('/carrito')}
        hitSlop={6}
        style={({ pressed }) => [boton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Carrito, ${count} productos`}
      >
        <Ionicons name="bag-outline" size={19} color={colors.foreground} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // La barra nativa ya deja margen a la izquierda; se compensa para que el
  // primer botón quede alineado con el contenido.
  leftRow: { marginLeft: Platform.OS === 'android' ? -8 : -4, marginRight: 4 },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pressed: { backgroundColor: colors.surfaceHover },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.contrast,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.contrastForeground, fontSize: 9.5, fontWeight: '800' },
}));
