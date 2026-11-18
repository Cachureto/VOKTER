import { useWindowDimensions, View } from 'react-native';
import { DORADO } from '../theme/colors';

const NARANJA = '#f5a20f';

/**
 * Bloque diagonal dorado de la marca: cubre la parte de arriba y termina en
 * un corte inclinado que sube de izquierda a derecha. Cerca del corte el
 * dorado se vuelve naranja con franjas superpuestas (simula un degradado sin
 * librerías nativas).
 *
 * `height`: hasta dónde baja el corte por el lado izquierdo.
 * `angle`: inclinación del corte en grados.
 */
export default function Diagonal({ height = 330, angle = 16, style }) {
  const { width } = useWindowDimensions();
  const theta = (angle * Math.PI) / 180;
  const largo = width * 3;
  const alto = height * 3;
  const d = alto / 2;
  // El borde inferior del rectángulo girado debe pasar por (ancho/2, y) con
  // y = alto del bloque menos lo que sube el corte hasta la mitad.
  const yMedio = height - (width / 2) * Math.tan(theta);
  const cx = width / 2 - d * Math.sin(theta);
  const cy = yMedio - d * Math.cos(theta);

  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, overflow: 'hidden' }, style]}
    >
      <View
        style={{
          position: 'absolute',
          width: largo,
          height: alto,
          left: cx - largo / 2,
          top: cy - alto / 2,
          backgroundColor: DORADO.fondo,
          transform: [{ rotate: `${-angle}deg` }],
          overflow: 'hidden',
        }}
      >
        {[
          { h: 120, o: 0.22 },
          { h: 74, o: 0.38 },
          { h: 34, o: 0.6 },
        ].map((f) => (
          <View
            key={f.h}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: f.h,
              backgroundColor: NARANJA,
              opacity: f.o,
            }}
          />
        ))}
      </View>
    </View>
  );
}
