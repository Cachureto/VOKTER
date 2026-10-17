import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFetch, resolveImage } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { makeStyles, useTheme } from '../src/theme';

const DROP_STATUS = {
  scheduled: { label: 'Próximamente', tone: 'accent' },
  live: { label: 'En vivo', tone: 'live' },
  sold_out: { label: 'Agotado', tone: 'danger' },
  ended: { label: 'Finalizado', tone: 'muted' },
  cancelled: { label: 'Cancelado', tone: 'muted' },
};

function cuenta(launchAt) {
  const ms = new Date(launchAt) - Date.now();
  if (ms <= 0) return null;
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  if (dias > 0) return `en ${dias} día${dias === 1 ? '' : 's'}`;
  if (horas > 0) return `en ${horas} h ${min} min`;
  return `en ${min} min`;
}

export default function Drops() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user, pushState } = useAuth();
  const [drops, setDrops] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(null);
  const [joined, setJoined] = useState({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch('/api/drops');
      setDrops(Array.isArray(data) ? data : (data.items ?? []));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleWaitlist = async (drop) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setJoining(drop.id);
    try {
      if (joined[drop.id]) {
        await apiFetch(`/api/drops/${drop.slug}/waitlist`, { method: 'DELETE', auth: true });
        setJoined((j) => ({ ...j, [drop.id]: false }));
      } else {
        await apiFetch(`/api/drops/${drop.slug}/waitlist`, { method: 'POST', auth: true });
        setJoined((j) => ({ ...j, [drop.id]: true }));
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(null);
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      {/* Aviso honesto: en Expo Go el push remoto no funciona */}
      {user && (pushState?.reason === 'expo-go' || pushState?.reason === 'no-disponible') && (
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={17} color={colors.warning} />
          <Text style={styles.noticeText}>
            Las notificaciones push necesitan el APK de Vokter; en Expo Go no llegan. Tu lugar en la
            lista de espera sí queda guardado.
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.notice}>
          <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
          <Text style={[styles.noticeText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {drops.length === 0 && status === 'ready' ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={30} color={colors.subtle} />
          <Text style={styles.emptyTitle}>No hay drops programados</Text>
        </View>
      ) : (
        drops.map((drop) => {
          const info = DROP_STATUS[drop.status] ?? { label: drop.status, tone: 'muted' };
          const tone = colors[info.tone] ?? colors.muted;
          const falta = drop.status === 'scheduled' ? cuenta(drop.launchAt) : null;
          const cover = resolveImage(drop.coverUrl);
          const abierto = !['ended', 'cancelled'].includes(drop.status);

          return (
            <View key={drop.id} style={styles.card}>
              {cover && <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />}

              <View style={styles.cardBody}>
                <View style={styles.cardHead}>
                  <View style={[styles.badge, { borderColor: `${tone}4d`, backgroundColor: `${tone}1a` }]}>
                    <Text style={[styles.badgeText, { color: tone }]}>{info.label}</Text>
                  </View>
                  {falta && <Text style={styles.countdown}>{falta}</Text>}
                </View>

                <Text style={styles.name}>{drop.name}</Text>
                {!!drop.description && (
                  <Text style={styles.description} numberOfLines={3}>
                    {drop.description}
                  </Text>
                )}

                <Text style={styles.meta}>
                  {drop.waitlistCount} en lista de espera
                  {drop.products?.length ? ` · ${drop.products.length} productos` : ''}
                </Text>

                {abierto && (
                  <Pressable
                    onPress={() => toggleWaitlist(drop)}
                    disabled={joining === drop.id}
                    style={({ pressed }) => [
                      joined[drop.id] ? styles.buttonGhost : styles.button,
                      (pressed || joining === drop.id) && { opacity: 0.7 },
                    ]}
                  >
                    {joining === drop.id ? (
                      <ActivityIndicator color={joined[drop.id] ? colors.foreground : colors.accentForeground} />
                    ) : (
                      <>
                        <Ionicons
                          name={joined[drop.id] ? 'checkmark-circle' : 'notifications-outline'}
                          size={17}
                          color={joined[drop.id] ? colors.live : colors.accentForeground}
                        />
                        <Text style={joined[drop.id] ? styles.buttonGhostText : styles.buttonText}>
                          {joined[drop.id]
                            ? 'Te avisaremos'
                            : user
                              ? 'Avísame cuando salga'
                              : 'Entrar para anotarme'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 80,
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: '700' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 150, backgroundColor: colors.tile },
  cardBody: { padding: 18, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  countdown: { color: colors.muted, fontSize: 13, fontFamily: 'monospace' },
  name: { color: colors.foreground, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.subtle, fontSize: 12.5, marginTop: 2 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  buttonText: { color: colors.accentForeground, fontSize: 14.5, fontWeight: '700' },
  buttonGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonGhostText: { color: colors.foreground, fontSize: 14.5, fontWeight: '600' },
}));
