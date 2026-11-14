import { useState } from 'react';
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeIn from '../src/components/FadeIn';
import { SuccessCheck, useCountUp } from '../src/components/Motion';
import Tap from '../src/components/Tap';
import { movimientoReducido } from '../src/lib/motion';
import { EmptyState, GoldButton, OutlineButton, Pill } from '../src/components/ui';
import { apiFetch } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { useBetSlip } from '../src/lib/betslip-context';
import { codigoBoleto, formatCOP, formatKickoff, formatNumber, formatOdds } from '../src/lib/format';
import { makeStyles, useTheme } from '../src/theme';

const RAPIDOS = [5000, 10000, 20000, 50000, 100000];
const MIN = 1000;
const MAX = 2000000;

/** Boleto: revisar selecciones, elegir el valor y confirmar la apuesta. */
export default function Boleto() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, wallet, selfExcluded, refreshWallet } = useAuth();
  const slip = useBetSlip();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [cambiaron, setCambiaron] = useState(false);
  const [hecha, setHecha] = useState(null);

  const valor = Number(slip.stake) || 0;
  const ganancia = useCountUp(slip.potentialPayout);
  const cuota = useCountUp(slip.totalOdds);
  // Quitar una selección (o vaciar el boleto) reacomoda la lista con suavidad.
  const conTransicion = (fn) => {
    if (!movimientoReducido()) {
      LayoutAnimation.configureNext(LayoutAnimation.create(240, 'easeInEaseOut', 'opacity'));
    }
    fn();
  };
  const saldo = wallet?.balanceCop ?? 0;
  const empezados = slip.selections.filter((s) => new Date(s.kickoffAt).getTime() - 60000 <= Date.now());
  const fueraDeRango = valor < MIN || valor > MAX;

  const apostar = async () => {
    setError(null);
    setEnviando(true);
    try {
      const res = await apiFetch('/bets', {
        method: 'POST',
        auth: true,
        body: {
          stakeCop: valor,
          selections: slip.selections.map((s) => ({ selectionId: s.selectionId, odds: s.odds })),
          acceptOddsChanges: false,
        },
      });
      setHecha(res.bet);
      setCambiaron(false);
      slip.clear();
      refreshWallet();
    } catch (err) {
      const cambios = Array.isArray(err.details) ? err.details.filter((d) => d.now != null) : [];
      if (err.status === 409 && cambios.length) {
        // Nunca se cobra a una cuota que el usuario no vio: se actualizan y él decide.
        slip.updateOdds(cambios);
        setCambiaron(true);
      } else {
        setError(err.fieldMessage ?? err.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  // ---------- Apuesta confirmada ----------
  if (hecha) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <FadeIn style={styles.done}>
          <SuccessCheck />
          <Text style={styles.doneTitle}>¡Apuesta registrada!</Text>
          <Text style={styles.doneText}>
            Boleto {codigoBoleto(hecha.id)} · {hecha.type === 'combo' ? `Combinada de ${hecha.legs.length}` : 'Simple'}
          </Text>
          <View style={styles.summary}>
            <Linea k="Apostaste" v={formatCOP(hecha.stakeCop)} />
            <Linea k="Cuota" v={formatOdds(hecha.totalOdds)} />
            <Linea k="Ganancia posible" v={formatCOP(hecha.potentialPayoutCop)} fuerte />
          </View>
          <GoldButton
            label="Ver mis apuestas"
            onPress={() => router.replace({ pathname: '/apuestas', params: { status: 'open' } })}
            style={styles.full}
          />
          <OutlineButton label="Seguir apostando" onPress={() => router.replace('/partidos')} style={styles.full} />
        </FadeIn>
      </ScrollView>
    );
  }

  if (slip.count === 0) {
    return (
      <View style={[styles.screen, styles.content]}>
        <EmptyState
          icon="receipt-outline"
          title="Tu boleto está vacío"
          text="Toca una cuota en cualquier partido para agregarla. Con varias selecciones de partidos distintos armas una combinada."
          action={
            <GoldButton label="Ver partidos" onPress={() => router.replace('/partidos')} style={{ marginTop: 8 }} />
          }
        />
      </View>
    );
  }

  let boton;
  if (!user) {
    boton = (
      <GoldButton
        label="Inicia sesión para apostar"
        icon="log-in-outline"
        onPress={() => router.push({ pathname: '/login', params: { next: '/boleto' } })}
      />
    );
  } else if (selfExcluded) {
    boton = <GoldButton label="Cuenta en pausa (autoexclusión)" disabled />;
  } else if (valor > saldo) {
    boton = (
      <GoldButton
        label={`Deposita ${formatCOP(valor - saldo)} para apostar`}
        icon="add"
        onPress={() => router.push({ pathname: '/billetera', params: { tab: 'depositar' } })}
      />
    );
  } else {
    boton = (
      <GoldButton
        label={cambiaron ? `Aceptar nuevas cuotas y apostar` : `Apostar ${formatCOP(valor)}`}
        loading={enviando}
        disabled={fueraDeRango || empezados.length > 0}
        onPress={apostar}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <Pill label={slip.count === 1 ? 'Apuesta simple' : `Combinada · ${slip.count} selecciones`} />
          <Pressable onPress={() => conTransicion(slip.clear)} hitSlop={8}>
            <Text style={styles.clear}>Vaciar</Text>
          </Pressable>
        </View>

        {cambiaron && (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Ionicons name="swap-vertical" size={18} color={colors.warning} />
            <Text style={styles.bannerText}>
              Algunas cuotas cambiaron. Revisa los valores nuevos antes de confirmar.
            </Text>
          </View>
        )}
        {empezados.length > 0 && (
          <View style={[styles.banner, styles.bannerDanger]}>
            <Ionicons name="time-outline" size={18} color={colors.danger} />
            <Text style={styles.bannerText}>
              {empezados.length === 1 ? 'Un partido ya empezó' : `${empezados.length} partidos ya empezaron`}. Quita
              esas selecciones para continuar.
            </Text>
          </View>
        )}

        {/* ---------- Selecciones ---------- */}
        <View style={styles.legs}>
          {slip.selections.map((s, i) => {
            const empezo = empezados.includes(s);
            const sube = s.previousOdds && s.odds > s.previousOdds;
            return (
              <FadeIn
                key={s.selectionId}
                delay={Math.min(i, 5) * 50}
                style={[styles.leg, empezo && { borderColor: colors.dangerLine }]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.legMarket}>{s.marketName}</Text>
                  <Text style={styles.legLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Pressable onPress={() => router.push(`/partido/${s.matchId}`)} hitSlop={4}>
                    <Text style={styles.legMatch} numberOfLines={1}>
                      {s.matchLabel}
                    </Text>
                  </Pressable>
                  <Text style={[styles.legTime, empezo && { color: colors.danger }]}>
                    {empezo ? 'Ya empezó' : `${s.league ? `${s.league} · ` : ''}${formatKickoff(s.kickoffAt)}`}
                  </Text>
                </View>
                <View style={styles.legRight}>
                  <Pressable
                    onPress={() => conTransicion(() => slip.remove(s.selectionId))}
                    hitSlop={10}
                    accessibilityLabel="Quitar selección"
                  >
                    <Ionicons name="close-circle" size={22} color={colors.subtle} />
                  </Pressable>
                  <View style={styles.oddsBox}>
                    {s.previousOdds && s.previousOdds !== s.odds && (
                      <Ionicons
                        name={sube ? 'arrow-up' : 'arrow-down'}
                        size={13}
                        color={sube ? colors.live : colors.danger}
                      />
                    )}
                    <Text style={styles.legOdds}>{formatOdds(s.odds)}</Text>
                  </View>
                </View>
              </FadeIn>
            );
          })}
        </View>

        {/* ---------- Valor ---------- */}
        <View style={styles.card}>
          <View style={styles.stakeHead}>
            <Text style={styles.cardTitle}>Valor a apostar</Text>
            {user && <Text style={styles.balance}>Saldo {formatCOP(saldo)}</Text>}
          </View>
          <View style={[styles.inputWrap, fueraDeRango && valor > 0 && { borderColor: colors.danger }]}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              value={valor ? formatNumber(valor) : ''}
              onChangeText={(t) => slip.setStake(t.replace(/\D/g, '').slice(0, 9))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              accessibilityLabel="Valor a apostar en pesos"
            />
            <Text style={styles.cop}>COP</Text>
          </View>
          {fueraDeRango && (
            <Text style={styles.rangeError}>
              La apuesta debe estar entre {formatCOP(MIN)} y {formatCOP(MAX)}.
            </Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick}>
            {RAPIDOS.map((r) => (
              <Tap
                key={r}
                scaleTo={0.9}
                onPress={() => slip.setStake(String(r))}
                style={[styles.quickChip, valor === r && styles.quickOn]}
              >
                <Text style={[styles.quickText, valor === r && styles.quickTextOn]}>{formatCOP(r)}</Text>
              </Tap>
            ))}
          </ScrollView>

          <View style={styles.summary}>
            <Linea k="Cuota total" v={formatOdds(cuota)} />
            <Linea k="Ganancia posible" v={formatCOP(Math.round(ganancia))} fuerte />
          </View>
        </View>

        {!!error && (
          <View style={[styles.banner, styles.bannerDanger]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.bannerText}>{error}</Text>
          </View>
        )}

        {boton}
        <Text style={styles.fine}>
          Las cuotas pueden cambiar hasta que confirmes. Las apuestas se cierran un minuto antes del inicio y se
          liquidan con el resultado de los 90 minutos. Juega con responsabilidad.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Linea({ k, v, fuerte }) {
  const styles = useStyles();
  return (
    <View style={styles.lineRow}>
      <Text style={styles.lineK}>{k}</Text>
      <Text style={[styles.lineV, fuerte && styles.lineStrong]}>{v}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 4, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clear: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14, borderWidth: 1 },
  bannerWarn: { backgroundColor: colors.warningSoft, borderColor: colors.warningLine },
  bannerDanger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerLine },
  bannerText: { flex: 1, color: colors.foreground, fontSize: 13.5, lineHeight: 19 },
  legs: { gap: 10 },
  leg: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  legMarket: { color: colors.subtle, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  legLabel: { color: colors.foreground, fontSize: 16, fontWeight: '900', marginTop: 3 },
  legMatch: { color: colors.muted, fontSize: 13.5, marginTop: 3 },
  legTime: { color: colors.subtle, fontSize: 12.5, marginTop: 2 },
  legRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  oddsBox: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legOdds: { color: colors.accent, fontSize: 20, fontWeight: '900' },
  card: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardTitle: { color: colors.foreground, fontSize: 16, fontWeight: '900' },
  stakeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balance: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 60,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accentLine,
    backgroundColor: colors.background,
  },
  currency: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
  },
  cop: { color: colors.subtle, fontSize: 13, fontWeight: '700' },
  rangeError: { color: colors.danger, fontSize: 12.5, marginTop: 6 },
  quick: { gap: 8, marginTop: 12 },
  quickChip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  quickOn: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  quickText: { color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  quickTextOn: { color: colors.accent },
  summary: {
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignSelf: 'stretch',
  },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineK: { color: colors.muted, fontSize: 14 },
  lineV: { color: colors.foreground, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  lineStrong: { color: colors.accent, fontSize: 20, fontWeight: '900' },
  fine: { color: colors.subtle, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  done: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  doneTitle: { color: colors.foreground, fontSize: 24, fontWeight: '900', marginTop: 6 },
  doneText: { color: colors.muted, fontSize: 14 },
  full: { alignSelf: 'stretch', marginTop: 6 },
}));
