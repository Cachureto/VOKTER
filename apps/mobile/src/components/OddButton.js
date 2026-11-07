import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBetSlip } from '../lib/betslip-context';
import { formatOdds } from '../lib/format';
import { MERCADOS, rotulo } from '../lib/markets';
import { makeStyles, useTheme } from '../theme';

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
 * y la cuota grande en dorado. Tocado, se rellena de dorado y entra al boleto.
 */
function OddButton({ match, market, selection, style, showLabel = false }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const slip = useBetSlip();
  const abierto = market.status === 'open' && match.status === 'scheduled';
  const elegido = slip.has(selection.id);
  const resultado = selection.result;

  return (
    <Pressable
      onPress={() => slip.toggle(aSeleccion(match, market, selection))}
      disabled={!abierto}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido, disabled: !abierto }}
      accessibilityLabel={`${selection.label}, cuota ${formatOdds(selection.odds)}`}
      style={({ pressed }) => [
        styles.btn,
        elegido && styles.btnOn,
        resultado === 'won' && styles.btnWon,
        pressed && abierto && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, elegido && styles.onText]} numberOfLines={1}>
        {showLabel ? selection.label : rotulo(market.type, selection.code)}
      </Text>
      {abierto || resultado ? (
        <Text style={[styles.odds, elegido && styles.onText, !abierto && styles.oddsOff]}>
          {formatOdds(selection.odds)}
        </Text>
      ) : (
        <View style={styles.lock}>
          <Ionicons name="lock-closed" size={13} color={colors.subtle} />
        </View>
      )}
    </Pressable>
  );
}

export default memo(OddButton);

const useStyles = makeStyles((colors) => ({
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnWon: { borderColor: colors.live },
  pressed: { transform: [{ scale: 0.96 }] },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  odds: { color: colors.accent, fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  oddsOff: { color: colors.subtle },
  onText: { color: colors.accentForeground },
  lock: { height: 23, justifyContent: 'center' },
}));
