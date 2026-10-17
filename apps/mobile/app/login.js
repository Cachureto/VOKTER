import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Field, PasswordField } from '../src/components/Field';
import { useAuth } from '../src/lib/auth-context';
import { makeStyles, useTheme } from '../src/theme';

export default function Login() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/cuenta');
    } catch (err) {
      setError(err.fieldMessage ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>
          Usa la misma cuenta de la web: pedidos, reseñas y validaciones quedan en un solo lugar.
        </Text>

        <Field
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          style={{ marginTop: 28 }}
        />

        <PasswordField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          onSubmitEditing={submit}
          returnKeyType="go"
          style={{ marginTop: 18 }}
        />

        {error ? (
          <View style={styles.alert}>
            <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={loading}
          style={({ pressed }) => [styles.button, (pressed || loading) && { opacity: 0.75 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentForeground} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <Pressable onPress={() => router.replace('/registro')} hitSlop={8}>
            <Text style={styles.link}>Crear una</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: { color: colors.foreground, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 20,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.dangerLine,
    backgroundColor: colors.dangerSoft,
  },
  alertText: { flex: 1, color: colors.danger, fontSize: 13.5, lineHeight: 19 },
  button: {
    marginTop: 26,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.accentForeground, fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  footerText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
}));
