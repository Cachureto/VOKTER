import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MERCADOS } from '../lib/markets';
import { makeStyles, useTheme } from '../theme';

/** Tarjeta de "Mercados Populares": ícono en cuadro dorado, nombre y pista. */
export default function MarketTile({ type, onPress, width }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const m = MERCADOS[type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width }, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={m.name}
    >
      <View style={styles.icon}>
        <Ionicons name={m.icon} size={24} color={colors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name}>{m.name}</Text>
        <Text style={styles.hint}>{m.hint}</Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 104,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  name: { color: colors.foreground, fontSize: 15.5, fontWeight: '800', lineHeight: 20 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
}));
