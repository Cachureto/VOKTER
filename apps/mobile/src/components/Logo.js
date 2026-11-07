import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../theme';

/**
 * Marca Fanáticos 360, como en la plantilla: balón dorado, "FANATICOS" en
 * mayúsculas espaciadas y "360" grande en dorado-naranja debajo.
 *
 * `size="hero"` es la del inicio; `compact` va en una línea (menú, barras).
 */
export default function Logo({ size = 'hero' }) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (size === 'compact') {
    return (
      <View style={styles.row} accessibilityRole="header" accessibilityLabel="Fanáticos 360">
        <Ionicons name="football-outline" size={20} color={colors.accent} />
        <Text style={styles.compactWord}>FANATICOS</Text>
        <Text style={styles.compact360}>360</Text>
      </View>
    );
  }

  return (
    <View accessibilityRole="header" accessibilityLabel="Fanáticos 360">
      <View style={styles.row}>
        <Ionicons name="football-outline" size={30} color={colors.accent} />
        <Text style={styles.word}>FANATICOS</Text>
      </View>
      <Text style={styles.big360}>360</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { color: colors.foreground, fontSize: 30, fontWeight: '900', letterSpacing: 3 },
  big360: {
    color: colors.orange,
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '900',
    letterSpacing: -1,
    marginLeft: 40,
    marginTop: -4,
    textShadowColor: 'rgba(245,162,15,0.35)',
    textShadowRadius: 14,
  },
  compactWord: { color: colors.foreground, fontSize: 17, fontWeight: '900', letterSpacing: 2, marginLeft: -2 },
  compact360: { color: colors.orange, fontSize: 19, fontWeight: '900', marginLeft: -4 },
}));
