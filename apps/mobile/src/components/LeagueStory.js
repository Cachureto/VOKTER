import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURVAS, movimientoReducido, RESORTES } from '../lib/motion';
import { DORADO } from '../theme/colors';
import { makeStyles, useTheme } from '../theme';
import Tap from './Tap';

const TAM = 64;

/** Siglas grandes para el centro del anillo. */
export function siglasLiga(nombre = '') {
  if (/libertadores/i.test(nombre)) return 'LIB';
  if (/sudamericana/i.test(nombre)) return 'SUD';
  if (/mundial|world cup/i.test(nombre)) return 'MUN';
  if (/champions/i.test(nombre)) return 'UCL';
  if (/premier/i.test(nombre)) return 'EPL';
  if (/copa/i.test(nombre)) return 'COPA';
  if (/betplay/i.test(nombre)) return 'BET';
  const palabras = nombre.split(/\s+/).filter((p) => !/^(liga|de|la|el|del)$/i.test(p));
  return (palabras[0] ?? nombre).slice(0, 4).toUpperCase();
}

function nombreCortoLiga(nombre = '') {
  if (/betplay/i.test(nombre) && /liga/i.test(nombre)) return 'BetPlay';
  if (/copa betplay/i.test(nombre)) return 'Copa';
  return nombre.replace(/^(Liga|Copa)\s+/i, '').split(/\s+/)[0];
}

/**
 * Liga como "historia": un anillo de color con las siglas dentro y el nombre
 * debajo. El anillo se enciende en dorado, naranja y turquesa si la liga está
 * elegida (y gira despacio) o en rojo si tiene partidos en vivo.
 *
 * `league = null` es el filtro "Todas"; `live` es el acceso a "En vivo".
 */
export default function LeagueStory({ league, active, live = false, label, onPress }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const giro = useRef(new Animated.Value(0)).current;
  const salto = useRef(new Animated.Value(1)).current;
  const encendido = active || live;

  useEffect(() => {
    if (!active || movimientoReducido()) {
      giro.stopAnimation();
      return undefined;
    }
    salto.setValue(0.86);
    Animated.spring(salto, { toValue: 1, ...RESORTES.pop, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
    );
    giro.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [active, giro, salto]);

  const texto = live ? 'LIVE' : league ? siglasLiga(league.name) : 'TODO';
  const colorTexto = live ? colors.danger : !league ? colors.foreground : league.kind === 'cup' ? colors.orange : colors.teal;
  const anillo = live
    ? { borderColor: colors.danger }
    : active
      ? {
          borderTopColor: DORADO.fondo,
          borderRightColor: colors.orange,
          borderBottomColor: colors.teal,
          borderLeftColor: DORADO.brillo,
        }
      : { borderColor: colors.borderStrong };

  return (
    <Tap
      onPress={onPress}
      scaleTo={0.9}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label ?? league?.name ?? 'Todas las ligas'}
    >
      <Animated.View style={[styles.ringBox, { transform: [{ scale: salto }] }]}>
        <Animated.View
          style={[
            styles.ring,
            anillo,
            encendido && styles.ringOn,
            {
              transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
            },
          ]}
        />
        <View style={styles.inner}>
          {league === null && !live ? (
            <Ionicons name="grid" size={20} color={active ? DORADO.fondo : colors.muted} />
          ) : (
            <Text style={[styles.code, { color: colorTexto }, texto.length > 3 && styles.codeLong]}>{texto}</Text>
          )}
        </View>
        {league?.live > 0 && !live && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{league.live}</Text>
          </View>
        )}
      </Animated.View>
      <Text style={[styles.name, active && styles.nameOn]} numberOfLines={1}>
        {label ?? (league ? nombreCortoLiga(league.name) : 'Todas')}
      </Text>
    </Tap>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { width: TAM + 4, alignItems: 'center' },
  ringBox: { width: TAM, height: TAM, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  ring: { position: 'absolute', width: TAM, height: TAM, borderRadius: TAM / 2, borderWidth: 2 },
  ringOn: { borderWidth: 3 },
  inner: {
    width: TAM - 12,
    height: TAM - 12,
    borderRadius: (TAM - 12) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  code: { fontSize: 14, fontWeight: '900', letterSpacing: 0.2 },
  codeLong: { fontSize: 12.5 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  name: { color: colors.muted, fontSize: 11.5, fontWeight: '600' },
  nameOn: { color: colors.foreground, fontWeight: '700' },
}));
