import { useState } from 'react';
import { Platform, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_BARRA } from '../../src/components/BetSlipBar';
import FadeIn from '../../src/components/FadeIn';
import { Escudo } from '../../src/components/MatchCard';
import { LiveDot, Pop, Skeleton } from '../../src/components/Motion';
import OddButton, { OddBar } from '../../src/components/OddButton';
import Tap from '../../src/components/Tap';
import { EmptyState, ErrorNotice } from '../../src/components/ui';
import { useBetSlip } from '../../src/lib/betslip-context';
import { formatDate, formatTime } from '../../src/lib/format';
import { MERCADOS } from '../../src/lib/markets';
import { colorEquipo, nombreCorto, probabilidades } from '../../src/lib/teams';
import { useFetch } from '../../src/lib/use-fetch';
import { makeStyles, useTheme } from '../../src/theme';

// Filtros de mercados (chips bajo el marcador).
const FILTROS = [
  { id: 'populares', label: 'Populares', tipos: ['1x2', 'qualify', 'dc', 'btts'] },
  { id: 'goles', label: 'Goles', tipos: ['ou', 'btts'] },
  { id: 'marcador', label: 'Marcador', tipos: ['cs'] },
  { id: 'todos', label: 'Todos', tipos: null },
];

const TITULOS = {
  '1x2': ['¿Quién gana?', 'Probabilidad del mercado'],
  qualify: ['¿Quién clasifica?', 'Con prórroga y penales'],
  dc: ['Doble oportunidad', 'Cubre dos resultados'],
  btts: ['¿Marcan los dos?', 'Al menos un gol cada uno'],
  ou: ['Goles totales', 'Los 90 minutos'],
  cs: ['Marcador exacto', 'Resultado al minuto 90'],
};

// El marcador va siempre sobre noche, en los dos temas.
const OSCURO = '#0b0f15';

// Cuántos resultados cubre cada opción: la doble oportunidad cubre dos.
const CUBRE = { dc: 2 };

