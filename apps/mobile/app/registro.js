import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Field, PasswordField } from '../src/components/Field';
import { GoldButton } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';
import { salirDelAcceso } from '../src/lib/nav';
import { makeStyles, useTheme } from '../src/theme';

const DOCUMENTOS = [
  { value: 'CC', label: 'Cédula' },
  { value: 'CE', label: 'C. extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'PPT', label: 'PPT' },
];

// "19900131" → "1990-01-31" mientras se escribe.
function conGuiones(t) {
  const d = t.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

function edad(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e -= 1;
  return e;
}

export default function Registro() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    documentType: 'CC',
    documentNumber: '',
    birthDate: '',
    phone: '',
  });
  const [acepto, setAcepto] = useState(false);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Escribe tu nombre completo.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Correo inválido.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      e.password = 'Mínimo 8 caracteres, con letras y números.';
    if (!/^[A-Za-z0-9-]{4,20}$/.test(form.documentNumber.trim())) e.documentNumber = 'Número de documento inválido.';
    const años = /^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) ? edad(form.birthDate) : null;
    if (años == null) e.birthDate = 'Usa el formato AAAA-MM-DD.';
    else if (años < 18) e.birthDate = 'Debes ser mayor de 18 años para registrarte.';
    if (form.phone && !/^\+?[0-9 ]{7,15}$/.test(form.phone.trim())) e.phone = 'Celular inválido.';
    if (!acepto) e.terms = 'Debes aceptar los términos y confirmar que eres mayor de edad.';
    setErrores(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), acceptTerms: true });
      salirDelAcceso(router, next);
    } catch (err) {
      if (Array.isArray(err.details)) {
        setErrores(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setError(err.status === 400 ? 'Revisa los datos marcados.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Tus datos deben coincidir con tu documento: los usamos para verificar tu edad y para enviarte tus retiros.
        </Text>

        <Field label="Nombre completo" value={form.name} onChangeText={set('name')} placeholder="Como aparece en tu documento" autoComplete="name" error={errores.name} style={styles.gap} />
        <Field
          label="Correo"
          value={form.email}
          onChangeText={set('email')}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={errores.email}
          style={styles.gap}
        />
        <PasswordField
          label="Contraseña"
          value={form.password}
          onChangeText={set('password')}
          placeholder="Mínimo 8, con letras y números"
          autoComplete="new-password"
          error={errores.password}
          style={styles.gap}
        />

        <Text style={[styles.label, styles.gap]}>Tipo de documento</Text>
        <View style={styles.docs}>
          {DOCUMENTOS.map((d) => {
            const on = form.documentType === d.value;
            return (
              <Pressable key={d.value} onPress={() => set('documentType')(d.value)} style={[styles.doc, on && styles.docOn]} accessibilityState={{ selected: on }}>
                <Text style={[styles.docText, on && { color: colors.accent }]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Field
          label="Número de documento"
          value={form.documentNumber}
          onChangeText={(t) => set('documentNumber')(t.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())}
          placeholder="1020304050"
          keyboardType={form.documentType === 'CC' ? 'number-pad' : 'default'}
          autoCapitalize="characters"
          error={errores.documentNumber}
          style={styles.gap}
        />
        <Field
          label="Fecha de nacimiento"
          value={form.birthDate}
          onChangeText={(t) => set('birthDate')(conGuiones(t))}
          placeholder="AAAA-MM-DD"
          keyboardType="number-pad"
          maxLength={10}
          error={errores.birthDate}
          style={styles.gap}
        />
        <Field
          label="Celular (opcional)"
          value={form.phone}
          onChangeText={set('phone')}
          placeholder="300 123 4567"
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errores.phone}
          style={styles.gap}
        />

        <Pressable onPress={() => setAcepto((v) => !v)} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked: acepto }}>
          <View style={[styles.box, acepto && styles.boxOn]}>{acepto && <Ionicons name="checkmark" size={16} color={colors.accentForeground} />}</View>
          <Text style={styles.checkText}>
            Soy mayor de 18 años y acepto los{' '}
            <Text style={styles.link} onPress={() => router.push('/terminos')}>
              términos y condiciones
            </Text>{' '}
            y la política de juego responsable.
          </Text>
        </Pressable>
        {!!errores.terms && <Text style={styles.error}>{errores.terms}</Text>}
        {!!errores.acceptTerms && <Text style={styles.error}>{errores.acceptTerms}</Text>}

        {error ? (
          <View style={styles.alert}>
            <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <GoldButton label="Registrarme" onPress={submit} loading={loading} style={{ marginTop: 24 }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <Pressable onPress={() => router.replace({ pathname: '/login', params: next ? { next } : {} })} hitSlop={8}>
            <Text style={styles.link}>Ingresar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { color: colors.foreground, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 14.5, lineHeight: 21, marginTop: 6 },
  gap: { marginTop: 18 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  docs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doc: { height: 40, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  docOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  docText: { color: colors.muted, fontSize: 13.5, fontWeight: '800' },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 22 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkText: { flex: 1, color: colors.muted, fontSize: 14, lineHeight: 21 },
  error: { color: colors.danger, fontSize: 12.5, marginTop: 6 },
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
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  footerText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '800' },
}));
