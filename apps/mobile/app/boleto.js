import { useState } from 'react';
import {
  ActivityIndicator,
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
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Diagonal from '../src/components/Diagonal';
import FadeIn from '../src/components/FadeIn';
import { Pop, SuccessCheck, useCountUp } from '../src/components/Motion';
import Tap from '../src/components/Tap';
import { EmptyState } from '../src/components/ui';
import { apiFetch } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { useBetSlip } from '../src/lib/betslip-context';
import { codigoBoleto, formatCOP, formatKickoff, formatNumber, formatOdds } from '../src/lib/format';
import { rotulo } from '../src/lib/markets';
import { movimientoReducido } from '../src/lib/motion';
import { colorEquipo, textoSobre } from '../src/lib/teams';
import { DORADO } from '../src/theme/colors';
import { makeStyles, useTheme } from '../src/theme';

const RAPIDOS = [5000, 10000, 20000, 50000, 100000];
const MIN = 1000;
const MAX = 2000000;

// Paso de los botones − / +: más fino en valores bajos.
const paso = (v) => (v < 10000 ? 1000 : v < 100000 ? 5000 : 10000);

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
  const cambiarValor = (signo) => {
    const nuevo = Math.min(MAX, Math.max(0, valor + signo * paso(signo > 0 ? valor : valor - 1)));
    slip.setStake(String(nuevo));
  };

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

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Bloque dorado con la flecha de volver, el título y un botón opcional.
  const encabezado = (titulo, sub, derecha) => (
    <>
      <Diagonal height={300 + insets.top} />
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <Tap onPress={volver} scaleTo={0.88} style={styles.hb} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={21} color={DORADO.texto} />
          </Tap>
          {derecha}
        </View>
        <FadeIn>
          <Text style={styles.title}>{titulo}</Text>
          {!!sub && <Text style={styles.sub}>{sub}</Text>}
        </FadeIn>
      </View>
    </>
  );

  // ---------- Apuesta confirmada ----------
  if (hecha) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {encabezado('¡Jugada lista!', `Boleto ${codigoBoleto(hecha.id)}`)}
          <View style={styles.content}>
            <FadeIn style={styles.done}>
              <SuccessCheck />
              <Text style={styles.doneTitle}>Apuesta registrada</Text>
              <Text style={styles.doneText}>
                {hecha.type === 'combo' ? `Combinada de ${hecha.legs.length}` : 'Apuesta simple'}
              </Text>
              <View style={styles.summary}>
                <Linea k="Apostaste" v={formatCOP(hecha.stakeCop)} />
                <Linea k="Cuota" v={formatOdds(hecha.totalOdds)} />
                <Linea k="Te llevas si aciertas" v={formatCOP(hecha.potentialPayoutCop)} fuerte />
              </View>
            </FadeIn>
            <BigButton
              label="Ver mis jugadas"
              icon="stats-chart"
              onPress={() => router.replace({ pathname: '/apuestas', params: { status: 'open' } })}
            />
            <Tap onPress={() => router.replace('/partidos')} scaleTo={0.96} style={styles.ghost}>
              <Text style={styles.ghostText}>Seguir apostando</Text>
            </Tap>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------- Boleto vacío ----------
  if (slip.count === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {encabezado('Tu jugada', 'Todavía no hay selecciones')}
          <View style={styles.content}>
            <FadeIn delay={80}>
              <EmptyState
                icon="ticket-outline"
                title="Tu boleto está vacío"
                text="Toca una cuota en cualquier partido para agregarla. Con varias selecciones de partidos distintos armas una combinada."
              />
            </FadeIn>
            <BigButton label="Ver partidos" icon="flame" onPress={() => router.replace('/partidos')} />
          </View>
        </ScrollView>
      </View>
    );
  }

  let boton;
  if (!user) {
    boton = (
      <BigButton
        label="Inicia sesión para apostar"
        icon="log-in-outline"
        onPress={() => router.push({ pathname: '/login', params: { next: '/boleto' } })}
      />
    );
  } else if (selfExcluded) {
    boton = <BigButton label="Cuenta en pausa (autoexclusión)" disabled />;
  } else if (valor > saldo) {
    boton = (
      <BigButton
        label={`Recarga ${formatCOP(valor - saldo)} para apostar`}
        icon="add"
        onPress={() => router.push({ pathname: '/billetera', params: { tab: 'depositar' } })}
      />
    );
  } else {
    boton = (
      <BigButton
        label={cambiaron ? 'Aceptar cuotas y confirmar' : 'Confirmar jugada'}
        icon="flash"
        loading={enviando}
        disabled={fueraDeRango || empezados.length > 0}
        onPress={apostar}
      />
    );
  }

  const tipo = slip.count === 1 ? 'Apuesta simple' : `Combinada de ${slip.count}`;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        {encabezado(
          'Tu jugada',
          `${tipo} · cuota ${formatOdds(cuota)}`,
          <Tap
            onPress={() => conTransicion(slip.clear)}
            scaleTo={0.9}
            style={styles.clear}
            accessibilityRole="button"
            accessibilityLabel="Vaciar boleto"
          >
            <Ionicons name="trash-outline" size={15} color={DORADO.texto} />
            <Text style={styles.clearText}>Vaciar</Text>
          </Tap>,
        )}

        <View style={styles.content}>
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
                {empezados.length === 1 ? 'Un partido ya empezó' : `${empezados.length} partidos ya empezaron`}.
                Quita esas selecciones para continuar.
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
                  delay={Math.min(i, 5) * 60}
                  style={[styles.leg, empezo && { borderColor: colors.dangerLine }]}
                >
                  <Insignia seleccion={s} />
                  <Pressable
                    onPress={() => router.push(`/partido/${s.matchId}`)}
                    style={{ flex: 1, minWidth: 0 }}
                    accessibilityRole="link"
                  >
                    <Text style={styles.legLabel} numberOfLines={1}>
                      {s.label}
                    </Text>
                    <Text style={styles.legMatch} numberOfLines={1}>
                      {s.marketName} · {s.matchLabel}
                    </Text>
                    <Text style={[styles.legTime, empezo && { color: colors.danger }]} numberOfLines={1}>
                      {empezo ? 'Ya empezó' : `${s.league ? `${s.league} · ` : ''}${formatKickoff(s.kickoffAt)}`}
                    </Text>
                  </Pressable>
                  <View style={styles.legRight}>
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
                    <Tap
                      onPress={() => conTransicion(() => slip.remove(s.selectionId))}
                      hitSlop={10}
                      scaleTo={0.85}
                      style={styles.remove}
                      accessibilityLabel="Quitar selección"
                    >
                      <Ionicons name="close" size={14} color={colors.muted} />
                    </Tap>
                  </View>
                </FadeIn>
              );
            })}
          </View>

          {/* ---------- Valor y ganancia ---------- */}
          <FadeIn delay={120} style={styles.total}>
            <View style={styles.totalStripe} />
            <View style={styles.totalStripe2} />
            <View style={styles.totalRow}>
              <Text style={styles.totalK}>Tu apuesta</Text>
              {user && <Text style={styles.totalK}>Saldo {formatCOP(saldo)}</Text>}
            </View>
            <View style={[styles.stake, fueraDeRango && valor > 0 && styles.stakeBad]}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                value={valor ? formatNumber(valor) : ''}
                onChangeText={(t) => slip.setStake(t.replace(/\D/g, '').slice(0, 9))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="rgba(26,20,5,0.4)"
                style={styles.input}
                accessibilityLabel="Valor a apostar en pesos"
              />
              <View style={styles.pm}>
                <Tap
                  onPress={() => cambiarValor(-1)}
                  disabled={valor <= 0}
                  scaleTo={0.85}
                  style={styles.pmBtn}
                  accessibilityLabel="Bajar valor"
                >
                  <Ionicons name="remove" size={18} color={DORADO.fondo} />
                </Tap>
                <Tap onPress={() => cambiarValor(1)} scaleTo={0.85} style={styles.pmBtn} accessibilityLabel="Subir valor">
                  <Ionicons name="add" size={18} color={DORADO.fondo} />
                </Tap>
              </View>
            </View>
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
            <View style={styles.win}>
              <View>
                <Text style={styles.winK}>Te llevas</Text>
                <Text style={styles.winOdds}>Cuota {formatOdds(cuota)}</Text>
              </View>
              <Pop trigger={slip.potentialPayout} scale={1.06}>
                <Text style={styles.winV}>{formatCOP(Math.round(ganancia))}</Text>
              </Pop>
            </View>
          </FadeIn>
          {fueraDeRango && (
            <Text style={styles.rangeError}>
              La apuesta debe estar entre {formatCOP(MIN)} y {formatCOP(MAX)}.
            </Text>
          )}

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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Placa de la selección: el equipo elegido con su color, o el rótulo del mercado. */
function Insignia({ seleccion: s }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [local, visita] = (s.matchLabel ?? '').split(' vs ');
  const equipo =
    (s.marketType === '1x2' || s.marketType === 'qualify') && s.code === '1'
      ? local
      : (s.marketType === '1x2' || s.marketType === 'qualify') && s.code === '2'
        ? visita
        : null;
  if (equipo) {
    const color = colorEquipo(equipo);
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={[styles.badgeText, { color: textoSobre(color) }]}>
          {equipo.replace(/^(atl[ée]tico|deportivo|independiente)\s+/i, '').slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
      <Text style={[styles.badgeText, { color: colors.accent }]} numberOfLines={1}>
        {rotulo(s.marketType, s.code)}
      </Text>
    </View>
  );
}

/** Botón principal grande, en blanco sobre la app oscura (negro en la clara). */
function BigButton({ label, icon, onPress, loading, disabled }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const apagado = disabled || loading;
  return (
    <Tap
      onPress={onPress}
      disabled={apagado}
      scaleTo={0.96}
      accessibilityRole="button"
      style={[styles.big, apagado && { opacity: 0.5 }]}
    >
      {loading ? (
        <ActivityIndicator color={colors.contrastForeground} />
      ) : (
        <>
          <Text style={styles.bigText}>{label}</Text>
          {icon && <Ionicons name={icon} size={18} color={colors.contrastForeground} />}
        </>
      )}
    </Tap>
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
  top: { paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  topRow: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hb: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,20,5,0.12)',
  },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(26,20,5,0.12)',
  },
  clearText: { color: DORADO.texto, fontSize: 13, fontWeight: '700' },
  title: { color: DORADO.texto, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.2, marginTop: 4 },
  sub: { color: DORADO.texto, opacity: 0.75, fontSize: 14, fontWeight: '600', marginTop: 2 },
  content: { paddingHorizontal: 20, paddingTop: 28, gap: 12, width: '100%', maxWidth: 640, alignSelf: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14, borderWidth: 1 },
  bannerWarn: { backgroundColor: colors.warningSoft, borderColor: colors.warningLine },
  bannerDanger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerLine },
  bannerText: { flex: 1, color: colors.foreground, fontSize: 13.5, lineHeight: 19 },
  // ---- selecciones ----
  legs: { gap: 10 },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12.5, fontWeight: '900', letterSpacing: 0.2 },
  legLabel: { color: colors.foreground, fontSize: 15.5, fontWeight: '700' },
  legMatch: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  legTime: { color: colors.subtle, fontSize: 12, marginTop: 1 },
  legRight: { alignItems: 'flex-end', gap: 6 },
  oddsBox: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legOdds: { color: colors.foreground, fontSize: 21, fontWeight: '800', fontVariant: ['tabular-nums'] },
  remove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  // ---- total dorado ----
  total: { marginTop: 4, padding: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: DORADO.fondo },
  totalStripe: {
    position: 'absolute',
    right: -60,
    top: -40,
    width: 200,
    height: 400,
    backgroundColor: '#f5a20f',
    opacity: 0.45,
    transform: [{ rotate: '24deg' }],
  },
  totalStripe2: {
    position: 'absolute',
    left: -80,
    top: -60,
    width: 160,
    height: 300,
    backgroundColor: DORADO.brillo,
    opacity: 0.5,
    transform: [{ rotate: '24deg' }],
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalK: { color: DORADO.texto, opacity: 0.8, fontSize: 13, fontWeight: '700' },
  stake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 58,
    marginTop: 10,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(26,20,5,0.1)',
  },
  stakeBad: { borderColor: '#b4232f' },
  currency: { color: DORADO.texto, fontSize: 24, fontWeight: '800' },
  input: {
    flex: 1,
    minWidth: 0,
    color: DORADO.texto,
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
  },
  pm: { flexDirection: 'row', gap: 6 },
  pmBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DORADO.texto,
  },
  quick: { gap: 6, marginTop: 10 },
  quickChip: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: 'rgba(26,20,5,0.1)',
  },
  quickOn: { backgroundColor: DORADO.texto },
  quickText: { color: DORADO.texto, fontSize: 12.5, fontWeight: '700' },
  quickTextOn: { color: DORADO.fondo },
  win: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, gap: 10 },
  winK: { color: DORADO.texto, fontSize: 13.5, fontWeight: '700' },
  winOdds: { color: DORADO.texto, opacity: 0.7, fontSize: 12, fontWeight: '600', marginTop: 1 },
  winV: {
    color: DORADO.texto,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  rangeError: { color: colors.danger, fontSize: 12.5 },
  // ---- botones ----
  big: {
    height: 58,
    marginTop: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.contrast,
  },
  bigText: { color: colors.contrastForeground, fontSize: 16, fontWeight: '800' },
  ghost: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghostText: { color: colors.foreground, fontSize: 15, fontWeight: '700' },
  fine: { color: colors.subtle, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 4 },
  // ---- confirmada ----
  done: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  doneTitle: { color: colors.foreground, fontSize: 22, fontWeight: '800', marginTop: 6 },
  doneText: { color: colors.muted, fontSize: 14 },
  summary: {
    gap: 8,
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignSelf: 'stretch',
  },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineK: { color: colors.muted, fontSize: 14 },
  lineV: { color: colors.foreground, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  lineStrong: { color: colors.accent, fontSize: 19, fontWeight: '900' },
}));
