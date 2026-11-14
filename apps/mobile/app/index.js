import { useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_BARRA } from '../src/components/BetSlipBar';
import FadeIn from '../src/components/FadeIn';
import { MenuButton } from '../src/components/HeaderActions';
import LeagueChip from '../src/components/LeagueChip';
import Logo from '../src/components/Logo';
import MarketTile from '../src/components/MarketTile';
import MatchCard from '../src/components/MatchCard';
import { MatchCardSkeleton, useCountUp } from '../src/components/Motion';
import SectionHeading from '../src/components/SectionHeading';
import Tap from '../src/components/Tap';
import ThemeToggle from '../src/components/ThemeToggle';
import { EmptyState, ErrorNotice, GoldButton, OutlineButton, Pill } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';
import { formatCOP } from '../src/lib/format';
import { ORDEN_TARJETAS } from '../src/lib/markets';
import { useFetch } from '../src/lib/use-fetch';
import { DORADO } from '../src/theme/colors';
import { makeStyles, useTheme } from '../src/theme';

const ALTO_ENCABEZADO = 56;

/**
 * Inicio: encabezado fijo con la marca, tarjeta principal (bienvenida o
 * saldo), ligas, partidos en vivo, partidos populares y mercados.
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
  const saldo = useCountUp(wallet?.balanceCop ?? 0);
  const anchoTarjeta = (Math.min(width, 640) - 20 * 2 - 10) / 2;

  // El encabezado es transparente arriba del todo y, al bajar, toma fondo y
  // una línea inferior, como las barras de las apps actuales.
  const scrollY = useRef(new Animated.Value(0)).current;
  const alScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });
  const fondoEncabezado = {
    opacity: scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' }),
  };
  // La tarjeta principal se aleja un poco al bajar (sutil, sin marearse).
  const parallax = {
    transform: [
      {
        translateY: scrollY.interpolate({ inputRange: [-80, 0, 240], outputRange: [-16, 0, 40], extrapolate: 'clamp' }),
      },
      { scale: scrollY.interpolate({ inputRange: [0, 240], outputRange: [1, 0.97], extrapolate: 'clamp' }) },
    ],
  };

  const recargar = () => {
    ligas.reload();
    vivo.refetch();
    populares.refetch();
    estado.refetch();
    refreshWallet();
  };

  const primerNombre = user?.name.split(/\s+/)[0];

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.screen}
        onScroll={alScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + ALTO_ENCABEZADO + 8, paddingBottom: ALTO_BARRA + insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={ligas.refreshing}
            onRefresh={recargar}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={insets.top + ALTO_ENCABEZADO}
          />
        }
      >
        {/* ---------- Tarjeta principal ---------- */}
        <FadeIn>
          <Animated.View style={[styles.hero, parallax]}>
            {/* Brillos decorativos: dan profundidad sin imágenes ni degradados nativos. */}
            <View pointerEvents="none" style={[styles.glow, styles.glowGold]} />
            <View pointerEvents="none" style={[styles.glow, styles.glowOrange]} />

            {user ? (
              <>
                <View style={styles.heroTop}>
                  <View>
                    <Text style={styles.eyebrow}>Hola, {primerNombre}</Text>
                    <Text style={styles.heroLabel}>Saldo disponible</Text>
                  </View>
                  <Tap onPress={() => router.push('/billetera')} scaleTo={0.9} style={styles.heroIconBtn}>
                    <Ionicons name="wallet-outline" size={18} color={colors.foreground} />
                  </Tap>
                </View>
                <Text style={styles.balance}>{formatCOP(Math.round(saldo))}</Text>
                <Text style={styles.heroMeta}>
                  {wallet?.openBets
                    ? `${wallet.openBets} apuesta${wallet.openBets === 1 ? '' : 's'} en juego · ${formatCOP(wallet.inPlayCop)}`
                    : 'Sin apuestas abiertas'}
                </Text>
                {selfExcluded && (
                  <View style={styles.warn}>
                    <Ionicons name="pause-circle-outline" size={17} color={colors.warning} />
                    <Text style={styles.warnText}>Cuenta en pausa por autoexclusión. Puedes retirar tu saldo.</Text>
                  </View>
                )}
                <View style={styles.heroButtons}>
                  <GoldButton
                    label="Depositar"
                    icon="add"
                    size="sm"
                    disabled={selfExcluded}
                    onPress={() => router.push({ pathname: '/billetera', params: { tab: 'depositar' } })}
                    style={{ flex: 1 }}
                  />
                  <OutlineButton
                    label="Mis apuestas"
                    tone="neutral"
                    onPress={() => router.push('/apuestas')}
                    style={styles.heroGhost}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.eyebrow}>Fanáticos 360</Text>
                <Text style={styles.heroTitle}>Tu pasión,{'\n'}tu apuesta.</Text>
                <Text style={styles.heroText}>
                  Liga BetPlay, Copa BetPlay y el fútbol internacional con cuotas que se mueven en vivo.
                </Text>
                <View style={styles.heroButtons}>
                  <GoldButton
                    label="Crear cuenta"
                    size="sm"
                    onPress={() => router.push('/registro')}
                    style={{ flex: 1 }}
                  />
                  <OutlineButton
                    label="Ingresar"
                    tone="neutral"
                    onPress={() => router.push('/login')}
                    style={styles.heroGhost}
                  />
                </View>
              </>
            )}
          </Animated.View>
          {(estado.data?.demostracion || estado.data?.pagos === 'pruebas') && (
            <View style={styles.pills}>
              {estado.data?.demostracion && <Pill label="Datos de demostración" tone="warning" icon="flask-outline" />}
              {estado.data?.pagos === 'pruebas' && (
                <Pill label="Pagos en modo pruebas" tone="muted" icon="card-outline" />
              )}
            </View>
          )}
        </FadeIn>

        {/* ---------- Ligas ---------- */}
        <View style={styles.section}>
          <SectionHeading title="Ligas" onLink={() => router.push('/partidos')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.bleed}
          >
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
              title="En vivo"
              onLink={() => router.push({ pathname: '/partidos', params: { status: 'live' } })}
            />
            <View style={styles.list}>
              {enVivo.map((m, i) => (
                <FadeIn key={m.id} delay={i * 60}>
                  <MatchCard match={m} />
                </FadeIn>
              ))}
            </View>
          </View>
        )}

        {/* ---------- Partidos populares ---------- */}
        <View style={styles.section}>
          <SectionHeading
            title="Partidos populares"
            onLink={() => router.push({ pathname: '/partidos', params: liga ? { league: String(liga) } : {} })}
          />
          {populares.error && !partidos.length ? (
            <ErrorNotice message={populares.error.message} onRetry={populares.reload} />
          ) : populares.loading && !partidos.length ? (
            <View style={styles.list}>
              {[0, 1].map((i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </View>
          ) : partidos.length === 0 ? (
            <EmptyState
              title="No hay partidos próximos"
              text="Cuando se publique el calendario aparecerán aquí con sus cuotas."
            />
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

        {/* ---------- Mercados ---------- */}
        <View style={styles.section}>
          <SectionHeading title="Mercados" />
          <View style={styles.grid}>
            {ORDEN_TARJETAS.map((t, i) => (
              <FadeIn key={t} delay={120 + i * 55}>
                <MarketTile
                  type={t}
                  width={anchoTarjeta}
                  onPress={() =>
                    router.push({
                      pathname: '/partidos',
                      params: { market: t, ...(liga ? { league: String(liga) } : {}) },
                    })
                  }
                />
              </FadeIn>
            ))}
          </View>
        </View>

        {/* ---------- Juego responsable ---------- */}
        <Tap onPress={() => router.push('/juego-responsable')} scaleTo={0.97} style={styles.responsible}>
          <View style={styles.age}>
            <Text style={styles.ageText}>18+</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.respTitle}>Juega con responsabilidad</Text>
            <Text style={styles.respText}>Pon límites a tus depósitos o toma una pausa cuando lo necesites.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </Tap>
      </Animated.ScrollView>

      {/* ---------- Encabezado fijo ---------- */}
      <View style={[styles.header, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[styles.headerBg, fondoEncabezado]} />
        <View style={styles.headerRow}>
          <MenuButton />
          <Logo size="compact" />
          <View style={styles.headerRight}>
            <ThemeToggle style={styles.iconBtn} />
            {user ? (
              <Tap onPress={() => router.push('/billetera')} scaleTo={0.93} style={styles.balanceChip}>
                <Text style={styles.balanceChipText}>{formatCOP(Math.round(saldo))}</Text>
              </Tap>
            ) : (
              <Tap onPress={() => router.push('/login')} scaleTo={0.93} style={styles.loginChip}>
                <Text style={styles.loginChipText}>Ingresar</Text>
              </Tap>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerBg: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    height: ALTO_ENCABEZADO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 38, height: 38, borderRadius: 19 },
  balanceChip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
  },
  balanceChipText: { color: colors.foreground, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  loginChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: DORADO.fondo,
  },
  loginChipText: { color: DORADO.texto, fontSize: 13, fontWeight: '800' },
  hero: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  glow: { position: 'absolute', borderRadius: 999 },
  glowGold: { width: 280, height: 280, top: -170, right: -110, backgroundColor: colors.accentSoft, opacity: 0.55 },
  glowOrange: { width: 200, height: 200, bottom: -150, left: -80, backgroundColor: colors.orangeSoft, opacity: 0.35 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroLabel: { color: colors.muted, fontSize: 13.5, fontWeight: '500', marginTop: 10 },
  balance: {
    color: colors.foreground,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  heroMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  heroTitle: {
    color: colors.foreground,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 8,
  },
  heroText: { color: colors.muted, fontSize: 14.5, lineHeight: 21, marginTop: 10, maxWidth: 320 },
  heroButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  heroGhost: { flex: 1, height: 40, borderRadius: 12, backgroundColor: colors.surface2 },
  warn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.warningSoft,
  },
  warnText: { flex: 1, color: colors.foreground, fontSize: 12.5, lineHeight: 17 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  section: { marginTop: 28 },
  bleed: { marginHorizontal: -20 },
  chips: { gap: 8, paddingHorizontal: 20 },
  list: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  responsible: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface2,
  },
  age: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  respTitle: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  respText: { color: colors.muted, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
}));
