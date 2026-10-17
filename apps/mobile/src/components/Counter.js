import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

const easeOutExpo = (x) => (x === 1 ? 1 : 1 - 2 ** (-10 * x));

/** Número que cuenta desde cero hasta `value` (como las cifras del hero web). */
export default function Counter({ value, suffix = '', duration = 1400, style }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const destino = Number(value) || 0;
    const inicio = Date.now();
    const paso = () => {
      const p = Math.min(1, (Date.now() - inicio) / duration);
      setN(Math.round(destino * easeOutExpo(p)));
      if (p < 1) raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return (
    <Text style={style}>
      {n}
      {suffix}
    </Text>
  );
}
