import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

// Se consulta una sola vez: si el sistema pide reducir movimiento, todo
// aparece directo, sin desplazarse.
let reducir = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => {
    reducir = v;
  })
  .catch(() => {});

/**
 * Entrada suave (sube 14 px y aparece), el equivalente móvil del `Reveal`
 * de la web. `delay` permite escalonar una cuadrícula.
 */
export default function FadeIn({ delay = 0, distance = 14, style, children }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducir) {
      t.setValue(1);
      return undefined;
    }
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, t]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
