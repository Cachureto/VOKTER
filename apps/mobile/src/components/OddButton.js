import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBetSlip } from '../lib/betslip-context';
import { formatOdds } from '../lib/format';
import { MERCADOS, rotulo } from '../lib/markets';
import { CURVAS, movimientoReducido, RESORTES } from '../lib/motion';
import { DORADO } from '../theme/colors';
import { makeStyles, useTheme } from '../theme';
import Tap from './Tap';

/** Lo que se guarda en el boleto al tocar una cuota. */
export function aSeleccion(match, market, sel) {
  return {
    selectionId: sel.id,
    odds: sel.odds,
    label: sel.label,
    code: sel.code,
    marketType: market.type,
    marketName: MERCADOS[market.type]?.name ?? market.name,
    line: market.line,
    matchId: match.id,
    matchLabel: `${match.home.name} vs ${match.away.name}`,
    kickoffAt: match.kickoffAt,
    league: match.league?.name,
  };
}

/**
 * Animaciones compartidas por la ficha y la barra de cuota: transición
 * normal→elegida, "pop" al elegirla y destello verde/rojo si la cuota cambia.
 */
function useCuota(match, market, selection) {
  const slip = useBetSlip();
  const abierto = market.status === 'open' && match.status === 'scheduled';
  const elegido = slip.has(selection.id);
  const sel = useRef(new Animated.Value(elegido ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const [subio, setSubio] = useState(null);
  const cuotaAnterior = useRef(selection.odds);

  useEffect(() => {
    if (movimientoReducido()) {
      sel.setValue(elegido ? 1 : 0);
      return;
    }
    Animated.timing(sel, {
      toValue: elegido ? 1 : 0,
      duration: 220,
      easing: CURVAS.estado,
      useNativeDriver: false,
    }).start();
    if (elegido) {
      pop.setValue(1.08);
      Animated.spring(pop, { toValue: 1, ...RESORTES.pop, useNativeDriver: true }).start();
    }
  }, [elegido, sel, pop]);

  useEffect(() => {
    const antes = cuotaAnterior.current;
    cuotaAnterior.current = selection.odds;
    if (antes === selection.odds || movimientoReducido()) return;
    setSubio(selection.odds > antes);
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 1600, easing: CURVAS.salir, useNativeDriver: false }).start(() =>
      setSubio(null),
    );
  }, [selection.odds, flash]);

  const tocar = () => slip.toggle(aSeleccion(match, market, selection));
  return { abierto, elegido, sel, pop, flash, subio, tocar };
}

function Flecha({ subio, colors }) {
  if (subio === null) return null;
  return <Ionicons name={subio ? 'caret-up' : 'caret-down'} size={11} color={subio ? colors.live : colors.danger} />;
}

/**
 * Ficha de cuota: rótulo pequeño arriba (1, X, 2, Más…) y la cuota grande
 * debajo. Elegida se rellena de dorado con un pequeño salto.
 */
function OddButton({ match, market, selection, style, showLabel = false }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { abierto, elegido, sel, pop, flash, subio, tocar } = useCuota(match, market, selection);
  const resultado = selection.result;

  const fondo = sel.interpolate({ inputRange: [0, 1], outputRange: [colors.surface2, DORADO.fondo] });
  const borde =
    subio === null
      ? resultado === 'won'
        ? colors.live
        : sel.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', DORADO.brillo] })
      : flash.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', subio ? colors.live : colors.danger] });

  return (
    <Tap
      onPress={tocar}
      disabled={!abierto}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido, disabled: !abierto }}
      accessibilityLabel={`${selection.label}, cuota ${formatOdds(selection.odds)}`}
      style={[styles.wrap, style]}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: pop }] }}>
        <Animated.View style={[styles.btn, { backgroundColor: fondo, borderColor: borde }]}>
          <Text style={[styles.label, elegido && styles.onTextSoft]} numberOfLines={1}>
            {showLabel ? selection.label : rotulo(market.type, selection.code)}
          </Text>
          {abierto || resultado ? (
            <View style={styles.oddsRow}>
              <Flecha subio={subio} colors={colors} />
              <Text style={[styles.odds, elegido && styles.onText, !abierto && styles.oddsOff]}>
                {formatOdds(selection.odds)}
              </Text>
            </View>
          ) : (
            <View style={styles.lock}>
              <Ionicons name="lock-closed" size={13} color={colors.subtle} />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Tap>
  );
}

