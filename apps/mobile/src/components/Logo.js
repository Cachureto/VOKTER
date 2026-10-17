import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const MARK = require('../../assets/vokter-mark.png');
// El emblema mide 640×346: se fija el alto y el ancho sale de la proporción.
const RATIO = 640 / 346;

/**
 * Marca Vokter: la V alada + el nombre, igual que en la barra de la web.
 *
 * El PNG se compuso sobre negro (el resplandor azul lo necesita), así que en
 * modo claro no se retoca: se le pone detrás una placa oscura, como hace la
 * clase `.mark-plate` de la web. Conserva la marca intacta y lee como sello.
 */
export function VokterMark({ height = 22 }) {
  const { isLight } = useTheme();
  return (
    <View style={[styles.plate, isLight && styles.plateDark]}>
      <Image
        source={MARK}
        style={{ height, width: height * RATIO }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export default function Logo({ height = 22 }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Vokter">
      <VokterMark height={height} />
      <Text style={[styles.word, { color: colors.foreground, fontSize: Math.round(height * 0.9) }]}>
        Vokter
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plate: { paddingVertical: 3, paddingHorizontal: 5, borderRadius: 10 },
  plateDark: {
    backgroundColor: '#0d0d10',
    shadowColor: '#0a0a0e',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  word: { fontWeight: '800', letterSpacing: -0.8 },
});
