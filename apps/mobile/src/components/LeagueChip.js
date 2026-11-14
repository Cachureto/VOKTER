import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { estiloLiga } from '../lib/markets';
import { CURVAS, movimientoReducido, RESORTES } from '../lib/motion';
import { makeStyles, useTheme } from '../theme';
import Tap from './Tap';

/** Tarjeta de liga de "Ligas Destacadas": círculo con ícono y nombre debajo. */
export default function LeagueChip({ league, active, onPress }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const estilo = estiloLiga(league, colors);
  // Al activarse, el borde se enciende y el círculo da un pequeño salto.
  const on = useRef(new Animated.Value(active ? 1 : 0)).current;
  const salto = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (movimientoReducido()) {
      on.setValue(active ? 1 : 0);
      return;
    }
    Animated.timing(on, {
      toValue: active ? 1 : 0,
      duration: 240,
      easing: CURVAS.estado,
      useNativeDriver: false,
    }).start();
    if (active) {
      salto.setValue(0.82);
      Animated.spring(salto, { toValue: 1, ...RESORTES.pop, useNativeDriver: true }).start();
    }
  }, [active, on, salto]);

  return (
    <Tap onPress={onPress} scaleTo={0.93} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Animated.View
        style={[
          styles.chip,
          {
            borderColor: on.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accent] }),
            backgroundColor: on.interpolate({ inputRange: [0, 1], outputRange: [colors.surface, colors.accentSoft] }),
          },
        ]}
      >
        <Animated.View style={[styles.circle, { backgroundColor: estilo.bg, transform: [{ scale: salto }] }]}>
          <Ionicons name={estilo.icon} size={14} color={estilo.fg} />
        </Animated.View>
        <Text style={[styles.name, active && { color: colors.foreground }]} numberOfLines={1}>
          {league ? league.name : 'Todas'}
        </Text>
        {league?.live > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{league.live}</Text>
          </View>
        )}
      </Animated.View>
    </Tap>
  );
}

const useStyles = makeStyles((colors) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  circle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  badgeText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
}));
