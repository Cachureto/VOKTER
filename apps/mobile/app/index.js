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
