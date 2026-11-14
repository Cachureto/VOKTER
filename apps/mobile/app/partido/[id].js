import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AccordionItem from '../../src/components/Accordion';
import { ALTO_BARRA } from '../../src/components/BetSlipBar';
import FadeIn from '../../src/components/FadeIn';
import { Escudo } from '../../src/components/MatchCard';
import { LiveDot, Pop, Skeleton } from '../../src/components/Motion';
import OddButton from '../../src/components/OddButton';
import { EmptyState, ErrorNotice, Pill } from '../../src/components/ui';
import { useBetSlip } from '../../src/lib/betslip-context';
import { formatDate, formatTime } from '../../src/lib/format';
import { MERCADOS } from '../../src/lib/markets';
import { useFetch } from '../../src/lib/use-fetch';
import { makeStyles, useTheme } from '../../src/theme';

// Cuántas cuotas por fila según el mercado.
const COLUMNAS = { '1x2': 3, dc: 3, ou: 2, btts: 2, qualify: 2, cs: 4 };

const AYUDA = {
  '1x2': '1 gana el local · X empate · 2 gana el visitante. Se decide con el resultado de los 90 minutos.',
  dc: '1X local o empate · 12 cualquiera gana · X2 empate o visitante.',
  ou: 'Total de goles de los dos equipos en los 90 minutos.',
  btts: 'Los dos equipos marcan al menos un gol.',
  qualify: 'Quién avanza de ronda, contando prórroga y penales.',
  cs: 'Resultado exacto al final de los 90 minutos.',
};

function enFilas(lista, n) {
  const filas = [];
  for (let i = 0; i < lista.length; i += n) filas.push(lista.slice(i, i + n));
  return filas;
}

