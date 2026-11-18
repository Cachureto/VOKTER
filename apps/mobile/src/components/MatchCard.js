import { memo } from 'react';
import { Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImage } from '../lib/api';
import { formatKickoff } from '../lib/format';
import { colorEquipo, nombreCorto, siglas, textoSobre } from '../lib/teams';
import { makeStyles, useTheme } from '../theme';
import { LiveDot } from './Motion';
import OddButton from './OddButton';
import Tap from './Tap';

/**
 * Insignia del equipo: placa redondeada teñida con el color del club y sus
 * siglas. Si el proveedor trae escudo, se muestra el escudo.
 */
export function Escudo({ team, size = 40 }) {
  const styles = useStyles();
  const uri = resolveImage(team.logoUrl);
  const color = colorEquipo(team.name);
  const radio = Math.round(size * 0.32);
  if (uri) {
    return (
      <View style={[styles.badge, { width: size, height: size, borderRadius: radio }]}>
        <Image source={{ uri }} style={{ width: size * 0.72, height: size * 0.72 }} resizeMode="contain" />
      </View>
    );
  }
  const texto = siglas(team);
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: radio, backgroundColor: `${color}2e`, borderColor: `${color}66` },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: size * (texto.length > 3 ? 0.24 : 0.3), color: claro(color) }]}>
        {texto}
      </Text>
    </View>
  );
}