/** Ficha del partido: marcador gigante con los colores de los equipos y mercados. */
export default function Partido() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: m, error, loading, refreshing, reload } = useFetch(`/matches/${id}`, { every: 20000 });
  const { count } = useBetSlip();
  const [filtro, setFiltro] = useState('populares');

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const nav = (
    <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
      <Tap onPress={volver} scaleTo={0.88} style={styles.glass} accessibilityRole="button" accessibilityLabel="Volver">
        <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={21} color="#ffffff" />
      </Tap>
      <Tap
        onPress={() => router.push('/boleto')}
        scaleTo={0.88}
        style={styles.glass}
        accessibilityRole="button"
        accessibilityLabel={`Boleto, ${count} selecciones`}
      >
        <Ionicons name="ticket-outline" size={20} color="#ffffff" />
        {count > 0 && (
          <Pop trigger={count} scale={1.4} style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{count}</Text>
          </Pop>
        )}
      </Tap>
    </View>
  );

  if (error && !m) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        {nav}
        <View style={styles.pad}>
          <ErrorNotice message={error.status === 404 ? 'Este partido no existe.' : error.message} onRetry={reload} />
        </View>
      </View>
    );
  }
  if (loading || !m) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <Skeleton height={340 + insets.top} radius={0} />
        <View style={styles.pad}>
          <Skeleton height={36} width={240} radius={18} />
          <Skeleton height={54} radius={16} style={{ marginTop: 18 }} />
          <Skeleton height={54} radius={16} style={{ marginTop: 8 }} />
          <Skeleton height={54} radius={16} style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  const enVivo = m.status === 'live';
  const terminado = m.status === 'finished' || m.status === 'cancelled';
  const abierto = m.status === 'scheduled';

  // Las líneas de Más/Menos se agrupan en un solo bloque.
  const grupos = [];
  for (const mk of m.markets) {
    const g = grupos.find((x) => x.type === mk.type);
    if (g) g.markets.push(mk);
    else grupos.push({ type: mk.type, markets: [mk] });
  }
  const disponibles = FILTROS.filter((f) => !f.tipos || grupos.some((g) => f.tipos.includes(g.type)));
  const activo = disponibles.find((f) => f.id === filtro) ?? disponibles[0];
  const visibles = grupos.filter((g) => !activo?.tipos || activo.tipos.includes(g.type));

  const estado = enVivo
    ? `EN VIVO${m.minute ? ` · ${m.minute}'` : ''}`
    : m.status === 'cancelled'
      ? 'CANCELADO'
      : m.status === 'finished'
        ? 'FINAL'
        : m.status === 'postponed'
          ? 'APLAZADO'
          : formatDate(m.kickoffAt).toUpperCase();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: ALTO_BARRA + insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reload}
            tintColor="#ffffff"
            colors={[colors.accent]}
            progressViewOffset={insets.top + 40}
          />
        }
      >
        {/* ---------- Marcador ---------- */}
        <Hero match={m} alto={330 + insets.top}>
          <View style={{ height: insets.top + 58 }} />
          <FadeIn style={styles.heroBody}>
            <View style={[styles.statePill, enVivo && styles.statePillLive]}>
              {enVivo && <LiveDot size={6} color="#ffffff" />}
              <Text style={styles.stateText}>{estado}</Text>
            </View>
            {m.score ? (
              <Pop trigger={`${m.score.home}-${m.score.away}`} scale={1.15}>
                <Text style={styles.bigScore}>
                  {m.score.home}
                  <Text style={styles.dash}> – </Text>
                  {m.score.away}
                </Text>
              </Pop>
            ) : (
              <Text style={styles.bigScore}>{formatTime(m.kickoffAt)}</Text>
            )}
            <View style={styles.names}>
              <View style={styles.side}>
                <Escudo team={m.home} size={34} />
                <Text style={styles.teamName} numberOfLines={1}>
                  {nombreCorto(m.home)}
                </Text>
                <Text style={styles.sideLabel}>Local</Text>
              </View>
              <View style={[styles.side, styles.sideRight]}>
                <Escudo team={m.away} size={34} />
                <Text style={[styles.teamName, styles.right]} numberOfLines={1}>
                  {nombreCorto(m.away)}
                </Text>
                <Text style={[styles.sideLabel, styles.right]}>Visitante</Text>
              </View>
            </View>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {[m.league.name, m.round, m.venue].filter(Boolean).join(' · ')}
            </Text>
          </FadeIn>
        </Hero>

        {/* ---------- Filtros ---------- */}
        {disponibles.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipsRow}
          >
            {disponibles.map((f) => {
              const on = f.id === activo.id;
              return (
                <Tap
                  key={f.id}
                  onPress={() => setFiltro(f.id)}
                  scaleTo={0.92}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
                </Tap>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.content}>
          {!abierto && !terminado && (
            <View style={styles.notice}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.muted} />
              <Text style={styles.noticeText}>
                {m.status === 'postponed'
                  ? 'Partido aplazado: las apuestas están cerradas hasta que tenga nueva fecha.'
                  : 'El partido ya empezó: las apuestas están cerradas.'}
              </Text>
            </View>
          )}

          {/* ---------- Mercados ---------- */}
          {grupos.length === 0 ? (
            <EmptyState title="Sin mercados" text="Este partido todavía no tiene cuotas publicadas." />
          ) : (
            visibles.map((g, i) => (
              <FadeIn key={`${activo.id}-${g.type}`} delay={Math.min(i, 5) * 70} style={styles.block}>
                <View style={styles.blockHead}>
                  <Text style={styles.blockTitle}>{TITULOS[g.type]?.[0] ?? MERCADOS[g.type]?.name}</Text>
                  <Text style={styles.blockHint}>{TITULOS[g.type]?.[1] ?? ''}</Text>
                </View>
                <Mercado grupo={g} match={m} />
              </FadeIn>
            ))
          )}

          {m.oddsSource === 'modelo' && abierto && (
            <Text style={styles.source}>Cuotas calculadas por Fanáticos 360 a partir de la tabla de posiciones.</Text>
          )}
        </View>
      </ScrollView>

      {/* Navegación sobre el marcador: queda fija al bajar. */}
      <View style={styles.navFixed} pointerEvents="box-none">
        {nav}
      </View>
    </View>
  );
}

/**
 * Fondo del marcador: el color del local entra por arriba a la izquierda y
 * el del visitante por la derecha, y todo se funde con el fondo hacia abajo.
 */
