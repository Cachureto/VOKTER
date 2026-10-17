import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../theme';

export function Field({ label, error, style, ...props }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.subtle}
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function PasswordField({ label, error, style, ...props }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError]}>
        <TextInput
          placeholderTextColor={colors.subtle}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.inputFlex}
          {...props}
        />
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.muted} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => {
  const base = {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    color: colors.foreground,
    fontSize: 15,
  };

  return {
    label: { color: colors.muted, fontSize: 13, fontWeight: '500', marginBottom: 7 },
    input: base,
    inputWrap: { ...base, flexDirection: 'row', alignItems: 'center', gap: 10 },
    inputFlex: { flex: 1, color: colors.foreground, fontSize: 15, padding: 0 },
    inputError: { borderColor: colors.danger },
    error: { color: colors.danger, fontSize: 12.5, marginTop: 6 },
  };
});
