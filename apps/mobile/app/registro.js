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

// Mismas reglas que registerSchema en el backend, para avisar antes de enviar.
function validate({ name, email, password }) {
  if (name.trim().length < 2) return { name: 'Mínimo 2 caracteres' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return { email: 'Email inválido' };
  if (password.length < 8) return { password: 'Mínimo 8 caracteres' };
  if (!/[A-Za-z]/.test(password)) return { password: 'Debe tener al menos una letra' };
  if (!/\d/.test(password)) return { password: 'Debe tener al menos un número' };
  return null;
}

export default function Registro() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError(null);
    const invalid = validate(form);
    setFieldErrors(invalid ?? {});
    if (invalid) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
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
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Sirve igual en la app y en la web de Vokter.
        </Text>

        <Field
          label="Nombre"
          value={form.name}
          onChangeText={set('name')}
          placeholder="Tu nombre"
          autoCapitalize="words"
          autoComplete="name"
          error={fieldErrors.name}
          style={{ marginTop: 28 }}
        />

        <Field
          label="Correo"
          value={form.email}
          onChangeText={set('email')}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={fieldErrors.email}
          style={{ marginTop: 18 }}
        />

        <PasswordField
          label="Contraseña"
          value={form.password}
          onChangeText={set('password')}
          placeholder="Mínimo 8, con letra y número"
          autoComplete="new-password"
          onSubmitEditing={submit}
          returnKeyType="go"
          error={fieldErrors.password}
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
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <Text style={styles.link}>Entrar</Text>
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
