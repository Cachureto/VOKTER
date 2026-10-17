import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

/**
 * Interruptor claro / oscuro (el mismo de la web, junto al carrito).
 *
 * Los dos iconos están siempre montados y se cruzan girando: el sol se ve en
 * modo oscuro (lleva a claro) y la luna en modo claro (lleva a oscuro).
 */
export default function ThemeToggle({ style }) {
  const { isLight, toggle, colors } = useTheme();
  const t = useRef(new Animated.Value(isLight ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: isLight ? 1 : 0,
      duration: 320,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [isLight, t]);

  const sol = {
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
      { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] }) },
    ],
  };
  const luna = {
    opacity: t,
    transform: [
      { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] }) },
    ],
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      style={style}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, sol]}>
        <Ionicons name="sunny-outline" size={19} color={colors.foreground} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, luna]}>
        <Ionicons name="moon-outline" size={18} color={colors.foreground} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
