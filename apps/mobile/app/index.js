import { useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_BARRA } from '../src/components/BetSlipBar';
import Diagonal from '../src/components/Diagonal';
import FadeIn from '../src/components/FadeIn';
import LeagueStory from '../src/components/LeagueStory';
import Logo from '../src/components/Logo';
import MarketTile from '../src/components/MarketTile';
import MatchCard, { MatchHeroCard } from '../src/components/MatchCard';
import { MatchCardSkeleton, Skeleton, useCountUp } from '../src/components/Motion';
import SectionHeading from '../src/components/SectionHeading';
import Tap from '../src/components/Tap';
import { EmptyState, ErrorNotice, Pill } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';
import { formatCOP } from '../src/lib/format';
import { ORDEN_TARJETAS } from '../src/lib/markets';
import { useMenu } from '../src/lib/menu-context';
import { useFetch } from '../src/lib/use-fetch';
import { DORADO } from '../src/theme/colors';
import { makeStyles, useTheme } from '../src/theme';

const ALTO_DIAGONAL = 330;
const GUTTER = 20;

/**
 * Inicio "Energía 360": bloque diagonal dorado con la marca y el saludo,
 * tarjeta de saldo, ligas como historias, carrusel de partidazos con los
 * colores de cada equipo, partidos en vivo, mercados y juego responsable.
 */
