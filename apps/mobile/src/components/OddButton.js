import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBetSlip } from '../lib/betslip-context';
import { formatOdds } from '../lib/format';
import { MERCADOS, rotulo } from '../lib/markets';
import { CURVAS, movimientoReducido, RESORTES } from '../lib/motion';
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
 * Botón de cuota, como los de la plantilla: rótulo pequeño arriba (1, X, 2…)
 * y la cuota grande en dorado. Al tocarlo se hunde, se rellena de dorado con
 * un pequeño salto y entra al boleto. Si la cuota cambia mientras se ve (en
 * vivo, al refrescar), parpadea en verde si sube o en rojo si baja.
 */
function OddButton({ match, market, selection, style, showLabel = false, vertical = false }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const slip = useBetSlip();
  const abierto = market.status === 'open' && match.status === 'scheduled';
  const elegido = slip.has(selection.id);
  const resultado = selection.result;

  // 0 = normal, 1 = elegido. Colores: no se pueden animar en el hilo nativo.
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
      pop.setValue(1.1);
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

  const fondo = sel.interpolate({ inputRange: [0, 1], outputRange: [colors.surface2, colors.accent] });
  const borde =
    subio === null
      ? resultado === 'won'
        ? colors.live
        : sel.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', colors.accent] })
      : flash.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', subio ? colors.live : colors.danger] });

  return (
    <Tap
      onPress={() => slip.toggle(aSeleccion(match, market, selection))}
      disabled={!abierto}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido, disabled: !abierto }}
      accessibilityLabel={`${selection.label}, cuota ${formatOdds(selection.odds)}`}
      style={[styles.wrap, style]}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: pop }] }}>
        <Animated.View
          style={[styles.btn, vertical && styles.btnVertical, { backgroundColor: fondo, borderColor: borde }]}
        >
          <Text style={[styles.label, !vertical && styles.labelRow, elegido && styles.onTextSoft]} numberOfLines={1}>
            {showLabel ? selection.label : rotulo(market.type, selection.code)}
          </Text>
          {abierto || resultado ? (
            <View style={styles.oddsRow}>
              {subio !== null && (
                <Ionicons
                  name={subio ? 'caret-up' : 'caret-down'}
                  size={12}
                  color={subio ? colors.live : colors.danger}
                />
              )}
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

const useStyles = makeStyles((colors) => ({
  wrap: { flex: 1 },
  // Fila: rótulo a la izquierda y cuota a la derecha, como en las casas de
  // apuestas actuales. `vertical` apila los dos para cuadrículas estrechas.
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnVertical: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
    minHeight: 56,
    paddingHorizontal: 6,
  },
  label: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  labelRow: { flexShrink: 1 },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  odds: { color: colors.foreground, fontSize: 15.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  oddsOff: { color: colors.subtle },
  onText: { color: colors.accentForeground },
  onTextSoft: { color: colors.accentForeground, opacity: 0.75 },
  lock: { height: 20, justifyContent: 'center' },
}));
