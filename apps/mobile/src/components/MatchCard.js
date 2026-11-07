import { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImage } from '../lib/api';
import { formatKickoff } from '../lib/format';
import { makeStyles, useTheme } from '../theme';
import OddButton from './OddButton';

/** Círculo con el escudo del equipo, o su inicial si el proveedor no trae escudo. */
export function Escudo({ team, size = 58 }) {
  const styles = useStyles();
  const uri = resolveImage(team.logoUrl);
  return (
    <View style={[styles.crest, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size * 0.62, height: size * 0.62 }} resizeMode="contain" />
      ) : (
        <Text style={[styles.crestText, { fontSize: size * 0.38 }]}>{team.name.trim()[0]}</Text>
      )}
    </View>
  );
}

/**
 * Tarjeta de partido de la plantilla: liga arriba a la izquierda, hora a la
 * derecha, los dos equipos con un "VS" al medio y las cuotas abajo.
 */
function MatchCard({ match }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const enVivo = match.status === 'live';
  const terminado = match.status === 'finished' || match.status === 'cancelled';
  const mk = match.market;

  return (
    <Pressable
      onPress={() => router.push(`/partido/${match.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${match.home.name} contra ${match.away.name}`}
    >
      <View style={styles.top}>
        <View style={styles.league}>
          <Text style={styles.leagueText} numberOfLines={1}>
            {match.league.name}
          </Text>
        </View>
        {enVivo ? (
          <View style={styles.live}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO {match.minute ? `${match.minute}'` : ''}</Text>
          </View>
        ) : (
          <Text style={styles.time}>{terminado ? (match.status === 'cancelled' ? 'Cancelado' : 'Finalizado') : formatKickoff(match.kickoffAt)}</Text>
        )}
      </View>

      <View style={styles.teams}>
        <View style={styles.team}>
          <Escudo team={match.home} />
          <Text style={styles.teamName} numberOfLines={2}>
            {match.home.name}
          </Text>
        </View>
        {match.score ? (
          <View style={[styles.score, enVivo && styles.scoreLive]}>
            <Text style={styles.scoreText}>
              {match.score.home} - {match.score.away}
            </Text>
          </View>
        ) : (
          <View style={styles.vs}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        )}
        <View style={styles.team}>
          <Escudo team={match.away} />
          <Text style={styles.teamName} numberOfLines={2}>
            {match.away.name}
          </Text>
        </View>
      </View>

      {mk?.selections?.length ? (
        <View style={styles.odds}>
          {mk.selections.slice(0, 3).map((s) => (
            <OddButton key={s.id} match={match} market={mk} selection={s} />
          ))}
        </View>
      ) : (
        <Text style={styles.noOdds}>{terminado ? 'Partido terminado' : 'Cuotas no disponibles para este mercado'}</Text>
      )}

      {match.marketsCount > 1 && !terminado && (
        <View style={styles.more}>
          <Text style={styles.moreText}>+{match.marketsCount - 1} mercados</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accent} />
        </View>
      )}
    </Pressable>
  );
}

export default memo(MatchCard);

const useStyles = makeStyles((colors) => ({
  card: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  league: { flexShrink: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.accentSoft },
  leagueText: { color: colors.accent, fontSize: 13.5, fontWeight: '800' },
  time: { color: colors.muted, fontSize: 15, fontVariant: ['tabular-nums'] },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  liveText: { color: colors.danger, fontSize: 12.5, fontWeight: '900', letterSpacing: 0.5 },
  teams: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 18, marginBottom: 18 },
  team: { flex: 1, alignItems: 'center', gap: 10 },
  crest: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  crestText: { color: colors.accent, fontWeight: '900' },
  teamName: { color: colors.foreground, fontSize: 15.5, fontWeight: '800', textAlign: 'center' },
  vs: {
    marginTop: 14,
    width: 56,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  vsText: { color: colors.accent, fontSize: 15, fontWeight: '900' },
  score: {
    marginTop: 12,
    minWidth: 70,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  scoreLive: { backgroundColor: colors.dangerSoft },
  scoreText: { color: colors.foreground, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  odds: { flexDirection: 'row', gap: 10 },
  noOdds: { color: colors.subtle, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 14 },
  moreText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
}));