export default function Inicio() {
  const styles = useStyles();
  const { colors, toggle, isLight } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { open } = useMenu();
  const { user, wallet, selfExcluded, refreshWallet } = useAuth();
  const [liga, setLiga] = useState(null);

  const estado = useFetch('/estado');
  const ligas = useFetch('/leagues', { every: 60000 });
  const vivo = useFetch('/matches?status=live&limit=5', { every: 20000 });
  const populares = useFetch(`/matches?status=upcoming&limit=8${liga ? `&league=${liga}` : ''}`, { every: 60000 });

  const listaLigas = ligas.data?.items ?? [];
  const enVivo = vivo.data?.items ?? [];
  const partidos = populares.data?.items ?? [];
  const saldo = useCountUp(wallet?.balanceCop ?? 0);
  const ancho = Math.min(width, 640);
  const anchoTarjeta = (ancho - GUTTER * 2 - 10) / 2;
  const anchoHero = Math.min(ancho - GUTTER * 2 - 34, 320);

  // El bloque dorado y el "360" de fondo se quedan atrás al bajar (parallax).
  const scrollY = useRef(new Animated.Value(0)).current;
  const alScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });
  const paralaje = (factor) => ({
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [-200, 0, 400],
          outputRange: [-200 * (1 - factor) - 20, 0, 400 * factor],
          extrapolateRight: 'clamp',
        }),
      },
    ],
  });

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
      <StatusBar style="dark" />
      <Animated.ScrollView
        style={styles.screen}
        onScroll={alScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: ALTO_BARRA + insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={ligas.refreshing}
            onRefresh={recargar}
            tintColor={DORADO.texto}
            colors={[DORADO.fondo]}
            progressViewOffset={insets.top}
          />
        }
      >
        <Animated.View style={paralaje(0.45)} pointerEvents="none">
          <Diagonal height={ALTO_DIAGONAL + insets.top} />
        </Animated.View>
        <Animated.Text pointerEvents="none" style={[styles.watermark, { top: insets.top + 300 }, paralaje(0.2)]}>
          360
        </Animated.Text>

        <View style={[styles.content, { paddingTop: insets.top }]}>
          {/* ---------- Encabezado ---------- */}
          <View style={styles.header}>
            <Logo size="compact" tone="onGold" />
            <View style={styles.headerRight}>
              <Tap
                onPress={toggle}
                scaleTo={0.88}
                style={styles.hb}
                accessibilityRole="button"
                accessibilityLabel={isLight ? 'Modo oscuro' : 'Modo claro'}
              >
                <Ionicons name={isLight ? 'moon' : 'sunny'} size={18} color={DORADO.texto} />
              </Tap>
              <Tap
                onPress={open}
                scaleTo={0.88}
                style={styles.hb}
                accessibilityRole="button"
                accessibilityLabel="Abrir menú"
              >
                <Ionicons name="menu" size={21} color={DORADO.texto} />
              </Tap>
            </View>
          </View>

          {/* ---------- Saludo ---------- */}
          <FadeIn>
            <Text style={styles.hello}>{user ? `Hola, ${primerNombre}` : 'Bienvenido a la hinchada'}</Text>
            <Text style={styles.title}>
              ¿A quién le vas{'\n'}
              {enVivo.length ? 'ahora mismo?' : 'esta noche?'}
            </Text>
          </FadeIn>

          {/* ---------- Saldo / acceso ---------- */}
          <FadeIn delay={80}>
            <View style={styles.wallet}>
              <View style={styles.walletIcon}>
                <Ionicons name={user ? 'wallet' : 'person'} size={19} color={DORADO.fondo} />
              </View>
              {user ? (
                <Tap onPress={() => router.push('/billetera')} scaleTo={0.97} style={styles.walletText}>
                  <Text style={styles.walletLabel}>
                    {wallet?.openBets
                      ? `Saldo · ${wallet.openBets} en juego`
                      : 'Saldo disponible'}
                  </Text>
                  <Text style={styles.walletValue}>{formatCOP(Math.round(saldo))}</Text>
                </Tap>
              ) : (
                <View style={styles.walletText}>
                  <Text style={styles.walletLabel} numberOfLines={1} onPress={() => router.push('/login')}>
                    ¿Ya tienes cuenta? <Text style={styles.loginLinkStrong}>Ingresa</Text>
                  </Text>
                  <Text style={styles.walletValueSm} numberOfLines={1}>Crea tu cuenta</Text>
                </View>
              )}
              {user ? (
                <Tap
                  onPress={() => router.push({ pathname: '/billetera', params: { tab: 'depositar' } })}
                  disabled={selfExcluded}
                  scaleTo={0.92}
                  style={[styles.walletBtn, selfExcluded && { opacity: 0.5 }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={16} color="#0b0f15" />
                  <Text style={styles.walletBtnText}>Recargar</Text>
                </Tap>
              ) : (
                <Tap onPress={() => router.push('/registro')} scaleTo={0.92} style={styles.walletBtn}>
                  <Text style={styles.walletBtnText}>Unirme</Text>
                </Tap>
              )}
            </View>
            {selfExcluded && (
              <View style={styles.warn}>
                <Ionicons name="pause-circle-outline" size={17} color={colors.warning} />
                <Text style={styles.warnText}>Cuenta en pausa por autoexclusión. Puedes retirar tu saldo.</Text>
              </View>
            )}
          </FadeIn>

          {/* ---------- Ligas (historias) ---------- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stories}
            style={styles.bleed}
          >
            {enVivo.length > 0 && (
              <LeagueStory
                live
                label="En vivo"
                onPress={() => router.push({ pathname: '/partidos', params: { status: 'live' } })}
              />
            )}
            <LeagueStory league={null} active={liga === null} onPress={() => setLiga(null)} />
            {ligas.loading && !listaLigas.length
              ? [0, 1, 2].map((i) => <Skeleton key={i} width={64} height={64} radius={32} />)
              : listaLigas.map((l) => (
                  <LeagueStory key={l.id} league={l} active={liga === l.id} onPress={() => setLiga(l.id)} />
                ))}
          </ScrollView>

          {/* ---------- Partidazos (carrusel) ---------- */}
          <View style={styles.section}>
            <SectionHeading
              title={liga ? 'Próximos partidos' : 'Partidazos'}
              onLink={() => router.push({ pathname: '/partidos', params: liga ? { league: String(liga) } : {} })}
            />
            {populares.error && !partidos.length ? (
              <ErrorNotice message={populares.error.message} onRetry={populares.reload} />
            ) : populares.loading && !partidos.length ? (
              <View style={styles.list}>
                <MatchCardSkeleton />
              </View>
            ) : partidos.length === 0 ? (
              <EmptyState
                title="No hay partidos próximos"
                text="Cuando se publique el calendario aparecerán aquí con sus cuotas."
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={anchoHero + 12}
                snapToAlignment="start"
                contentContainerStyle={styles.carousel}
                style={styles.bleed}
              >
                {partidos.map((m, i) => (
                  <FadeIn key={m.id} delay={Math.min(i, 3) * 70}>
                    <MatchHeroCard match={m} width={anchoHero} />
                  </FadeIn>
                ))}
              </ScrollView>
            )}
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

          {/* ---------- Mercados ---------- */}
          <View style={styles.section}>
            <SectionHeading title="Arma tu jugada" />
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

          {(estado.data?.demostracion || estado.data?.pagos === 'pruebas') && (
            <View style={styles.pills}>
              {estado.data?.demostracion && <Pill label="Datos de demostración" tone="warning" icon="flask-outline" />}
              {estado.data?.pagos === 'pruebas' && (
                <Pill label="Pagos en modo pruebas" tone="muted" icon="card-outline" />
              )}
            </View>
          )}

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
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: GUTTER, width: '100%', maxWidth: 640, alignSelf: 'center' },
  watermark: {
    position: 'absolute',
    right: -14,
    color: colors.orange,
    opacity: 0.07,
    fontSize: 190,
    fontWeight: '900',
    letterSpacing: -12,
    lineHeight: 200,
  },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', gap: 8 },
  hb: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,20,5,0.12)',
  },
  hello: { color: DORADO.texto, opacity: 0.75, fontSize: 13.5, fontWeight: '600', marginTop: 8 },
  title: {
    color: DORADO.texto,
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 2,
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,191,58,0.15)',
  },
  walletText: { flex: 1, minWidth: 0 },
  walletLabel: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  walletValue: { color: colors.foreground, fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'] },
  walletValueSm: { color: colors.foreground, fontSize: 15, fontWeight: '700' },
  loginLinkStrong: { color: colors.accent, fontWeight: '700' },
  walletBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.contrast,
  },
  walletBtnText: { color: colors.contrastForeground, fontSize: 13, fontWeight: '700' },
  warn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.warningSoft,
  },
  warnText: { flex: 1, color: colors.foreground, fontSize: 12.5, lineHeight: 17 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  bleed: { marginHorizontal: -GUTTER },
  stories: { gap: 12, paddingHorizontal: GUTTER, paddingTop: 22 },
  section: { marginTop: 26 },
  carousel: { gap: 12, paddingHorizontal: GUTTER },
  list: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  responsible: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    padding: 14,
    borderRadius: 20,
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
