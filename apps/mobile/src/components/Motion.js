/**
 * Piezas de animación reutilizables: punto "en vivo" que late, esqueleto de
 * carga que respira, números que cuentan hasta su valor y un "pop" que se
 * dispara cuando cambia algo (un contador, una cuota).
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURVAS, movimientoReducido, RESORTES } from '../lib/motion';
import { makeStyles, useTheme } from '../theme';

/** Punto rojo de "en vivo" con un halo que se expande y se desvanece. */
export function LiveDot({ size = 8, color }) {
  const { colors } = useTheme();
  const c = color ?? colors.danger;
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (movimientoReducido()) return undefined;
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c }} />
    </View>
  );
}

/** Bloque gris de carga que respira (sube y baja la opacidad). */
export function Skeleton({ height = 20, width = '100%', radius = 12, style }) {
  const styles = useStyles();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (movimientoReducido()) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          width,
          borderRadius: radius,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }),
        },
        style,
      ]}
    />
  );
}

/** Esqueleto con la forma de una tarjeta de partido. */
export function MatchCardSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={110} height={26} radius={8} />
        <Skeleton width={70} height={18} radius={6} />
      </View>
      <View style={[styles.row, { marginTop: 22, paddingHorizontal: 18 }]}>
        <Skeleton width={58} height={58} radius={29} />
        <Skeleton width={56} height={40} radius={12} />
        <Skeleton width={58} height={58} radius={29} />
      </View>
      <View style={[styles.row, { marginTop: 22, gap: 10 }]}>
        <Skeleton height={64} radius={14} style={{ flex: 1 }} width={undefined} />
        <Skeleton height={64} radius={14} style={{ flex: 1 }} width={undefined} />
        <Skeleton height={64} radius={14} style={{ flex: 1 }} width={undefined} />
      </View>
    </View>
  );
}

/**
 * Número que cuenta desde el valor anterior hasta el nuevo. Para saldos y
 * ganancias: el cambio se ve, en vez de saltar.
 */
export function useCountUp(valor, { duracion = 650 } = {}) {
  const [mostrado, setMostrado] = useState(valor);
  const anterior = useRef(valor);

  useEffect(() => {
    const desde = anterior.current;
    anterior.current = valor;
    if (movimientoReducido() || desde === valor || !Number.isFinite(desde) || !Number.isFinite(valor)) {
      setMostrado(valor);
      return undefined;
    }
    const t = new Animated.Value(0);
    const id = t.addListener(({ value }) => setMostrado(desde + (valor - desde) * value));
    const anim = Animated.timing(t, { toValue: 1, duration: duracion, easing: CURVAS.entrar, useNativeDriver: false });
    anim.start(() => setMostrado(valor));
    return () => {
      anim.stop();
      t.removeListener(id);
    };
  }, [valor, duracion]);

  return mostrado;
}

/** Envuelve algo que da un pequeño salto cada vez que `trigger` cambia. */
export function Pop({ trigger, scale = 1.18, style, children }) {
  const t = useRef(new Animated.Value(1)).current;
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    if (movimientoReducido()) return;
    t.setValue(scale);
    Animated.spring(t, { toValue: 1, ...RESORTES.pop, useNativeDriver: true }).start();
  }, [trigger, scale, t]);

  return <Animated.View style={[style, { transform: [{ scale: t }] }]}>{children}</Animated.View>;
}

/**
 * Confirmación: el círculo dorado entra con un rebote, el visto se dibuja
 * (aparece girando) y dos anillos se expanden y desvanecen detrás.
 */
export function SuccessCheck({ size = 76, icon = 'checkmark' }) {
  const { colors } = useTheme();
  const t = useRef(new Animated.Value(movimientoReducido() ? 1 : 0)).current;
  const anillo = useRef(new Animated.Value(movimientoReducido() ? 1 : 0)).current;

  useEffect(() => {
    if (movimientoReducido()) return;
    Animated.parallel([
      Animated.spring(t, { toValue: 1, speed: 10, bounciness: 14, useNativeDriver: true }),
      Animated.timing(anillo, { toValue: 1, duration: 900, delay: 120, easing: CURVAS.entrar, useNativeDriver: true }),
    ]).start();
  }, [t, anillo]);

  const ring = (escala) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: colors.accent,
    opacity: anillo.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] }),
    transform: [{ scale: anillo.interpolate({ inputRange: [0, 1], outputRange: [1, escala] }) }],
  });

  return (
    <View style={{ width: size * 1.9, height: size * 1.9, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={ring(1.9)} />
      <Animated.View style={ring(1.45)} />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
          transform: [{ scale: t }],
        }}
      >
        <Animated.View
          style={{
            opacity: t,
            transform: [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['-60deg', '0deg'] }) }],
          }}
        >
          <Ionicons name={icon} size={size * 0.48} color={colors.accentForeground} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  skeleton: { backgroundColor: colors.surface2 },
  card: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
