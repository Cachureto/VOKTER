import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { makeStyles, useTheme } from '../src/theme';

export default function Cuenta() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user, ready, isAdmin, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Sin sesión: invitación a entrar o registrarse.
  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={28} color={colors.accent} />
        </View>
        <Text style={styles.title}>Tu cuenta</Text>
        <Text style={styles.subtitle}>
          Entra para ver tus pedidos, dejar reseñas y guardar tus validaciones de autenticidad.
        </Text>

        <Pressable
          onPress={() => router.push('/login')}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/registro')}
          style={({ pressed }) => [styles.buttonGhost, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.buttonGhostText}>Crear cuenta</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const doLogout = async () => {
    setLeaving(true);
    await logout();
    setLeaving(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.avatarFilled}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      {isAdmin && (
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={13} color={colors.accent} />
          <Text style={styles.adminText}>Administrador</Text>
        </View>
      )}

      <View style={styles.card}>
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
          <Text style={styles.rowText}>Apariencia y conexión</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </Pressable>
      </View>

      <Pressable
        onPress={doLogout}
        disabled={leaving}
        style={({ pressed }) => [styles.logout, (pressed || leaving) && { opacity: 0.7 }]}
      >
        {leaving ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
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
    borderColor: colors.accentLine,
    backgroundColor: colors.accentSoft,
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
    borderColor: colors.dangerLine,
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
}));
