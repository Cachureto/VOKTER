import { useMemo } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_BARRA } from '../src/components/BetSlipBar';
import FadeIn from '../src/components/FadeIn';
import MatchCard from '../src/components/MatchCard';
import { LiveDot, MatchCardSkeleton } from '../src/components/Motion';
import Tap from '../src/components/Tap';
import { EmptyState, ErrorNotice, Segmented } from '../src/components/ui';
import { formatDate } from '../src/lib/format';
import { MERCADOS, ORDEN_TARJETAS } from '../src/lib/markets';
import { useFetch } from '../src/lib/use-fetch';
import { makeStyles, useTheme } from '../src/theme';

const ESTADOS = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'live', label: 'En vivo' },
  { value: 'finished', label: 'Resultados' },
];

const diaDe = (iso) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
};

/**
 * Todos los partidos, con filtros de liga, estado y mercado. Los filtros
 * viven en la URL (?league=&status=&market=) para que el menú y el inicio
 * puedan abrir esta pantalla ya filtrada.
 */
export default function Partidos() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const league = params.league ? Number(params.league) : null;
  const status = ESTADOS.some((e) => e.value === params.status) ? params.status : 'upcoming';
  const market = MERCADOS[params.market] ? params.market : '1x2';

  const ligas = useFetch('/leagues');
  const qs = `status=${status}&market=${market}&limit=60${league ? `&league=${league}` : ''}`;
  const partidos = useFetch(`/matches?${qs}`, { every: status === 'live' ? 15000 : 60000 });

  const cambiar = (cambios) =>
    router.setParams({ league: league ? String(league) : undefined, status, market, ...cambios });

  // Con un mercado elegido solo se listan los partidos que lo tienen abierto
  // o ya liquidado (p. ej. "Clasifica" solo existe en eliminatorias).
  const filas = useMemo(() => {
    const items = (partidos.data?.items ?? []).filter((m) => market === '1x2' || status === 'finished' || m.market);
    const out = [];
    let ultimo = null;
    for (const m of items) {
      const dia = m.status === 'live' ? 'vivo' : diaDe(m.kickoffAt);
      if (dia !== ultimo) {
        out.push({ tipo: 'dia', key: `d-${dia}`, texto: dia === 'vivo' ? 'En vivo ahora' : formatDate(m.kickoffAt) });
        ultimo = dia;
      }
      out.push({ tipo: 'partido', key: `m-${m.id}`, match: m });
    }
    return out;
  }, [partidos.data, market, status]);

  const listaLigas = ligas.data?.items ?? [];

  const cabecera = (
    <View style={styles.filters}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.bleed}
      >
        <Chip label="Todas" on={!league} onPress={() => cambiar({ league: undefined })} />
        {listaLigas.map((l) => (
          <Chip
            key={l.id}
            label={l.name}
            badge={l.live > 0 ? `${l.live}` : null}
            on={league === l.id}
            onPress={() => cambiar({ league: String(l.id) })}
          />
        ))}
      </ScrollView>
      <Segmented options={ESTADOS} value={status} onChange={(v) => cambiar({ status: v })} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.bleed}
      >
        {ORDEN_TARJETAS.map((t) => (
          <Chip key={t} small label={MERCADOS[t].short} on={market === t} onPress={() => cambiar({ market: t })} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: ALTO_BARRA + insets.bottom + 24 }]}
      data={filas}
      keyExtractor={(f) => f.key}
      ListHeaderComponent={cabecera}
      renderItem={({ item, index }) =>
        item.tipo === 'dia' ? (
          <FadeIn delay={Math.min(index, 8) * 45} distance={8} style={styles.dayRow}>
            {item.texto === 'En vivo ahora' && <LiveDot />}
            <Text style={[styles.day, item.texto === 'En vivo ahora' && { color: colors.danger }]}>{item.texto}</Text>
          </FadeIn>
        ) : (
          <FadeIn delay={Math.min(index, 8) * 45} style={styles.item}>
            <MatchCard match={item.match} />
          </FadeIn>
        )
      }
      ListEmptyComponent={
        partidos.error ? (
          <ErrorNotice message={partidos.error.message} onRetry={partidos.reload} />
        ) : partidos.loading ? (
          <View style={{ gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={status === 'live' ? 'radio-outline' : 'calendar-outline'}
            title={
              status === 'live'
                ? 'No hay partidos en vivo'
                : status === 'finished'
                  ? 'Sin resultados todavía'
                  : 'No hay partidos con este filtro'
            }
            text={
              market !== '1x2' && status !== 'finished'
                ? `Prueba con otro mercado: «${MERCADOS[market].name}» no está abierto en estos partidos.`
                : 'Prueba con otra liga o vuelve más tarde.'
            }
          />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={partidos.refreshing}
          onRefresh={partidos.reload}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    />
  );
}

function Chip({ label, on, onPress, badge, small }) {
  const styles = useStyles();
  return (
    <Tap
      onPress={onPress}
      scaleTo={0.92}
      style={[styles.chip, small && styles.chipSmall, on && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Tap>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4, width: '100%', maxWidth: 640, alignSelf: 'center' },
  filters: { gap: 14, marginBottom: 8 },
  bleed: { marginHorizontal: -20 },
  chips: { gap: 8, paddingHorizontal: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSmall: { height: 32, paddingHorizontal: 12 },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.muted, fontSize: 13.5, fontWeight: '600' },
  chipTextOn: { color: colors.accent },
  badge: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: colors.danger },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 },
  day: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  item: { marginBottom: 12 },
  skeleton: {
    height: 250,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.6,
  },
}));
