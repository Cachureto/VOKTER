/**
 * Piezas pequeñas que se repiten en toda la app: botón dorado, botón de
 * contorno, pastillas de estado, selector segmentado y estado vacío.
 */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { movimientoReducido, RESORTES } from '../lib/motion';
import { DORADO } from '../theme/colors';
import Tap from './Tap';
import { makeStyles, useTheme } from '../theme';

/** El botón dorado de la plantilla ("Iniciar", "Ingresar"). */
export function GoldButton({ label, onPress, icon, loading, disabled, style, size = 'md' }) {
  const styles = useStyles();
  const apagado = disabled || loading;
  return (
    <Tap
      onPress={onPress}
      disabled={apagado}
      accessibilityRole="button"
      scaleTo={0.96}
      style={[styles.gold, size === 'sm' && styles.goldSm, apagado && { opacity: 0.55 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={DORADO.texto} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={DORADO.texto} />}
          <Text style={[styles.goldText, size === 'sm' && styles.goldTextSm]}>{label}</Text>
        </>
      )}
    </Tap>
  );
}

/** El botón de contorno dorado ("Registrarse"). */
export function OutlineButton({ label, onPress, icon, style, tone = 'accent', disabled }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : tone === 'neutral' ? colors.foreground : colors.accent;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      scaleTo={0.96}
      style={({ pressed }) => [
        styles.outline,
        { borderColor: tone === 'neutral' ? colors.borderStrong : color },
        pressed && { backgroundColor: colors.surfaceHover },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={17} color={color} />}
      <Text style={[styles.outlineText, { color }]}>{label}</Text>
    </Tap>
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

/**
 * Selector de pestañas: [{ value, label }]. La pastilla dorada se desliza
 * hasta la opción elegida en vez de saltar.
 */
export function Segmented({ options, value, onChange, style }) {
  const styles = useStyles();
  const [ancho, setAncho] = useState(0);
  const indice = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const x = useRef(new Animated.Value(indice)).current;

  useEffect(() => {
    if (movimientoReducido()) x.setValue(indice);
    else Animated.spring(x, { toValue: indice, ...RESORTES.deslizar, useNativeDriver: true }).start();
  }, [indice, x]);

  // 4 de padding a cada lado y 4 de separación entre opciones.
  const anchoItem = ancho ? (ancho - 8 - 4 * (options.length - 1)) / options.length : 0;

  return (
    <View style={[styles.segment, style]} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {anchoItem > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.segmentPill,
            {
              width: anchoItem,
              transform: [
                {
                  translateX: x.interpolate({
                    inputRange: [0, Math.max(1, options.length - 1)],
                    outputRange: [0, Math.max(1, options.length - 1) * (anchoItem + 4)],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={styles.segmentItem}
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
          <GoldButton
            label="Iniciar"
            onPress={() => router.push({ pathname: '/login', params: next ? { next } : {} })}
            style={{ flex: 1 }}
          />
          <OutlineButton
            label="Registrarse"
            onPress={() => router.push({ pathname: '/registro', params: next ? { next } : {} })}
            style={{ flex: 1 }}
          />
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
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: DORADO.fondo,
    shadowColor: DORADO.fondo,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  goldSm: { height: 40, borderRadius: 12, paddingHorizontal: 14 },
  goldText: { color: DORADO.texto, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.1 },
  goldTextSm: { fontSize: 14 },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  outlineText: { fontSize: 15, fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  segment: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentPill: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 10, backgroundColor: colors.accent },
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
