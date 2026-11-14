import { memo } from 'react';
import { Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImage } from '../lib/api';
import { formatKickoff } from '../lib/format';
import { estiloLiga } from '../lib/markets';
import { makeStyles, useTheme } from '../theme';
import { LiveDot } from './Motion';
import OddButton from './OddButton';
import Tap from './Tap';

// Paleta para las insignias de los equipos sin escudo: cada equipo recibe
// siempre el mismo color (según su nombre), así se reconocen de un vistazo.
// En el tema claro, la misma gama pero más oscura, para que las siglas se lean.
const TONOS_EQUIPO = {
  dark: ['#f0bf3a', '#2dd4bf', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#34d399', '#f87171'],
  light: ['#a16207', '#0f766e', '#1d4ed8', '#be185d', '#6d28d9', '#c2410c', '#047857', '#b91c1c'],
};

function tonoDe(nombre, tema) {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const lista = TONOS_EQUIPO[tema] ?? TONOS_EQUIPO.dark;
  return lista[h % lista.length];
}

function siglas(team) {
  if (team.shortName) return team.shortName.slice(0, 3).toUpperCase();
  const palabras = team.name.trim().split(/\s+/);
  return (palabras.length > 1 ? palabras[0][0] + palabras[1][0] : palabras[0].slice(0, 2)).toUpperCase();
}

/**
 * Escudo del equipo. Si el proveedor no trae imagen, una insignia redonda con
 * sus siglas en el color propio del equipo.
 */
export function Escudo({ team, size = 40 }) {
  const styles = useStyles();
  const { scheme } = useTheme();
  const uri = resolveImage(team.logoUrl);
  const tono = tonoDe(team.name, scheme);
  const radio = size / 2;
  if (uri) {
    return (
      <View style={[styles.crest, { width: size, height: size, borderRadius: radio }]}>
        <Image source={{ uri }} style={{ width: size * 0.7, height: size * 0.7 }} resizeMode="contain" />
      </View>
    );
  }
  const texto = siglas(team);
  return (
    <View
      style={[
        styles.crest,
        { width: size, height: size, borderRadius: radio, backgroundColor: `${tono}1f`, borderColor: `${tono}4d` },
      ]}
    >
      <Text style={[styles.crestText, { color: tono, fontSize: size * (texto.length > 2 ? 0.28 : 0.34) }]}>
        {texto}
      </Text>
    </View>
  );
}

/**
 * Tarjeta de partido: liga y hora arriba, los dos equipos en filas (con el
 * marcador a la derecha si ya empezó) y las cuotas abajo. Compacta, para que
 * quepan varios partidos en pantalla.
 */
function MatchCard({ match }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const enVivo = match.status === 'live';
  const terminado = match.status === 'finished' || match.status === 'cancelled';
  const mk = match.market;
  const liga = estiloLiga(match.league, colors);
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
        <Text style={[styles.goals, enVivo && { color: colors.foreground }, gana(lado) && styles.winner]}>
          {match.score[lado]}
        </Text>
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
        <View style={styles.league}>
          <Ionicons name={liga.icon} size={12} color={liga.fg} />
          <Text style={styles.leagueText} numberOfLines={1}>
            {match.league.name}
          </Text>
        </View>
        {enVivo ? (
          <View style={styles.live}>
            <LiveDot size={6} />
            <Text style={styles.liveText}>{match.minute ? `${match.minute}'` : 'EN VIVO'}</Text>
          </View>
        ) : (
          <Text style={styles.time}>
            {terminado ? (match.status === 'cancelled' ? 'Cancelado' : 'Final') : formatKickoff(match.kickoffAt)}
          </Text>
        )}
      </View>

      <View style={styles.teams}>
        {fila('home')}
        {fila('away')}
      </View>

      {mk?.selections?.length ? (
        <View style={styles.odds}>
          {mk.selections.slice(0, 3).map((s) => (
            <OddButton key={s.id} match={match} market={mk} selection={s} />
          ))}
        </View>
      ) : (
        !terminado && <Text style={styles.noOdds}>Cuotas no disponibles para este mercado</Text>
      )}

      {match.marketsCount > 1 && !terminado && (
        <View style={styles.more}>
          <Text style={styles.moreText}>+{match.marketsCount - 1} mercados</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </View>
      )}
    </Tap>
  );
}

export default memo(MatchCard);

const useStyles = makeStyles((colors) => ({
  card: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardLive: { borderColor: colors.dangerLine },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  league: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  leagueText: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  time: { color: colors.muted, fontSize: 12.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.dangerSoft,
  },
  liveText: { color: colors.danger, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  teams: { gap: 8, marginTop: 12, marginBottom: 14 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  crest: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  crestText: { fontWeight: '800', letterSpacing: 0.2 },
  teamName: { flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '600' },
  goals: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 18,
    textAlign: 'right',
  },
  winner: { color: colors.foreground, fontWeight: '800' },
  odds: { flexDirection: 'row', gap: 8 },
  noOdds: { color: colors.subtle, fontSize: 12.5, paddingVertical: 4 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 10 },
  moreText: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
}));
