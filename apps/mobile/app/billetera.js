import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_NAV } from '../src/lib/layout';
import AmountInput from '../src/components/AmountInput';
import FadeIn from '../src/components/FadeIn';
import { Pop, useCountUp } from '../src/components/Motion';
import { EmptyState, GoldButton, LoginRequired, OutlineButton, Pill, Segmented } from '../src/components/ui';
import { apiFetch } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { codigoBoleto, formatCOP, formatDateTime } from '../src/lib/format';
import { makeStyles, useTheme } from '../src/theme';

const PESTANAS = [
  { value: 'depositar', label: 'Depositar' },
  { value: 'retirar', label: 'Retirar' },
  { value: 'movimientos', label: 'Movimientos' },
];
const METODOS = [
  { value: 'pse', label: 'PSE', icon: 'business-outline' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'card-outline' },
  { value: 'nequi', label: 'Nequi', icon: 'phone-portrait-outline' },
];
const DEP = { min: 10000, max: 5000000 };
const RET = { min: 20000, max: 10000000 };

const TIPOS = {
  deposit: { label: 'Depósito', icon: 'arrow-down-circle', signo: 1, tono: 'live' },
  withdrawal: { label: 'Retiro', icon: 'arrow-up-circle', signo: -1, tono: 'muted' },
  stake: { label: 'Apuesta', icon: 'receipt', signo: -1, tono: 'muted' },
  payout: { label: 'Premio', icon: 'trophy', signo: 1, tono: 'live' },
  refund: { label: 'Reembolso', icon: 'refresh-circle', signo: 1, tono: 'accent' },
  adjustment: { label: 'Ajuste', icon: 'construct', signo: 1, tono: 'muted' },
};

