import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { estiloLiga } from '../lib/markets';
import { makeStyles, useTheme } from '../theme';

/** Tarjeta de liga de "Ligas Destacadas": círculo con ícono y nombre debajo. */
export default function LeagueChip({ league, active, onPress }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const estilo = estiloLiga(league, colors);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipOn, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.circle, { backgroundColor: estilo.bg }]}>
        <Ionicons name={estilo.icon} size={24} color={estilo.fg} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {league ? league.name : 'Todas'}
      </Text>
      {league?.live > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{league.live} en vivo</Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  chip: {
    width: 118,
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.accent },
  circle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.foreground, fontSize: 14.5, fontWeight: '800', maxWidth: 100 },
  badge: { position: 'absolute', top: 8, right: 8, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, backgroundColor: colors.danger },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '900' },
}));
