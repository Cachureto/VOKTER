import { Text, View } from 'react-native';
import { makeStyles } from '../theme';

/**
 * Marca Fanáticos 360: "FANÁTICOS" en negra condensada y el "360" dentro de
 * una placa. `tone="onGold"` es para encima del bloque dorado (texto oscuro y
 * placa oscura); el normal va sobre fondo oscuro o claro.
 *
 * `size`: 'hero' (inicio) · 'compact' (menú, barras).
 */
export default function Logo({ size = 'compact', tone = 'default' }) {
  const styles = useStyles();
  const grande = size === 'hero';
  const sobreOro = tone === 'onGold';
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Fanáticos 360">
      <Text style={[styles.word, grande && styles.wordBig, sobreOro && styles.wordOnGold]}>FANÁTICOS</Text>
      <View style={[styles.plate, grande && styles.plateBig, sobreOro && styles.plateOnGold]}>
        <Text style={[styles.num, grande && styles.numBig, sobreOro && styles.numOnGold]}>360</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  word: { color: colors.foreground, fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  wordBig: { fontSize: 26 },
  wordOnGold: { color: '#1a1405' },
  plate: { backgroundColor: colors.accent, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 1 },
  plateBig: { borderRadius: 11, paddingHorizontal: 9 },
  plateOnGold: { backgroundColor: '#1a1405' },
  num: { color: colors.accentForeground, fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  numBig: { fontSize: 24 },
  numOnGold: { color: '#f0bf3a' },
}));
