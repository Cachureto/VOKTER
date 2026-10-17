import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * Texto en marquesina, como la barra de anuncios de la web.
 *
 * Pinta el contenido dos veces seguidas y desplaza la fila exactamente el
 * ancho de una copia: al reiniciar, la segunda copia queda donde estaba la
 * primera y el corte no se nota. Corre en el hilo nativo (useNativeDriver),
 * así no compite con el scroll. Si el sistema pide reducir movimiento, se
 * queda quieto.
 */
export default function Marquee({ children, speed = 38, style }) {
  const [ancho, setAncho] = useState(0);
  const [quieto, setQuieto] = useState(false);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setQuieto).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setQuieto);
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (!ancho || quieto) {
      x.setValue(0);
      return undefined;
    }
    x.setValue(0);
    const anim = Animated.loop(
      Animated.timing(x, {
        toValue: -ancho,
        duration: (ancho / speed) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [ancho, quieto, speed, x]);

  return (
    <View style={[styles.clip, style]}>
      <Animated.View style={[styles.row, { transform: [{ translateX: x }] }]}>
        <View style={styles.row} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
          {children}
        </View>
        <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
});