function Hero({ match, alto, children }) {
  const styles = useStyles();
  const { isLight } = useTheme();
  const { width } = useWindowDimensions();
  const local = colorEquipo(match.home.name);
  const visita = colorEquipo(match.away.name);
  const franjas = 24;
  return (
    <View style={[styles.hero, isLight && styles.heroLight, { minHeight: alto }]}>
      <View
        style={[
          styles.blob,
          { backgroundColor: local, width: width * 1.3, height: alto * 0.9, left: -width * 0.55, top: -alto * 0.25 },
        ]}
      />
      <View
        style={[
          styles.blob,
          { backgroundColor: visita, width: width * 1.3, height: alto * 0.9, right: -width * 0.55, top: alto * 0.12 },
        ]}
      />
      {/* Velo para que el blanco del marcador se lea sobre cualquier color. */}
      <View style={styles.veil} />
      {/* Fundido hacia el fondo de la pantalla. */}
      <View style={[styles.fade, { height: 120 }]}>
        {Array.from({ length: franjas }).map((_, i) => (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: OSCURO, opacity: ((i + 1) / franjas) ** 1.6 }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

/** Cuotas de un mercado: barras de probabilidad o fichas según el tipo. */
function Mercado({ grupo, match }) {
  const styles = useStyles();
  const { type, markets } = grupo;

  if (type === 'ou') {
    return (
      <View style={styles.stack}>
        {markets.map((mk) => (
          <View key={mk.id} style={styles.lineRow}>
            <View style={styles.linePill}>
              <Text style={styles.lineNum}>{mk.line}</Text>
              <Text style={styles.lineLabel}>goles</Text>
            </View>
            {mk.selections.map((sel) => (
              <OddButton key={sel.id} match={match} market={mk} selection={sel} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  if (type === 'cs') {
    const mk = markets[0];
    const filas = [];
    for (let i = 0; i < mk.selections.length; i += 4) filas.push(mk.selections.slice(i, i + 4));
    return (
      <View style={styles.stack}>
        {filas.map((fila, j) => (
          <View key={j} style={styles.row}>
            {fila.map((sel) => (
              <OddButton key={sel.id} match={match} market={mk} selection={sel} />
            ))}
            {Array.from({ length: 4 - fila.length }).map((_, k) => (
              <View key={`v${k}`} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  const mk = markets[0];
  const k = CUBRE[type] ?? 1;
  const probs = probabilidades(mk.selections).map((p) => Math.min(1, p * k));
  return (
    <View style={styles.stack}>
      {mk.selections.map((sel, i) => (
        <OddBar key={sel.id} match={match} market={mk} selection={sel} probabilidad={probs[i]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 20 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  navFixed: { position: 'absolute', top: 0, left: 0, right: 0 },
  glass: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,21,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  navBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  navBadgeText: { color: '#1a1405', fontSize: 10, fontWeight: '800' },
  // ---- marcador ----
  hero: { overflow: 'hidden', backgroundColor: OSCURO },
  // En el tema claro el marcador sigue oscuro y se recorta con esquinas.
  heroLight: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.6, transform: [{ rotate: '-18deg' }] },
  veil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.28, backgroundColor: OSCURO },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  heroBody: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 70 },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(11,15,21,0.55)',
  },
  statePillLive: { backgroundColor: '#f43f5e' },
  stateText: { color: '#ffffff', fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  bigScore: {
    color: '#ffffff',
    fontSize: 84,
    lineHeight: 92,
    fontWeight: '900',
    letterSpacing: -4,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  dash: { color: 'rgba(255,255,255,0.35)' },
  names: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', gap: 16, marginTop: 6 },
  side: { flex: 1, gap: 4 },
  sideRight: { alignItems: 'flex-end' },
  teamName: { color: '#ffffff', fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginTop: 4 },
  sideLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 11.5, fontWeight: '600' },
  right: { textAlign: 'right' },
  heroMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: '500', marginTop: 16 },
  // ---- filtros ----
  chipsRow: { marginTop: -24 },
  chips: { gap: 8, paddingHorizontal: 20 },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.contrast, borderColor: colors.contrast },
  chipText: { color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  chipTextOn: { color: colors.contrastForeground },
  // ---- mercados ----
  content: { paddingHorizontal: 20, paddingTop: 6, width: '100%', maxWidth: 640, alignSelf: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: colors.surface2,
  },
  noticeText: { flex: 1, color: colors.muted, fontSize: 13.5 },
  block: { marginTop: 22 },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  blockTitle: { color: colors.foreground, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  blockHint: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  stack: { gap: 8, marginTop: 10 },
  row: { flexDirection: 'row', gap: 8 },
  lineRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  linePill: {
    width: 62,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineNum: { color: colors.foreground, fontSize: 17, fontWeight: '800' },
  lineLabel: { color: colors.muted, fontSize: 10.5, fontWeight: '600' },
  source: { color: colors.subtle, fontSize: 12.5, lineHeight: 18, marginTop: 22 },
}));