/** Billetera: saldo, depósitos, retiros y movimientos. */
export default function Billetera() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user, ready, wallet, selfExcluded, refreshWallet, setUser } = useAuth();
  const [tab, setTab] = useState(PESTANAS.some((p) => p.value === params.tab) ? params.tab : 'depositar');
  const [monto, setMonto] = useState(50000);
  const [metodo, setMetodo] = useState('pse');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [refrescando, setRefrescando] = useState(false);
  const saldoAnimado = useCountUp(wallet?.balanceCop ?? 0);

  useEffect(() => {
    if (params.tab && PESTANAS.some((p) => p.value === params.tab)) setTab(params.tab);
  }, [params.tab]);

  useEffect(() => {
    setAviso(null);
    setMonto(tab === 'retirar' ? Math.max(RET.min, Math.min(wallet?.balanceCop ?? 0, 100000)) : 50000);
    // El saldo solo importa al cambiar de pestaña.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  if (ready && !user) {
    return (
      <View style={[styles.screen, styles.pad]}>
        <LoginRequired next="/billetera" text="Entra a tu cuenta para depositar, retirar y ver tus movimientos." />
      </View>
    );
  }

  const pruebas = wallet?.mode === 'pruebas';
  const saldo = wallet?.balanceCop ?? 0;
  const verificado = user?.kycStatus === 'verified';

  const enviar = async (ruta, body, exito) => {
    setAviso(null);
    setEnviando(true);
    try {
      const res = await apiFetch(ruta, { method: 'POST', auth: true, body });
      if (res.status === 'pending' && res.checkoutUrl) {
        Linking.openURL(res.checkoutUrl).catch(() => {});
        setAviso({ tipo: 'ok', texto: 'Completa el pago en la pasarela. El saldo se actualiza al confirmarse.' });
      } else {
        setAviso({ tipo: 'ok', texto: exito(res) });
      }
      await refreshWallet();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.fieldMessage ?? err.message });
    } finally {
      setEnviando(false);
    }
  };

  const verificar = async () => {
    setAviso(null);
    setEnviando(true);
    try {
      const res = await apiFetch('/account/verify', { method: 'POST', auth: true });
      setUser(res.user);
      setAviso({ tipo: 'ok', texto: 'Identidad verificada. Ya puedes retirar.' });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  const errDep =
    monto && (monto < DEP.min || monto > DEP.max) ? `Entre ${formatCOP(DEP.min)} y ${formatCOP(DEP.max)}.` : null;
  const errRet =
    monto > saldo
      ? 'No puedes retirar más de tu saldo disponible.'
      : monto && (monto < RET.min || monto > RET.max)
        ? `Entre ${formatCOP(RET.min)} y ${formatCOP(RET.max)}.`
        : null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + ALTO_NAV + 32 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={async () => {
              setRefrescando(true);
              await refreshWallet();
              setRefrescando(false);
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* ---------- Saldo ---------- */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            {pruebas && <Pill label="Modo pruebas" tone="warning" icon="flask-outline" />}
          </View>
          <Pop trigger={wallet?.balanceCop} scale={1.06} style={{ alignSelf: 'flex-start' }}>
            <Text style={styles.balance}>{formatCOP(Math.round(saldoAnimado))}</Text>
          </Pop>
          <Text style={styles.inPlay}>
            En juego: {formatCOP(wallet?.inPlayCop ?? 0)} · {wallet?.openBets ?? 0} apuesta
            {wallet?.openBets === 1 ? '' : 's'} abierta{wallet?.openBets === 1 ? '' : 's'}
          </Text>
          {pruebas && (
            <Text style={styles.testNote}>
              Los depósitos y retiros son simulados: no se mueve dinero real hasta conectar la pasarela de pagos.
            </Text>
          )}
        </View>

        <Segmented options={PESTANAS} value={tab} onChange={setTab} />

        {aviso && (
          <View style={[styles.banner, aviso.tipo === 'ok' ? styles.bannerOk : styles.bannerErr]}>
            <Ionicons
              name={aviso.tipo === 'ok' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={18}
              color={aviso.tipo === 'ok' ? colors.live : colors.danger}
            />
            <Text style={styles.bannerText}>{aviso.texto}</Text>
          </View>
        )}

        <FadeIn key={tab} distance={10} style={{ gap: 14 }}>
          {/* ---------- Depositar ---------- */}
          {tab === 'depositar' &&
            (selfExcluded ? (
              <EmptyState
                icon="pause-circle-outline"
                title="Cuenta en pausa"
                text="Durante la autoexclusión no se pueden hacer depósitos. Sí puedes retirar tu saldo."
              />
            ) : (
              <View style={styles.card}>
                <AmountInput
                  label="¿Cuánto quieres depositar?"
                  value={monto}
                  onChange={setMonto}
                  quick={[20000, 50000, 100000, 200000, 500000]}
                  error={errDep}
                />
                <Text style={[styles.label, { marginTop: 18 }]}>Medio de pago</Text>
                <View style={styles.methods}>
                  {METODOS.map((m) => {
                    const on = metodo === m.value;
                    return (
                      <Pressable
                        key={m.value}
                        onPress={() => setMetodo(m.value)}
                        style={[styles.method, on && styles.methodOn]}
                        accessibilityState={{ selected: on }}
                      >
                        <Ionicons name={m.icon} size={20} color={on ? colors.accent : colors.muted} />
                        <Text style={[styles.methodText, on && { color: colors.accent }]}>{m.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <GoldButton
                  label={`Depositar ${formatCOP(monto)}`}
                  loading={enviando}
                  disabled={!monto || !!errDep}
                  onPress={() =>
                    enviar(
                      '/wallet/deposits',
                      { amountCop: monto, method: metodo },
                      (r) => `Depósito acreditado. Nuevo saldo: ${formatCOP(r.balanceCop)}.`,
                    )
                  }
                  style={{ marginTop: 20 }}
                />
                <Pressable onPress={() => router.push('/juego-responsable')} hitSlop={6}>
                  <Text style={styles.link}>Poner un límite a mis depósitos</Text>
                </Pressable>
              </View>
            ))}

          {/* ---------- Retirar ---------- */}
          {tab === 'retirar' &&
            (!verificado ? (
              <View style={styles.card}>
                <View style={styles.kycIcon}>
                  <Ionicons name="id-card-outline" size={28} color={colors.accent} />
                </View>
                <Text style={styles.cardTitle}>Verifica tu identidad</Text>
                <Text style={styles.cardText}>
                  Por ley, antes del primer retiro confirmamos que la cuenta es tuya ({user?.documentType}{' '}
                  {user?.documentMasked}). El dinero solo se envía a cuentas a tu nombre.
                </Text>
                {pruebas ? (
                  <GoldButton
                    label="Verificar (modo pruebas)"
                    loading={enviando}
                    onPress={verificar}
                    style={{ marginTop: 16 }}
                  />
                ) : (
                  <Text style={styles.cardText}>La verificación con documento estará disponible pronto.</Text>
                )}
              </View>
            ) : (
              <View style={styles.card}>
                <AmountInput
                  label="¿Cuánto quieres retirar?"
                  value={monto}
                  onChange={setMonto}
                  quick={[20000, 50000, 100000, 200000].filter((q) => q <= saldo)}
                  error={errRet}
                />
                <Pressable onPress={() => setMonto(saldo)} hitSlop={6}>
                  <Text style={styles.link}>Retirar todo ({formatCOP(saldo)})</Text>
                </Pressable>
                <GoldButton
                  label={`Retirar ${formatCOP(monto)}`}
                  loading={enviando}
                  disabled={!monto || !!errRet}
                  onPress={() =>
                    enviar(
                      '/wallet/withdrawals',
                      { amountCop: monto },
                      (r) => `Retiro enviado. Nuevo saldo: ${formatCOP(r.balanceCop)}.`,
                    )
                  }
                  style={{ marginTop: 16 }}
                />
                <Text style={styles.fine}>
                  Los retiros llegan a la cuenta bancaria registrada a tu nombre en 1 a 3 días hábiles.
                </Text>
              </View>
            ))}

          {/* ---------- Movimientos ---------- */}
          {tab === 'movimientos' &&
            (wallet?.transactions?.length ? (
              <View style={styles.card}>
                {wallet.transactions.map((t, i) => {
                  const info = TIPOS[t.type] ?? TIPOS.adjustment;
                  return (
                    <View key={t.id} style={[styles.tx, i > 0 && styles.txBorder]}>
                      <Ionicons name={info.icon} size={26} color={colors[info.tono]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txTitle}>
                          {info.label}
                          {t.betId ? ` · boleto ${codigoBoleto(t.betId)}` : ''}
                          {t.method ? ` · ${t.method.toUpperCase()}` : ''}
                        </Text>
                        <Text style={styles.txDate}>
                          {formatDateTime(t.createdAt)}
                          {t.status !== 'completed' ? ` · ${t.status === 'pending' ? 'pendiente' : 'fallido'}` : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.txAmount, info.signo > 0 && { color: colors.live }]}>
                          {info.signo > 0 ? '+' : '−'}
                          {formatCOP(t.amountCop)}
                        </Text>
                        {t.balanceAfterCop != null && <Text style={styles.txDate}>{formatCOP(t.balanceAfterCop)}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                icon="swap-vertical-outline"
                title="Sin movimientos"
                text="Aquí verás tus depósitos, apuestas, premios y retiros."
              />
            ))}
        </FadeIn>

        {tab !== 'movimientos' && (
          <OutlineButton
            label="Ver mis apuestas"
            tone="neutral"
            icon="receipt-outline"
            onPress={() => router.push('/apuestas')}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 20 },
  content: { padding: 20, paddingTop: 4, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
  balanceCard: {
    padding: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.accentLine,
    backgroundColor: colors.accentSoft,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  balanceLabel: { color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  balance: {
    color: colors.foreground,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  inPlay: { color: colors.muted, fontSize: 13.5, marginTop: 4 },
  testNote: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14, borderWidth: 1 },
  bannerOk: { backgroundColor: colors.liveSoft, borderColor: colors.liveLine },
  bannerErr: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerLine },
  bannerText: { flex: 1, color: colors.foreground, fontSize: 13.5, lineHeight: 19 },
  card: { padding: 18, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardTitle: { color: colors.foreground, fontSize: 18, fontWeight: '900', marginTop: 12 },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  kycIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  methods: { flexDirection: 'row', gap: 10 },
  method: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  methodOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  methodText: { color: colors.muted, fontSize: 13.5, fontWeight: '800' },
  link: { color: colors.accent, fontSize: 13.5, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  fine: { color: colors.subtle, fontSize: 12, lineHeight: 17, marginTop: 12, textAlign: 'center' },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  txBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  txTitle: { color: colors.foreground, fontSize: 14.5, fontWeight: '800' },
  txDate: { color: colors.subtle, fontSize: 12, marginTop: 2 },
  txAmount: { color: colors.foreground, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
}));
