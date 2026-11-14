import { ScrollView, Text, TextInput, View } from 'react-native';
import { formatCOP, formatNumber } from '../lib/format';
import { makeStyles, useTheme } from '../theme';
import Tap from './Tap';

/**
 * Campo de valor en pesos: muestra los miles con punto mientras se escribe y
 * ofrece montos rápidos debajo. `value` es un número entero (o 0).
 */
export default function AmountInput({ value, onChange, quick = [], error, label, style }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrap, error && { borderColor: colors.danger }]}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          value={value ? formatNumber(value) : ''}
          onChangeText={(t) => onChange(Number(t.replace(/\D/g, '').slice(0, 9)) || 0)}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.subtle}
          style={styles.input}
          accessibilityLabel={label ?? 'Valor en pesos'}
        />
        <Text style={styles.cop}>COP</Text>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {quick.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick}>
          {quick.map((q) => (
            <Tap key={q} scaleTo={0.9} onPress={() => onChange(q)} style={[styles.chip, value === q && styles.chipOn]}>
              <Text style={[styles.chipText, value === q && styles.chipTextOn]}>{formatCOP(q)}</Text>
            </Tap>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  label: { color: colors.muted, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 60,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accentLine,
    backgroundColor: colors.background,
  },
  currency: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
  },
  cop: { color: colors.subtle, fontSize: 13, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 12.5, marginTop: 6 },
  quick: { gap: 8, marginTop: 12 },
  chip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  chipOn: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  chipTextOn: { color: colors.accent },
}));