export default memo(OddButton);

/**
 * Barra de probabilidad: una fila por resultado, con un relleno del ancho de
 * la probabilidad implícita de la cuota. Elegida, el borde y la cuota se
 * vuelven dorados.
 */
export const OddBar = memo(function OddBar({ match, market, selection, probabilidad = 0 }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { abierto, elegido, sel, pop, flash, subio, tocar } = useCuota(match, market, selection);
  const resultado = selection.result;
  // El relleno crece desde cero al montarse.
  const ancho = useRef(new Animated.Value(movimientoReducido() ? probabilidad : 0)).current;

  useEffect(() => {
    if (movimientoReducido()) {
      ancho.setValue(probabilidad);
      return;
    }
    Animated.timing(ancho, {
      toValue: probabilidad,
      duration: 700,
      easing: CURVAS.entrar,
      useNativeDriver: false,
    }).start();
  }, [probabilidad, ancho]);

  const borde =
    subio === null
      ? resultado === 'won'
        ? colors.live
        : sel.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accent] })
      : flash.interpolate({ inputRange: [0, 1], outputRange: [colors.border, subio ? colors.live : colors.danger] });
  const fondo = sel.interpolate({ inputRange: [0, 1], outputRange: [colors.surface, colors.accentSoft] });
  const relleno = elegido ? colors.accentLine : colors.accentSoft;

  return (
    <Tap
      onPress={tocar}
      disabled={!abierto}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido, disabled: !abierto }}
      accessibilityLabel={`${selection.label}, ${Math.round(probabilidad * 100)} por ciento, cuota ${formatOdds(selection.odds)}`}
    >
      <Animated.View style={[styles.bar, { borderColor: borde, backgroundColor: fondo, transform: [{ scale: pop }] }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: relleno,
              width: ancho.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
        <Text style={styles.barLabel} numberOfLines={1}>
          {selection.label}
        </Text>
        <Text style={styles.barPct}>{Math.round(probabilidad * 100)}%</Text>
        {abierto || resultado ? (
          <View style={[styles.oddsRow, styles.barOdds]}>
            <Flecha subio={subio} colors={colors} />
            <Text style={[styles.barOddsText, elegido && { color: colors.accent }, !abierto && styles.oddsOff]}>
              {formatOdds(selection.odds)}
            </Text>
          </View>
        ) : (
          <Ionicons name="lock-closed" size={14} color={colors.subtle} style={styles.barOdds} />
        )}
      </Animated.View>
    </Tap>
  );
});

const useStyles = makeStyles((colors) => ({
  wrap: { flex: 1 },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    minHeight: 54,
    paddingHorizontal: 6,
    borderRadius: 15,
    borderWidth: 1,
  },
  label: { color: colors.muted, fontSize: 11.5, fontWeight: '600' },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  odds: { color: colors.foreground, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  oddsOff: { color: colors.subtle },
  onText: { color: DORADO.texto },
  onTextSoft: { color: DORADO.texto, opacity: 0.7 },
  lock: { height: 22, justifyContent: 'center' },
  // ---- barra ----
  bar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  barLabel: { flex: 1, color: colors.foreground, fontSize: 14.5, fontWeight: '600' },
  barPct: { color: colors.muted, fontSize: 12.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
  barOdds: { minWidth: 48, justifyContent: 'flex-end' },
  barOddsText: {
    color: colors.foreground,
    fontSize: 17.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
}));
