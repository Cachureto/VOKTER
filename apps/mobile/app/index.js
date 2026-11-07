<<<<<<< Updated upstream
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductCard from '../src/components/ProductCard';
import { apiFetch } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { useCart } from '../src/lib/cart-context';
import { formatNumber } from '../src/lib/format';
import { colors } from '../src/theme/colors';

const PAGE_SIZE = 10;
const GAP = 12;
const PADDING = 16;

export default function Catalog() {
  const router = useRouter();
  const { user } = useAuth();
  const { count } = useCart();
  const { width } = useWindowDimensions();
  const cardWidth = (width - PADDING * 2 - GAP) / 2;

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Evita que una respuesta lenta de una búsqueda vieja pise a la actual.
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    apiFetch('/api/categories')
      .then((data) => setCategories(data?.items ?? []))
      .catch(() => setCategories([]));
  }, []);

  const buildQuery = useCallback(
    (targetPage) => {
      const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
      if (debounced) params.set('q', debounced);
      if (category) params.set('category', category);
      return `/api/products?${params.toString()}`;
    },
    [debounced, category],
  );

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    setError(null);
    try {
      const data = await apiFetch(buildQuery(1));
      if (id !== requestId.current) return;
      setItems(data.items);
      setTotal(data.total);
      setPage(1);
      setStatus('ready');
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message);
      setStatus('error');
    }
  }, [buildQuery]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || status !== 'ready' || items.length >= total) return;
    setLoadingMore(true);
    const id = requestId.current;
    try {
      const data = await apiFetch(buildQuery(page + 1));
      if (id !== requestId.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.items.filter((p) => !seen.has(p.id))];
      });
      setTotal(data.total);
      setPage((p) => p + 1);
    } catch {
      // Silencioso: la lista ya cargada sigue sirviendo.
    } finally {
      setLoadingMore(false);
    }
  }, [buildQuery, items.length, loadingMore, page, status, total]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const header = (
    <View>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Text style={styles.markText}>✦</Text>
          </View>
          <Text style={styles.logo}>VOKTER</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push('/drops')} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="flash-outline" size={19} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => router.push('/carrito')} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="bag-outline" size={19} color={colors.foreground} />
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/escaner')} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="qr-code-outline" size={19} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => router.push('/cuenta')} hitSlop={8} style={styles.iconButton}>
            {user ? (
              <Text style={styles.avatarInitial}>{user.name.trim()[0]?.toUpperCase()}</Text>
            ) : (
              <Ionicons name="person-outline" size={19} color={colors.foreground} />
            )}
          </Pressable>
        </View>
      </View>

      <Text style={styles.title}>{user ? `Hola, ${user.name.split(/\s+/)[0]}` : 'Catálogo'}</Text>
      <Text style={styles.subtitle}>
        {status === 'ready'
          ? `${formatNumber(total)} producto${total === 1 ? '' : 's'} verificados`
          : 'Tecnología urbana verificada'}
      </Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={17} color={colors.subtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar cargador, audífonos…"
          placeholderTextColor={colors.subtle}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={17} color={colors.subtle} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <Chip label="Todo" active={!category} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c.slug}
            label={c.name}
            active={category === c.slug}
            onPress={() => setCategory(category === c.slug ? null : c.slug)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        data={status === 'error' ? [] : items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          status === 'loading' ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
          ) : status === 'error' ? (
            <View style={styles.state}>
              <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
              <Text style={styles.stateTitle}>Sin conexión con el catálogo</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={loadFirstPage} style={styles.stateButton}>
                <Text style={styles.stateButtonText}>Reintentar</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/ajustes')} hitSlop={8}>
                <Text style={styles.link}>Revisar la URL de la API</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Ionicons name="search-outline" size={30} color={colors.subtle} />
              <Text style={styles.stateTitle}>Nada por aquí</Text>
              <Text style={styles.stateText}>
                No hay productos para esa búsqueda. Prueba con otra palabra o quita el filtro.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : items.length > 0 && items.length >= total ? (
            <Text style={styles.endText}>Fin del catálogo</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: PADDING, paddingBottom: 40, gap: GAP },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { color: colors.accentForeground, fontSize: 15, fontWeight: '900' },
  logo: { color: colors.foreground, fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.accentForeground, fontSize: 10, fontWeight: '800' },
  avatarInitial: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.foreground, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 24 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    marginTop: 18,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, color: colors.foreground, fontSize: 15, padding: 0 },
  chipsScroll: { marginTop: 14, marginHorizontal: -PADDING },
  chipsRow: { gap: 8, paddingHorizontal: PADDING, paddingBottom: 18 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipLabelActive: { color: colors.accentForeground },
  state: { alignItems: 'center', gap: 10, paddingTop: 56, paddingHorizontal: 20 },
  stateTitle: { color: colors.foreground, fontSize: 17, fontWeight: '700' },
  stateText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  stateButton: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateButtonText: { color: colors.accentForeground, fontSize: 14, fontWeight: '700' },
  link: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 6 },
  endText: {
    color: colors.subtle,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
=======
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_BARRA } from '../src/components/BetSlipBar';
import FadeIn from '../src/components/FadeIn';
import { MenuButton, SlipButton } from '../src/components/HeaderActions';
import LeagueChip from '../src/components/LeagueChip';
import Logo from '../src/components/Logo';
import MarketTile from '../src/components/MarketTile';
import MatchCard from '../src/components/MatchCard';
import SectionHeading from '../src/components/SectionHeading';
import ThemeToggle from '../src/components/ThemeToggle';
import { EmptyState, ErrorNotice, GoldButton, OutlineButton, Pill } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';
import { formatCOP } from '../src/lib/format';
import { ORDEN_TARJETAS } from '../src/lib/markets';
import { useFetch } from '../src/lib/use-fetch';
import { makeStyles, useTheme } from '../src/theme';

/**
 * Inicio, como la plantilla: marca, bienvenida (o saldo), ligas destacadas,
 * partidos populares y mercados populares.
 */
export default function Inicio() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, wallet, selfExcluded, refreshWallet } = useAuth();
  const [liga, setLiga] = useState(null);

  const estado = useFetch('/estado');
  const ligas = useFetch('/leagues', { every: 60000 });
  const vivo = useFetch('/matches?status=live&limit=5', { every: 20000 });
  const populares = useFetch(`/matches?status=upcoming&limit=6${liga ? `&league=${liga}` : ''}`, { every: 60000 });

  const listaLigas = ligas.data?.items ?? [];
  const enVivo = vivo.data?.items ?? [];
  const partidos = populares.data?.items ?? [];
  const anchoTarjeta = (Math.min(width, 640) - 20 * 2 - 12) / 2;

  const recargar = () => {
    ligas.reload();
    vivo.refetch();
    populares.refetch();
    estado.refetch();
    refreshWallet();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: ALTO_BARRA + insets.bottom + 24 }]}
      refreshControl={<RefreshControl refreshing={ligas.refreshing} onRefresh={recargar} tintColor={colors.accent} colors={[colors.accent]} />}
    >
      {/* ---------- Barra superior ---------- */}
      <View style={styles.topBar}>
        <MenuButton bordered />
        <View style={styles.topRight}>
          <ThemeToggle style={styles.iconBtn} />
          <SlipButton bordered />
          {user ? (
            <Pressable onPress={() => router.push('/billetera')} style={({ pressed }) => [styles.balanceChip, pressed && { opacity: 0.85 }]}>
              <Ionicons name="wallet-outline" size={16} color={colors.accent} />
              <Text style={styles.balanceChipText}>{formatCOP(wallet?.balanceCop ?? 0)}</Text>
            </Pressable>
          ) : (
            <GoldButton label="Ingresar" size="sm" onPress={() => router.push('/login')} />
          )}
        </View>
      </View>

      {/* ---------- Marca ---------- */}
      <FadeIn style={styles.hero}>
        <Logo />
        <Text style={styles.tagline}>Tu pasión, tu apuesta.</Text>
        <Text style={styles.subtag}>Seguimiento total del FPC, la Copa BetPlay y el fútbol internacional.</Text>
        {(estado.data?.demostracion || estado.data?.pagos === 'pruebas') && (
          <View style={styles.pills}>
            {estado.data?.demostracion && <Pill label="Datos de demostración" tone="warning" icon="flask-outline" />}
            {estado.data?.pagos === 'pruebas' && <Pill label="Pagos en modo pruebas" tone="muted" icon="card-outline" />}
          </View>
        )}
      </FadeIn>

      {/* ---------- Bienvenida o saldo ---------- */}
      <FadeIn delay={80}>
        {user ? (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.trim()[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Hola, {user.name.split(/\s+/)[0]}
                </Text>
                <Text style={styles.cardText}>
                  {wallet?.openBets ? `${wallet.openBets} apuesta${wallet.openBets === 1 ? '' : 's'} en juego · ${formatCOP(wallet.inPlayCop)}` : 'Sin apuestas abiertas'}
                </Text>
              </View>
            </View>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balance}>{formatCOP(wallet?.balanceCop ?? 0)}</Text>
            {selfExcluded && (
              <View style={styles.warn}>
                <Ionicons name="pause-circle-outline" size={18} color={colors.warning} />
                <Text style={styles.warnText}>Tu cuenta está en pausa por autoexclusión. Puedes retirar tu saldo.</Text>
              </View>
            )}
            <View style={styles.cardButtons}>
              <GoldButton
                label="Depositar"
                icon="add"
                disabled={selfExcluded}
                onPress={() => router.push({ pathname: '/billetera', params: { tab: 'depositar' } })}
                style={{ flex: 1 }}
              />
              <OutlineButton label="Mis apuestas" onPress={() => router.push('/apuestas')} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatarEmpty}>
                <Ionicons name="person" size={26} color={colors.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle}>¡Bienvenido a Fanáticos 360!</Text>
                <Text style={styles.cardText}>
                  Inicia sesión para apostar en la Liga BetPlay, la Copa y los partidos clave del fútbol internacional.
                </Text>
              </View>
            </View>
            <View style={styles.cardButtons}>
              <GoldButton label="Iniciar" onPress={() => router.push('/login')} style={{ flex: 1 }} />
              <OutlineButton label="Registrarse" onPress={() => router.push('/registro')} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </FadeIn>

      {/* ---------- Ligas destacadas ---------- */}
      <View style={styles.section}>
        <SectionHeading title="Ligas Destacadas" onLink={() => router.push('/partidos')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.bleed}>
          <LeagueChip league={null} active={liga === null} onPress={() => setLiga(null)} />
          {listaLigas.map((l) => (
            <LeagueChip key={l.id} league={l} active={liga === l.id} onPress={() => setLiga(l.id)} />
          ))}
        </ScrollView>
      </View>

      {/* ---------- En vivo ---------- */}
      {enVivo.length > 0 && (
        <View style={styles.section}>
          <SectionHeading
            title="En vivo ahora"
            onLink={() => router.push({ pathname: '/partidos', params: { status: 'live' } })}
          />
          <View style={styles.list}>
            {enVivo.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </View>
        </View>
      )}

      {/* ---------- Partidos populares ---------- */}
      <View style={styles.section}>
        <SectionHeading
          title="Partidos Populares"
          onLink={() => router.push({ pathname: '/partidos', params: liga ? { league: String(liga) } : {} })}
        />
        {populares.error && !partidos.length ? (
          <ErrorNotice message={populares.error.message} onRetry={populares.reload} />
        ) : populares.loading && !partidos.length ? (
          <View style={styles.list}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : partidos.length === 0 ? (
          <EmptyState title="No hay partidos próximos" text="Cuando se publique el calendario aparecerán aquí con sus cuotas." />
        ) : (
          <View style={styles.list}>
            {partidos.map((m, i) => (
              <FadeIn key={m.id} delay={Math.min(i, 4) * 60}>
                <MatchCard match={m} />
              </FadeIn>
            ))}
          </View>
        )}
      </View>

      {/* ---------- Mercados populares ---------- */}
      <View style={styles.section}>
        <SectionHeading title="Mercados Populares" />
        <View style={styles.grid}>
          {ORDEN_TARJETAS.map((t) => (
            <MarketTile
              key={t}
              type={t}
              width={anchoTarjeta}
              onPress={() => router.push({ pathname: '/partidos', params: { market: t, ...(liga ? { league: String(liga) } : {}) } })}
            />
          ))}
        </View>
      </View>

      {/* ---------- Juego responsable ---------- */}
      <Pressable onPress={() => router.push('/juego-responsable')} style={({ pressed }) => [styles.responsible, pressed && { opacity: 0.85 }]}>
        <View style={styles.age}>
          <Text style={styles.ageText}>18+</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.respTitle}>Juega con responsabilidad</Text>
          <Text style={styles.respText}>Pon límites a tus depósitos o toma una pausa cuando lo necesites.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
      </Pressable>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentLine,
    backgroundColor: colors.accentSoft,
  },
  balanceChipText: { color: colors.foreground, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  hero: { marginTop: 22, marginBottom: 22 },
  tagline: { color: colors.foreground, fontSize: 24, fontWeight: '900', marginTop: 18, letterSpacing: -0.4 },
  subtag: { color: colors.muted, fontSize: 15.5, lineHeight: 22, marginTop: 6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  card: {
    padding: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarEmpty: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accentLine,
    backgroundColor: colors.surface2,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  avatarText: { color: colors.accentForeground, fontSize: 22, fontWeight: '900' },
  cardTitle: { color: colors.foreground, fontSize: 18.5, fontWeight: '900', letterSpacing: -0.3 },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  balanceLabel: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 18 },
  balance: { color: colors.foreground, fontSize: 34, fontWeight: '900', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  warn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningLine,
  },
  warnText: { flex: 1, color: colors.foreground, fontSize: 13, lineHeight: 18 },
  cardButtons: { flexDirection: 'row', gap: 12, marginTop: 18 },
  section: { marginTop: 32 },
  bleed: { marginHorizontal: -20 },
  chips: { gap: 12, paddingHorizontal: 20 },
  list: { gap: 16 },
  skeleton: { height: 250, borderRadius: 26, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  responsible: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 32,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  age: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  ageText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  respTitle: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
  respText: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
}));
>>>>>>> Stashed changes
