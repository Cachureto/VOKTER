/**
 * Piezas pequeñas que se repiten en toda la app: botón dorado, botón de
 * contorno, pastillas de estado, selector segmentado y estado vacío.
 */
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DORADO } from '../theme/colors';
import { makeStyles, useTheme } from '../theme';

/** El botón dorado de la plantilla ("Iniciar", "Ingresar"). */
export function GoldButton({ label, onPress, icon, loading, disabled, style, size = 'md' }) {
  const styles = useStyles();
  const apagado = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={apagado}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.gold,
        size === 'sm' && styles.goldSm,
        apagado && { opacity: 0.55 },
        pressed && styles.pressed,
        style,
      ]}
    >
      {/* Media capa clara arriba: imita el degradado de la plantilla sin
          sumar una dependencia nativa nueva. */}
      <View style={styles.goldShine} pointerEvents="none" />
      {loading ? (
        <ActivityIndicator color={DORADO.texto} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={DORADO.texto} />}
          <Text style={[styles.goldText, size === 'sm' && styles.goldTextSm]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** El botón de contorno dorado ("Registrarse"). */
export function OutlineButton({ label, onPress, icon, style, tone = 'accent', disabled }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : tone === 'neutral' ? colors.foreground : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.outline,
        { borderColor: tone === 'neutral' ? colors.borderStrong : color },
        disabled && { opacity: 0.5 },
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={17} color={color} />}
      <Text style={[styles.outlineText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const TONOS = {
  accent: ['accent', 'accentSoft', 'accentLine'],
  live: ['live', 'liveSoft', 'liveLine'],
  danger: ['danger', 'dangerSoft', 'dangerLine'],
  warning: ['warning', 'warningSoft', 'warningLine'],
  muted: ['muted', 'surface2', 'border'],
};

export function Pill({ label, tone = 'accent', icon, style }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [fg, bg, line] = TONOS[tone].map((k) => colors[k]);
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: line }, style]}>
      {icon && <Ionicons name={icon} size={11} color={fg} />}
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** Selector de pestañas: [{ value, label }]. */
export function Segmented({ options, value, onChange, style }) {
  const styles = useStyles();
  return (
    <View style={[styles.segment, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, on && styles.segmentOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.segmentText, on && styles.segmentTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon = 'football-outline', title, text, action }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!text && <Text style={styles.emptyText}>{text}</Text>}
      {action}
    </View>
  );
}

/** Aviso de error con botón de reintentar. */
export function ErrorNotice({ message, onRetry }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.error}>
      <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={styles.errorLink}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Pantallas que necesitan sesión: invitación a entrar o registrarse. */
export function LoginRequired({ next, title = 'Inicia sesión', text }) {
  const router = useRouter();
  return (
    <EmptyState
      icon="person-circle-outline"
      title={title}
      text={text}
      action={
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, alignSelf: 'stretch' }}>
          <GoldButton label="Iniciar" onPress={() => router.push({ pathname: '/login', params: next ? { next } : {} })} style={{ flex: 1 }} />
          <OutlineButton label="Registrarse" onPress={() => router.push({ pathname: '/registro', params: next ? { next } : {} })} style={{ flex: 1 }} />
        </View>
      }
    />
  );
}

const useStyles = makeStyles((colors) => ({
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  gold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: DORADO.fondo,
    overflow: 'hidden',
    shadowColor: DORADO.fondo,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  goldSm: { height: 44, borderRadius: 14, paddingHorizontal: 16 },
  goldShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: DORADO.brillo,
    opacity: 0.35,
  },
  goldText: { color: DORADO.texto, fontSize: 17, fontWeight: '800' },
  goldTextSm: { fontSize: 15 },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  outlineText: { fontSize: 16.5, fontWeight: '800' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: { fontSize: 12, fontWeight: '800' },
  segment: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentOn: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  segmentTextOn: { color: colors.accentForeground },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 20 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  error: {
    alignItems: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dangerLine,
    backgroundColor: colors.dangerSoft,
  },
  errorText: { color: colors.foreground, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorLink: { color: colors.accent, fontSize: 14, fontWeight: '800' },
}));
