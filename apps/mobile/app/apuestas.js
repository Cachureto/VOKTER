import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_BARRA } from '../src/components/BetSlipBar';
import { EmptyState, ErrorNotice, GoldButton, LoginRequired, Pill, Segmented } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';
import { codigoBoleto, formatCOP, formatDateTime, formatOdds } from '../src/lib/format';
import { MERCADOS } from '../src/lib/markets';
import { useFetch } from '../src/lib/use-fetch';
import { makeStyles, useTheme } from '../src/theme';

const PESTANAS = [
  { value: 'open', label: 'Abiertas' },
  { value: 'settled', label: 'Historial' },
  { value: 'all', label: 'Todas' },
];

const ESTADO = {
  open: { label: 'En juego', tone: 'accent', icon: 'time-outline' },
  won: { label: 'Ganada', tone: 'live', icon: 'trophy-outline' },
  lost: { label: 'Perdida', tone: 'danger', icon: 'close-circle-outline' },
  void: { label: 'Anulada · reembolsada', tone: 'muted', icon: 'refresh-outline' },
};

const ICONO_PATA = {
  won: ['checkmark-circle', 'live'],
  lost: ['close-circle', 'danger'],
  void: ['remove-circle', 'subtle'],
};

/** Mis apuestas: boletos abiertos y liquidados, con el detalle de cada selección. */
export default function Apuestas() {
  const { user, ready, refreshWallet } = useAuth();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [tab, setTab] = useState(PESTANAS.some((p) => p.value === params.status) ? params.status : 'open');
  const { data, error, loading, refreshing, reload } = useFetch(user ? `/bets?status=${tab}&limit=50` : null, {
    auth: true,
    every: tab === 'open' ? 30000 : 0,
  });

  if (ready && !user) {
    return (
      <View style={[styles.screen, styles.pad]}>
        <LoginRequired next="/apuestas" text="Entra a tu cuenta para ver tus apuestas abiertas y tu historial." />
      </View>
    );
  }

  const items = data?.items ?? [];

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: ALTO_BARRA + insets.bottom + 24 }]}
      data={items}
      keyExtractor={(b) => String(b.id)}
      ListHeaderComponent={<Segmented options={PESTANAS} value={tab} onChange={setTab} style={{ marginBottom: 14 }} />}
      renderItem={({ item }) => <Boleto bet={item} onMatch={(id) => router.push(`/partido/${id}`)} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={
        error ? (
          <ErrorNotice message={error.message} onRetry={reload} />
        ) : loading ? (
          <View style={styles.skeleton} />
        ) : (
          <EmptyState
            icon="receipt-outline"
            title={tab === 'open' ? 'No tienes apuestas abiertas' : 'Todavía no hay historial'}
            text="Elige un partido, toca una cuota y confirma tu boleto."
            action={<GoldButton label="Ver partidos" onPress={() => router.push('/partidos')} style={{ marginTop: 8 }} />}
          />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            reload();
            refreshWallet();
          }}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    />
  );
}

function Boleto({ bet, onMatch }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const e = ESTADO[bet.status] ?? ESTADO.open;
  const ganada = bet.status === 'won';

  return (
    <View style={[styles.card, ganada && { borderColor: colors.liveLine }]}>
      <View style={styles.cardHead}>
        <Pill label={e.label} tone={e.tone} icon={e.icon} />
        <Text style={styles.meta}>
          {codigoBoleto(bet.id)} · {formatDateTime(bet.placedAt)}
        </Text>
      </View>
      <Text style={styles.type}>{bet.type === 'combo' ? `Combinada de ${bet.legs.length}` : 'Apuesta simple'}</Text>

      <View style={styles.legs}>
        {bet.legs.map((l) => {
          const [icono, tono] = ICONO_PATA[l.result] ?? ['ellipse-outline', 'subtle'];
          return (
            <Pressable key={`${l.matchId}`} onPress={() => onMatch(l.matchId)} style={styles.leg}>
              <Ionicons name={icono} size={18} color={colors[tono]} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.legLabel} numberOfLines={1}>
                  {l.label}
                  <Text style={styles.legMarket}>
                    {'  '}
                    {MERCADOS[l.market]?.name ?? l.market}
                  </Text>
                </Text>
                <Text style={styles.legMatch} numberOfLines={1}>
                  {l.match}
                  {l.score ? `  ·  ${l.score.home}-${l.score.away}` : ''}
                  {l.matchStatus === 'live' ? '  · EN VIVO' : ''}
                </Text>
              </View>
              <Text style={styles.legOdds}>{formatOdds(l.odds)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.foot}>
        <Dato k="Apostado" v={formatCOP(bet.stakeCop)} />
        <Dato k="Cuota" v={formatOdds(bet.totalOdds)} />
        <Dato
          k={bet.status === 'open' ? 'Ganancia posible' : bet.status === 'void' ? 'Reembolso' : 'Pagado'}
          v={formatCOP(bet.status === 'open' ? bet.potentialPayoutCop : (bet.payoutCop ?? 0))}
          color={ganada ? colors.live : bet.status === 'open' ? colors.accent : undefined}
        />
      </View>
    </View>
  );
}

function Dato({ k, v, color }) {
  const styles = useStyles();
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.datoK}>{k}</Text>
      <Text style={[styles.datoV, color && { color }]}>{v}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 20 },
  content: { paddingHorizontal: 20, paddingTop: 4, width: '100%', maxWidth: 640, alignSelf: 'center' },
  skeleton: { height: 200, borderRadius: 22, backgroundColor: colors.surface, opacity: 0.6 },
  card: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { color: colors.subtle, fontSize: 12, fontVariant: ['tabular-nums'] },
  type: { color: colors.foreground, fontSize: 16, fontWeight: '900', marginTop: 10 },
  legs: { marginTop: 8 },
  leg: { flexDirection: 'row', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  legLabel: { color: colors.foreground, fontSize: 14.5, fontWeight: '800' },
  legMarket: { color: colors.subtle, fontSize: 12, fontWeight: '600' },
  legMatch: { color: colors.muted, fontSize: 13, marginTop: 2 },
  legOdds: { color: colors.accent, fontSize: 15, fontWeight: '900', marginTop: 1 },
  foot: { flexDirection: 'row', gap: 10, marginTop: 12 },
  datoK: { color: colors.subtle, fontSize: 11.5, fontWeight: '600' },
  datoV: { color: colors.foreground, fontSize: 15, fontWeight: '900', marginTop: 2, fontVariant: ['tabular-nums'] },
}));