/** Ficha del partido: marcador y todos los mercados abiertos. */
export default function Partido() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { data: m, error, loading, refreshing, reload } = useFetch(`/matches/${id}`, { every: 20000 });
  const slip = useBetSlip();
  // Los dos primeros mercados se ven abiertos; el resto se despliega al tocarlo.
  const [cerrados, setCerrados] = useState(() => new Set(['ou', 'btts', 'qualify', 'cs']));
  const alternar = (tipo) =>
    setCerrados((prev) => {
      const s = new Set(prev);
      if (s.has(tipo)) s.delete(tipo);
      else s.add(tipo);
      return s;
    });

  if (error && !m) {
    return (
      <View style={[styles.screen, styles.pad]}>
        <ErrorNotice message={error.status === 404 ? 'Este partido no existe.' : error.message} onRetry={reload} />
      </View>
    );
  }
  if (loading || !m) {
    return (
      <View style={[styles.screen, styles.pad]}>
        <Skeleton height={280} radius={26} />
        <Skeleton height={130} radius={22} style={{ marginTop: 14 }} />
        <Skeleton height={130} radius={22} style={{ marginTop: 14 }} />
      </View>
    );
  }

  const enVivo = m.status === 'live';
  const terminado = m.status === 'finished' || m.status === 'cancelled';
  const abierto = m.status === 'scheduled';

  // Las líneas de Más/Menos se agrupan en una sola tarjeta.
  const grupos = [];
  for (const mk of m.markets) {
    const g = grupos.find((x) => x.type === mk.type);
    if (g) g.markets.push(mk);
    else grupos.push({ type: mk.type, markets: [mk] });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: ALTO_BARRA + insets.bottom + 24 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.accent} colors={[colors.accent]} />
      }
    >
      {/* ---------- Marcador ---------- */}
      <FadeIn style={styles.board}>
        <View style={styles.boardTop}>
          <Pill label={m.league.name} />
          {enVivo ? (
            <View style={styles.livePill}>
              <LiveDot size={7} />
              <Text style={styles.livePillText}>EN VIVO {m.minute ? `${m.minute}'` : ''}</Text>
            </View>
          ) : (
            <Pill
              label={
                m.status === 'cancelled'
                  ? 'Cancelado'
                  : m.status === 'finished'
                    ? 'Finalizado'
                    : m.status === 'postponed'
                      ? 'Aplazado'
                      : 'Por jugar'
              }
              tone={terminado ? 'muted' : 'live'}
            />
          )}
        </View>
        <View style={styles.teams}>
          <View style={styles.team}>
            <Escudo team={m.home} size={60} />
            <Text style={styles.teamName} numberOfLines={2}>
              {m.home.name}
            </Text>
            <Text style={styles.side}>Local</Text>
          </View>
          <View style={styles.center}>
            {m.score ? (
              <Pop trigger={`${m.score.home}-${m.score.away}`} scale={1.3}>
                <Text style={[styles.score, enVivo && { color: colors.danger }]}>
                  {m.score.home} - {m.score.away}
                </Text>
              </Pop>
            ) : (
              <>
                <Text style={styles.hour}>{formatTime(m.kickoffAt)}</Text>
                <Text style={styles.vs}>VS</Text>
              </>
            )}
          </View>
          <View style={styles.team}>
            <Escudo team={m.away} size={60} />
            <Text style={styles.teamName} numberOfLines={2}>
              {m.away.name}
            </Text>
            <Text style={styles.side}>Visitante</Text>
          </View>
        </View>
        <View style={styles.meta}>
          <Meta icon="calendar-outline" text={`${formatDate(m.kickoffAt)} · ${formatTime(m.kickoffAt)}`} />
          {!!m.round && <Meta icon="flag-outline" text={m.round} />}
          {!!m.venue && <Meta icon="location-outline" text={m.venue} />}
        </View>
      </FadeIn>

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
      {m.oddsSource === 'modelo' && abierto && (
        <Text style={styles.source}>Cuotas calculadas por Fanáticos 360 a partir de la tabla de posiciones.</Text>
      )}

      {/* ---------- Mercados ---------- */}
      {grupos.length === 0 ? (
        <EmptyState title="Sin mercados" text="Este partido todavía no tiene cuotas publicadas." />
      ) : (
        grupos.map((g, i) => {
          const enBoleto = g.markets.some((mk) => mk.selections.some((sel) => slip.has(sel.id)));
          return (
            <FadeIn key={g.type} delay={Math.min(i, 5) * 60}>
              <AccordionItem
                variant="card"
                icon={MERCADOS[g.type]?.icon ?? 'football-outline'}
                title={MERCADOS[g.type]?.name ?? g.markets[0].name}
                summary={g.type === 'ou' ? `${g.markets.length} líneas` : `${g.markets[0].selections.length} opciones`}
                expanded={!cerrados.has(g.type)}
                onToggle={() => alternar(g.type)}
                right={
                  enBoleto ? (
                    <View style={styles.inSlip} accessibilityLabel="En el boleto">
                      <Ionicons name="receipt" size={13} color={colors.accentForeground} />
                    </View>
                  ) : null
                }
              >
                <Text style={styles.help}>{AYUDA[g.type]}</Text>
                {g.markets.map((mk) => (
                  <View key={mk.id} style={styles.lineBlock}>
                    {g.type === 'ou' && <Text style={styles.line}>{mk.line} goles</Text>}
                    {enFilas(mk.selections, COLUMNAS[g.type] ?? 3).map((fila, j) => (
                      <View key={j} style={styles.row}>
                        {fila.map((sel) => (
                          <OddButton
                            key={sel.id}
                            match={m}
                            market={mk}
                            selection={sel}
                            showLabel={g.type === 'qualify'}
                          />
                        ))}
                        {Array.from({ length: (COLUMNAS[g.type] ?? 3) - fila.length }).map((_, k) => (
                          <View key={`v${k}`} style={{ flex: 1 }} />
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </AccordionItem>
            </FadeIn>
          );
        })
      )}
    </ScrollView>
  );
}

function Meta({ icon, text }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.subtle} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 20 },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
  skeleton: { height: 280, borderRadius: 26, backgroundColor: colors.surface, opacity: 0.6 },
  board: { padding: 20, borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  boardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  teams: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 22 },
  team: { flex: 1, alignItems: 'center', gap: 8 },
  teamName: { color: colors.foreground, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  side: { color: colors.subtle, fontSize: 12, fontWeight: '600' },
  center: { width: 100, alignItems: 'center', paddingTop: 16 },
  score: { color: colors.foreground, fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] },
  hour: { color: colors.foreground, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  vs: { color: colors.accent, fontSize: 14, fontWeight: '900', marginTop: 4 },
  meta: { gap: 6, marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: colors.muted, fontSize: 13.5 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surface2,
  },
  noticeText: { flex: 1, color: colors.muted, fontSize: 13.5 },
  source: { color: colors.subtle, fontSize: 12.5, lineHeight: 18 },
  inSlip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dangerLine,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  livePillText: { color: colors.danger, fontSize: 12, fontWeight: '900' },
  market: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  marketHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marketTitle: { color: colors.foreground, fontSize: 17, fontWeight: '900' },
  help: { color: colors.subtle, fontSize: 12.5, lineHeight: 18, marginBottom: 4 },
  lineBlock: { marginTop: 8, gap: 8 },
  line: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 },
}));
