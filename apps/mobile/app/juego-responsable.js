import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AmountInput from '../src/components/AmountInput';
import { GoldButton, LoginRequired, OutlineButton } from '../src/components/ui';
import { apiFetch } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { formatCOP, formatDate, formatDateTime } from '../src/lib/format';
import { useFetch } from '../src/lib/use-fetch';
import { makeStyles, useTheme } from '../src/theme';

const CONSEJOS = [
  ['cash-outline', 'Apuesta solo lo que puedas perder sin afectar tus gastos.'],
  ['time-outline', 'Decide de antemano cuánto tiempo y dinero vas a dedicar.'],
  ['trending-down-outline', 'No intentes recuperar lo perdido apostando más.'],
  ['people-outline', 'Si el juego te genera ansiedad o conflictos, habla con alguien.'],
];
const PAUSAS = [1, 7, 30, 90, 180, 365];
const nombrePausa = (d) => (d === 1 ? '24 horas' : d === 365 ? '1 año' : `${d} días`);

/** Juego responsable: consejos, límites de depósito y autoexclusión. */
export default function JuegoResponsable() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, ready, selfExcluded, setUser } = useAuth();

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.age}>
            <Text style={styles.ageText}>18+</Text>
          </View>
          <Text style={styles.title}>Que siga siendo diversión</Text>
          <Text style={styles.text}>
            Apostar es entretenimiento, no una forma de ganar dinero. Estas herramientas te ayudan a mantener el control.
          </Text>
        </View>

        <View style={styles.card}>
          {CONSEJOS.map(([icon, texto]) => (
            <View key={icon} style={styles.tip}>
              <Ionicons name={icon} size={20} color={colors.accent} />
              <Text style={styles.tipText}>{texto}</Text>
            </View>
          ))}
        </View>

        {ready && !user ? (
          <LoginRequired next="/juego-responsable" text="Entra a tu cuenta para poner límites de depósito o pausar tu cuenta." />
        ) : user ? (
          <>
            <Limites />
            <Autoexclusion user={user} activa={selfExcluded} onUser={setUser} />
          </>
        ) : null}

        <View style={styles.help}>
          <Ionicons name="call-outline" size={20} color={colors.accent} />
          <Text style={styles.helpText}>
            Si sientes que el juego dejó de ser diversión, busca apoyo. En Colombia la línea 192, opción 4, del Ministerio de Salud
            orienta en salud mental de forma gratuita.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Limites() {
  const styles = useStyles();
  const { data, reload, setData } = useFetch('/account/limits', { auth: true });
  const [editando, setEditando] = useState(null);
  const [monto, setMonto] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const guardar = async (period, amountCop) => {
    setEnviando(true);
    setAviso(null);
    try {
      const res = await apiFetch('/account/limits', { method: 'PUT', auth: true, body: { period, amountCop } });
      setData(res);
      const l = res.items.find((x) => x.period === period);
      setAviso(
        l?.pending
          ? `Por tu seguridad, subir o quitar un límite aplica en 24 horas (${formatDateTime(l.pending.effectiveAt)}).`
          : 'Límite actualizado. Ya está activo.',
      );
      setEditando(null);
    } catch (err) {
      setAviso(err.fieldMessage ?? err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Límites de depósito</Text>
      <Text style={styles.cardText}>Bajar un límite aplica de inmediato. Subirlo o quitarlo tarda 24 horas.</Text>
      {!!aviso && <Text style={styles.notice}>{aviso}</Text>}
      {(data?.items ?? []).map((l) => (
        <View key={l.period} style={styles.limit}>
          <View style={styles.limitHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.limitName}>Límite {l.name}</Text>
              <Text style={styles.limitValue}>{l.amountCop == null ? 'Sin límite' : formatCOP(l.amountCop)}</Text>
              <Text style={styles.limitUsed}>Depositado: {formatCOP(l.usedCop)}</Text>
              {l.pending && (
                <Text style={styles.limitPending}>
                  Cambio pendiente: {l.pending.amountCop == null ? 'sin límite' : formatCOP(l.pending.amountCop)} desde {formatDateTime(l.pending.effectiveAt)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => {
                setEditando(editando === l.period ? null : l.period);
                setMonto(l.amountCop ?? 200000);
              }}
              hitSlop={8}
            >
              <Text style={styles.edit}>{editando === l.period ? 'Cancelar' : 'Cambiar'}</Text>
            </Pressable>
          </View>
          {editando === l.period && (
            <View style={{ marginTop: 12, gap: 10 }}>
              <AmountInput value={monto} onChange={setMonto} quick={[50000, 100000, 200000, 500000, 1000000]} error={monto && monto < 10000 ? 'El mínimo es $10.000.' : null} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <GoldButton label="Guardar" size="sm" loading={enviando} disabled={monto < 10000} onPress={() => guardar(l.period, monto)} style={{ flex: 1 }} />
                {l.amountCop != null && (
                  <OutlineButton label="Quitar límite" tone="neutral" onPress={() => guardar(l.period, null)} style={{ flex: 1, height: 44 }} />
                )}
              </View>
            </View>
          )}
        </View>
      ))}
      {!data && (
        <Pressable onPress={reload}>
          <Text style={styles.edit}>Cargar límites</Text>
        </Pressable>
      )}
    </View>
  );
}

function Autoexclusion({ user, activa, onUser }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [dias, setDias] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const pausar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const res = await apiFetch('/account/self-exclusion', { method: 'POST', auth: true, body: { days: dias } });
      onUser(res.user);
      setConfirmar(false);
      setDias(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tomar una pausa</Text>
      {activa ? (
        <View style={styles.paused}>
          <Ionicons name="pause-circle" size={22} color={colors.warning} />
          <Text style={styles.pausedText}>
            Tu cuenta está en pausa hasta el {formatDate(user.selfExcludedUntil)}. No puedes apostar ni depositar; sí puedes retirar tu saldo.
            Puedes alargar la pausa, pero no acortarla.
          </Text>
        </View>
      ) : (
        <Text style={styles.cardText}>
          Durante la pausa no podrás apostar ni depositar. No se puede cancelar antes de tiempo, así que elige con calma.
        </Text>
      )}
      <View style={styles.chips}>
        {PAUSAS.map((d) => (
          <Pressable
            key={d}
            onPress={() => {
              setDias(d);
              setConfirmar(false);
            }}
            style={[styles.chip, dias === d && styles.chipOn]}
          >
            <Text style={[styles.chipText, dias === d && { color: colors.accent }]}>{nombrePausa(d)}</Text>
          </Pressable>
        ))}
      </View>
      {!!error && <Text style={[styles.notice, { color: colors.danger }]}>{error}</Text>}
      {dias &&
        (confirmar ? (
          <View style={styles.confirm}>
            <Text style={styles.confirmText}>
              ¿Seguro? Tu cuenta quedará en pausa {nombrePausa(dias)} y no podrás deshacerlo.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <OutlineButton label="Cancelar" tone="neutral" onPress={() => setConfirmar(false)} style={{ flex: 1, height: 46 }} />
              <OutlineButton label={enviando ? 'Pausando…' : 'Sí, pausar'} tone="danger" disabled={enviando} onPress={pausar} style={{ flex: 1, height: 46 }} />
            </View>
          </View>
        ) : (
          <OutlineButton label={`Pausar mi cuenta ${nombrePausa(dias)}`} tone="danger" icon="pause-outline" onPress={() => setConfirmar(true)} style={{ marginTop: 14 }} />
        ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 4, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  age: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  ageText: { color: colors.danger, fontSize: 20, fontWeight: '900' },
  title: { color: colors.foreground, fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 6 },
  text: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  card: { padding: 18, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 },
  tipText: { flex: 1, color: colors.foreground, fontSize: 14.5, lineHeight: 20 },
  cardTitle: { color: colors.foreground, fontSize: 18, fontWeight: '900' },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  notice: { color: colors.accent, fontSize: 13.5, lineHeight: 19, marginTop: 10 },
  limit: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  limitHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  limitName: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  limitValue: { color: colors.foreground, fontSize: 20, fontWeight: '900', marginTop: 2 },
  limitUsed: { color: colors.subtle, fontSize: 12.5, marginTop: 2 },
  limitPending: { color: colors.warning, fontSize: 12.5, marginTop: 4 },
  edit: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  paused: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningLine,
  },
  pausedText: { flex: 1, color: colors.foreground, fontSize: 13.5, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  confirm: { marginTop: 14, gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.dangerLine, backgroundColor: colors.dangerSoft },
  confirmText: { color: colors.foreground, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  help: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface2 },
  helpText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
}));
