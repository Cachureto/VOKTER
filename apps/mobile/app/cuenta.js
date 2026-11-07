import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginRequired, OutlineButton, Pill } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';
<<<<<<< Updated upstream
import { colors } from '../src/theme/colors';
=======
import { formatCOP, formatDate } from '../src/lib/format';
import { makeStyles, useTheme } from '../src/theme';
>>>>>>> Stashed changes

/** Mi cuenta: datos del titular y accesos a billetera, apuestas y juego responsable. */
export default function Cuenta() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, ready, wallet, selfExcluded, logout } = useAuth();

  if (ready && !user) {
    return (
      <View style={[styles.screen, styles.pad]}>
        <LoginRequired next="/cuenta" text="Tu cuenta guarda tus apuestas, tu saldo y tus límites de juego." />
      </View>
    );
  }
  if (!user) return <View style={styles.screen} />;

  const iniciales = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
          <View style={styles.pills}>
            {user.kycStatus === 'verified' ? (
              <Pill label="Identidad verificada" tone="live" icon="shield-checkmark-outline" />
            ) : (
              <Pill label="Identidad sin verificar" tone="warning" icon="alert-circle-outline" />
            )}
            {selfExcluded && <Pill label="En pausa" tone="danger" icon="pause-outline" />}
          </View>
        </View>
      </View>

      <View style={styles.card}>
<<<<<<< Updated upstream
        <Pressable
          onPress={() => router.push('/escaner')}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="qr-code-outline" size={18} color={colors.accent} />
          <Text style={styles.rowText}>Verificar autenticidad</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/pedidos')}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="cube-outline" size={18} color={colors.accent} />
          <Text style={styles.rowText}>Mis pedidos</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </Pressable>

        <View style={styles.row}>
          <Ionicons name="star-outline" size={18} color={colors.subtle} />
          <Text style={styles.rowText}>Mis reseñas</Text>
          <Text style={styles.soon}>Pronto</Text>
        </View>

        <Pressable
          onPress={() => router.push('/ajustes')}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="settings-outline" size={18} color={colors.subtle} />
          <Text style={styles.rowText}>Conexión con el servidor</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </Pressable>
=======
        <Dato k="Documento" v={`${user.documentType} ${user.documentMasked}`} />
        <Dato k="Fecha de nacimiento" v={user.birthDate ? formatDate(`${user.birthDate}T12:00:00`) : '—'} />
        <Dato k="Celular" v={user.phone || '—'} />
        <Dato k="Miembro desde" v={formatDate(user.createdAt)} />
        {selfExcluded && <Dato k="Autoexclusión hasta" v={formatDate(user.selfExcludedUntil)} />}
>>>>>>> Stashed changes
      </View>

      <View style={styles.card}>
        <Fila icon="wallet-outline" label="Billetera" meta={formatCOP(wallet?.balanceCop ?? 0)} onPress={() => router.push('/billetera')} />
        <Fila icon="receipt-outline" label="Mis apuestas" meta={wallet?.openBets ? `${wallet.openBets} abiertas` : undefined} onPress={() => router.push('/apuestas')} />
        <Fila icon="shield-checkmark-outline" label="Juego responsable" onPress={() => router.push('/juego-responsable')} />
        <Fila icon="document-text-outline" label="Términos y condiciones" onPress={() => router.push('/terminos')} />
        <Fila icon="settings-outline" label="Ajustes de la app" onPress={() => router.push('/ajustes')} last />
      </View>

      <OutlineButton
        label="Cerrar sesión"
        tone="danger"
        icon="log-out-outline"
        onPress={async () => {
          await logout();
          router.replace('/');
        }}
      />
      <Text style={styles.fine}>
        Para cambiar tu nombre, documento o fecha de nacimiento escribe a soporte: son datos verificados y no se editan desde la app.
      </Text>
    </ScrollView>
  );

  function Dato({ k, v }) {
    return (
      <View style={styles.dato}>
        <Text style={styles.datoK}>{k}</Text>
        <Text style={styles.datoV}>{v}</Text>
      </View>
    );
  }

  function Fila({ icon, label, meta, onPress, last }) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && { opacity: 0.7 }]}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={styles.rowLabel}>{label}</Text>
        {!!meta && <Text style={styles.rowMeta}>{meta}</Text>}
        <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
<<<<<<< Updated upstream
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFilled: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.accentForeground, fontSize: 22, fontWeight: '800' },
  title: { color: colors.foreground, fontSize: 24, fontWeight: '800', marginTop: 18 },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  name: { color: colors.foreground, fontSize: 22, fontWeight: '800', marginTop: 16 },
  email: { color: colors.muted, fontSize: 14, marginTop: 4 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,174,239,0.3)',
    backgroundColor: 'rgba(0,174,239,0.1)',
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  adminText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  card: {
    width: '100%',
    marginTop: 32,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    color: colors.subtle,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowText: { flex: 1, color: colors.foreground, fontSize: 14.5 },
  soon: { color: colors.subtle, fontSize: 12 },
  button: {
    width: '100%',
    marginTop: 28,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.accentForeground, fontSize: 15, fontWeight: '700' },
  buttonGhost: {
    width: '100%',
    marginTop: 12,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhostText: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    height: 50,
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
=======
  pad: { padding: 20 },
  content: { padding: 20, paddingTop: 4, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  avatarText: { color: colors.accentForeground, fontSize: 24, fontWeight: '900' },
  name: { color: colors.foreground, fontSize: 21, fontWeight: '900' },
  email: { color: colors.muted, fontSize: 14, marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  card: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dato: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11 },
  datoK: { color: colors.muted, fontSize: 14 },
  datoV: { color: colors.foreground, fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '700' },
  rowMeta: { color: colors.muted, fontSize: 13.5, fontWeight: '600' },
  fine: { color: colors.subtle, fontSize: 12, lineHeight: 17, textAlign: 'center' },
}));
>>>>>>> Stashed changes
