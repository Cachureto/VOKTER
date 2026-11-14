import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MERCADOS } from '../lib/markets';
import { makeStyles, useTheme } from '../theme';
import Tap from './Tap';

/** Tarjeta de "Mercados Populares": ícono en cuadro dorado, nombre y pista. */
export default function MarketTile({ type, onPress, width }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const m = MERCADOS[type];
  return (
    <Tap
      onPress={onPress}
      scaleTo={0.95}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.tilePressed]}
      accessibilityRole="button"
      accessibilityLabel={m.name}
    >
      <View style={styles.icon}>
        <Ionicons name={m.icon} size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={2}>
          {m.name}
        </Text>
        <Text style={styles.hint} numberOfLines={2}>
          {m.hint}
        </Text>
      </View>
    </Tap>
  );
}

const useStyles = makeStyles((colors) => ({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tilePressed: { borderColor: colors.accentLine, backgroundColor: colors.surface2 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  name: { color: colors.foreground, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 2 },
}));