// Los colores muy oscuros no se leen como texto sobre el fondo oscuro.
function claro(hex) {
  return textoSobre(hex) === '#ffffff' ? mezclar(hex, '#ffffff', 0.45) : hex;
}
function mezclar(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function estadoTexto(match) {
  if (match.status === 'cancelled') return 'Cancelado';
  if (match.status === 'finished') return 'Final';
  return formatKickoff(match.kickoffAt);
}

function Cuotas({ match, styles }) {
  const mk = match.market;
  const terminado = match.status === 'finished' || match.status === 'cancelled';
  if (mk?.selections?.length) {
    return (
      <View style={styles.odds}>
        {mk.selections.slice(0, 3).map((s) => (
          <OddButton key={s.id} match={match} market={mk} selection={s} />
        ))}
      </View>
    );
  }
  return terminado ? null : <Text style={styles.noOdds}>Cuotas no disponibles para este mercado</Text>;
}

/**
 * Tarjeta grande del carrusel: arriba los colores de los dos equipos partidos
 * en diagonal con sus nombres, abajo la liga y las cuotas.
 */
export const MatchHeroCard = memo(function MatchHeroCard({ match, width = 290 }) {
  const styles = useStyles();
  const router = useRouter();
  const enVivo = match.status === 'live';
  const cLocal = colorEquipo(match.home.name);
  const cVisita = colorEquipo(match.away.name);

  return (
    <Tap
      onPress={() => router.push(`/partido/${match.id}`)}
      scaleTo={0.97}
      style={[styles.hero, { width }]}
      accessibilityRole="button"
      accessibilityLabel={`${match.home.name} contra ${match.away.name}`}
    >
      <View style={[styles.split, { backgroundColor: cLocal }]}>
        {/* Mitad del visitante con el borde inclinado. */}
        <View style={[styles.splitAway, { backgroundColor: cVisita, left: width * 0.52 }]} />
        {/* Sombra inferior para que los nombres se lean sobre cualquier color. */}
        <View style={styles.shade} />
        <View style={styles.pillTop}>
          {enVivo ? (
            <>
              <LiveDot size={6} />
              <Text style={styles.pillLive}>{match.minute ? `${match.minute}'` : 'EN VIVO'}</Text>
            </>
          ) : (
            <Text style={styles.pillText}>{estadoTexto(match).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.names}>
          <Text style={[styles.bigName, { color: textoSobre(cLocal) }]} numberOfLines={1}>
            {nombreCorto(match.home)}
          </Text>
          {match.score ? (
            <Text style={styles.heroScore}>
              {match.score.home}-{match.score.away}
            </Text>
          ) : null}
          <Text style={[styles.bigName, styles.right, { color: textoSobre(cVisita) }]} numberOfLines={1}>
            {nombreCorto(match.away)}
          </Text>
        </View>
      </View>
      <View style={styles.heroBody}>
        <View style={styles.heroMeta}>
          <Text style={styles.metaText} numberOfLines={1}>
            {match.league.name}
            {match.round ? ` · ${match.round}` : ''}
          </Text>
          {match.marketsCount > 1 && <Text style={styles.metaText}>+{match.marketsCount - 1}</Text>}
        </View>
        <Cuotas match={match} styles={styles} />
      </View>
    </Tap>
  );
});

/**
 * Tarjeta de partido para listas: liga y hora arriba, los equipos en filas
 * con sus insignias y el marcador, y las cuotas abajo.
 */
function MatchCard({ match }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const enVivo = match.status === 'live';
  const terminado = match.status === 'finished' || match.status === 'cancelled';
  const gana = (lado) =>
    terminado &&
    match.score &&
    (lado === 'home' ? match.score.home > match.score.away : match.score.away > match.score.home);

  const fila = (lado) => (
    <View style={styles.teamRow}>
      <Escudo team={match[lado]} size={30} />
      <Text style={[styles.teamName, gana(lado) && styles.winner]} numberOfLines={1}>
        {match[lado].name}
      </Text>
      {match.score && (
        <Text style={[styles.goals, (enVivo || gana(lado)) && styles.goalsOn]}>{match.score[lado]}</Text>
      )}
    </View>
  );

  return (
    <Tap
      onPress={() => router.push(`/partido/${match.id}`)}
      scaleTo={0.98}
      style={[styles.card, enVivo && styles.cardLive]}
      accessibilityRole="button"
      accessibilityLabel={`${match.home.name} contra ${match.away.name}`}
    >
      <View style={styles.top}>
        <Text style={styles.metaText} numberOfLines={1}>
          {match.league.name}
        </Text>
        {enVivo ? (
          <View style={styles.live}>
            <LiveDot size={6} />
            <Text style={styles.liveText}>{match.minute ? `${match.minute}'` : 'EN VIVO'}</Text>
          </View>
        ) : (
          <Text style={styles.time}>{estadoTexto(match)}</Text>
        )}
      </View>
      <View style={styles.teams}>
        {fila('home')}
        {fila('away')}
      </View>
      <Cuotas match={match} styles={styles} />
      {match.marketsCount > 1 && !terminado && (
        <View style={styles.more}>
          <Text style={styles.moreText}>+{match.marketsCount - 1} mercados</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.accent} />
        </View>
      )}
    </Tap>
  );
}

export default memo(MatchCard);

const useStyles = makeStyles((colors) => ({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  badgeText: { fontWeight: '900', letterSpacing: 0.2 },
  // ---- tarjeta grande ----
  hero: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  split: { height: 118, overflow: 'hidden' },
  splitAway: { position: 'absolute', top: -20, bottom: -20, right: -40, transform: [{ skewX: '-14deg' }] },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, backgroundColor: 'rgba(0,0,0,0.18)' },
  pillTop: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(11,15,21,0.78)',
  },
  pillText: { color: '#ffffff', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 },
  pillLive: { color: '#ff6b81', fontSize: 11.5, fontWeight: '800' },
  names: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  bigName: { flex: 1, fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },
  right: { textAlign: 'right' },
  heroScore: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(11,15,21,0.6)',
    overflow: 'hidden',
  },
  heroBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  // ---- tarjeta de lista ----
  card: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardLive: { borderColor: colors.dangerLine },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metaText: { flexShrink: 1, color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  time: { color: colors.foreground, fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.danger,
  },
  liveText: { color: '#ffffff', fontSize: 11.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  teams: { gap: 8, marginTop: 12, marginBottom: 14 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamName: { flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '600' },
  goals: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    minWidth: 20,
    textAlign: 'right',
  },
  goalsOn: { color: colors.foreground },
  winner: { color: colors.foreground, fontWeight: '800' },
  odds: { flexDirection: 'row', gap: 8 },
  noOdds: { color: colors.subtle, fontSize: 12.5, paddingVertical: 4 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 10 },
  moreText: { color: colors.accent, fontSize: 12.5, fontWeight: '700' },
}));
