import { useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { movimientoReducido, RESORTES } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable que se hunde al tocarlo y vuelve con un rebote corto. Es la
 * respuesta táctil de toda la app: tarjetas, chips, cuotas y botones.
 *
 * `scaleTo` controla cuánto se hunde (0.97 tarjetas grandes, 0.92 chips).
 * `style` acepta lo mismo que en Pressable, incluida una función ({ pressed }).
 */
export default function Tap({ scaleTo = 0.96, style, onPressIn, onPressOut, disabled, children, ...props }) {
  const escala = useRef(new Animated.Value(1)).current;
  // El estilo se resuelve aquí (y no como función de Pressable) para que
  // Animated vea la escala y la mueva en el hilo nativo.
  const [pressed, setPressed] = useState(false);

  const ir = (valor, resorte) => {
    if (movimientoReducido()) return;
    Animated.spring(escala, { toValue: valor, ...resorte, useNativeDriver: true }).start();
  };

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        ir(scaleTo, RESORTES.presionar);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        ir(1, RESORTES.soltar);
        onPressOut?.(e);
      }}
      style={[typeof style === 'function' ? style({ pressed }) : style, { transform: [{ scale: escala }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
