import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Field, PasswordField } from '../src/components/Field';
import Logo from '../src/components/Logo';
import { GoldButton } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';
<<<<<<< Updated upstream
import { colors } from '../src/theme/colors';
=======
import { salirDelAcceso } from '../src/lib/nav';
import { makeStyles, useTheme } from '../src/theme';
>>>>>>> Stashed changes


export default function Login() {
  const router = useRouter();
  const { next } = useLocalSearchParams();
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
      salirDelAcceso(router, next);
    } catch (err) {
      setError(err.fieldMessage ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Logo />
        <Text style={styles.title}>Ingresar</Text>
        <Text style={styles.subtitle}>Entra para apostar, ver tu saldo y seguir tus boletos.</Text>

        <Field
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          style={{ marginTop: 26 }}
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

        <GoldButton label="Iniciar" onPress={submit} loading={loading} style={{ marginTop: 26 }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <Pressable onPress={() => router.replace({ pathname: '/registro', params: next ? { next } : {} })} hitSlop={8}>
            <Text style={styles.link}>Regístrate</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { color: colors.foreground, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 28 },
  subtitle: { color: colors.muted, fontSize: 14.5, lineHeight: 21, marginTop: 6 },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 20,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  alertText: { flex: 1, color: colors.danger, fontSize: 13.5, lineHeight: 19 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  footerText: { color: colors.muted, fontSize: 14 },
<<<<<<< Updated upstream
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
=======
  link: { color: colors.accent, fontSize: 14, fontWeight: '800' },
}));
>>>>>>> Stashed changes
