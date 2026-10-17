import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { ORDER_STATUS } from '../src/lib/cart-context';
import { formatCOP } from '../src/lib/format';
import { makeStyles, useTheme } from '../src/theme';

const fecha = (iso) => {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bogota',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
};

export default function Pedidos() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await apiFetch('/api/orders?limit=20', { auth: true });
      setOrders(data.items ?? []);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  if (!ready || (status === 'loading' && user)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={30} color={colors.subtle} />
        <Text style={styles.emptyTitle}>Entra para ver tus pedidos</Text>
        <Pressable onPress={() => router.push('/login')} style={styles.button}>
          <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>
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
      {status === 'error' ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
          <Text style={styles.emptyTitle}>No se pudieron cargar</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable onPress={load} style={styles.button}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={30} color={colors.subtle} />
          <Text style={styles.emptyTitle}>Todavía no tienes pedidos</Text>
          <Pressable onPress={() => router.replace('/catalogo')} style={styles.button}>
            <Text style={styles.buttonText}>Ir al catálogo</Text>
          </Pressable>
        </View>
      ) : (
        orders.map((order) => {
          const info = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'muted' };
          const tone = colors[info.tone] ?? colors.muted;
          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.date}>{fecha(order.createdAt)}</Text>
                <View style={[styles.badge, { borderColor: `${tone}4d`, backgroundColor: `${tone}1a` }]}>
                  <Text style={[styles.badgeText, { color: tone }]}>{info.label}</Text>
                </View>
              </View>

              {order.items.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatCOP(item.unitPriceCents * item.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCOP(order.totalCents)}</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 14 },
  center: {
    flexGrow: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: { color: colors.foreground, fontSize: 18, fontWeight: '700', marginTop: 6 },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { color: colors.muted, fontSize: 13 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  itemQty: { color: colors.subtle, fontSize: 13, fontFamily: 'monospace' },
  itemName: { flex: 1, color: colors.foreground, fontSize: 14 },
  itemPrice: { color: colors.muted, fontSize: 13 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.subtle, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' },
  totalValue: { color: colors.foreground, fontSize: 17, fontWeight: '800' },
  button: {
    marginTop: 14,
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.accentForeground, fontSize: 14.5, fontWeight: '700' },
}));
