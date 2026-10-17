import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FadeIn from '../src/components/FadeIn';
import ProductCard from '../src/components/ProductCard';
import { apiFetch } from '../src/lib/api';
import { formatNumber } from '../src/lib/format';
import { makeStyles, useTheme } from '../src/theme';

const PAGE_SIZE = 10;

const GAP = 12;
const PADDING = 16;

export default function Catalog() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  // Llega desde el inicio o el menú: /catalogo?category=audio o ?q=cargador
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const cardWidth = (width - PADDING * 2 - GAP) / 2;

  const [search, setSearch] = useState(typeof params.q === 'string' ? params.q : '');
  const [debounced, setDebounced] = useState(typeof params.q === 'string' ? params.q.trim() : '');
  const [category, setCategory] = useState(typeof params.category === 'string' ? params.category : null);
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

  // Si se vuelve a entrar con otra categoría (por ejemplo desde el menú
  // estando ya en el catálogo), se aplica el filtro nuevo.
  useEffect(() => {
    if (typeof params.category === 'string') setCategory(params.category);
  }, [params.category]);

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
      <Text style={styles.title}>Catálogo</Text>
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
    <View style={styles.screen}>
      <FlatList
        data={status === 'error' ? [] : items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item, index }) => (
          // Escalonado solo dentro de cada página de 10: lo que llega con el
          // scroll infinito entra igual de rápido que la primera tanda.
          <FadeIn delay={(index % PAGE_SIZE) * 55}>
            <ProductCard product={item} width={cardWidth} />
          </FadeIn>
        )}
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
    </View>
  );
}

function Chip({ label, active, onPress }) {
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: PADDING, paddingBottom: 40, gap: GAP },
  title: { color: colors.foreground, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
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
  chipActive: { backgroundColor: colors.contrast, borderColor: colors.contrast },
  chipLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipLabelActive: { color: colors.contrastForeground },
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
}));
