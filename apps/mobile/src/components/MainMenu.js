import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  Share,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useBetSlip } from '../lib/betslip-context';
import { formatCOP } from '../lib/format';
import { estiloLiga } from '../lib/markets';
import { useMenu } from '../lib/menu-context';
import { makeStyles, useTheme } from '../theme';
import AccordionItem from './Accordion';
import Logo from './Logo';

const MODOS = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];
// Apertura: desacelera largo y suave (curva "expo out"), sin rebote.
// Cierre: entra y sale suave (ease-in-out), un poco más corto que la apertura
// para que el menú no se sienta pegajoso al irse.
const ABRIR = { duration: 460, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const CERRAR = { duration: 340, easing: Easing.bezier(0.65, 0, 0.35, 1) };

const WEB_PUBLICA = (process.env.EXPO_PUBLIC_WEB_URL || 'https://voktersport.com').replace(/\/+$/, '');

// Qué sección del menú corresponde a cada pantalla: esa se marca y se abre sola.
function seccionDe(pathname) {
  if (pathname.startsWith('/partido')) return 'partidos';
  if (pathname.startsWith('/apuestas') || pathname.startsWith('/boleto')) return 'apuestas';
  if (pathname.startsWith('/billetera')) return 'billetera';
  if (['/cuenta', '/juego-responsable', '/login', '/registro'].some((r) => pathname.startsWith(r))) return 'cuenta';
  if (pathname.startsWith('/ajustes') || pathname.startsWith('/terminos')) return 'app';
  return null;
}

/**
 * Menú principal: panel que entra por la izquierda con las secciones de la
 * app en acordeón (Partidos, Mis apuestas, Billetera, Cuenta y App). Solo una
 * sección abierta a la vez, para que el panel nunca sea una lista eterna.
 */
export default function MainMenu() {
  const styles = useStyles();
  const { colors, preference, setPreference } = useTheme();
  const { abierto, close } = useMenu();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, wallet, logout, refreshWallet } = useAuth();
  const slip = useBetSlip();

  const [visible, setVisible] = useState(false);
  const [seccion, setSeccion] = useState(null);
  const [ligas, setLigas] = useState([]);
  const t = useRef(new Animated.Value(0)).current;
  const panelAncho = Math.min(width * 0.9, 400);
  const actual = seccionDe(pathname);

  // Las ligas (con cuántos partidos en vivo tiene cada una) y el saldo se
  // refrescan en cada apertura.
  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch('/leagues');
      setLigas(data.items ?? []);
    } catch {
      // Sin conexión el menú sigue sirviendo con lo último que cargó.
    }
    refreshWallet();
  }, [refreshWallet]);

  const animacion = useRef(null);
  const animar = useCallback(
    (toValue, config, alTerminar) => {
      animacion.current?.stop();
      animacion.current = Animated.timing(t, { toValue, ...config, useNativeDriver: true });
      animacion.current.start(({ finished }) => finished && alTerminar?.());
    },
    [t],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (abierto) {
      setSeccion(actual);
      setVisible(true);
    } else if (visible) {
      animar(0, CERRAR, () => setVisible(false));
    }
    // `actual` y `visible` solo importan en el momento de abrir/cerrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // La animación de entrada arranca un cuadro después de montar el Modal.
  // Si arrancara en el mismo instante, los primeros cuadros se perderían
  // mientras el Modal se monta y el panel aparecería de golpe a medio camino.
  useEffect(() => {
    if (!visible || !abierto) return undefined;
    const id = requestAnimationFrame(() => animar(1, ABRIR, cargar));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Deslizar el panel hacia la izquierda lo cierra, siguiendo el dedo.
  const anchoRef = useRef(panelAncho);
  anchoRef.current = panelAncho;
  const cerrarRef = useRef(close);
  cerrarRef.current = close;
  const gesto = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderGrant: () => animacion.current?.stop(),
      onPanResponderMove: (_, g) => t.setValue(Math.max(0, Math.min(1, 1 + g.dx / anchoRef.current))),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -anchoRef.current * 0.3 || g.vx < -0.5) cerrarRef.current();
        else Animated.spring(t, { toValue: 1, speed: 18, bounciness: 0, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () =>
        Animated.spring(t, { toValue: 1, speed: 18, bounciness: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  const ir = (ruta) => {
    close();
    router.push(ruta);
  };
  const alInicio = () => {
    close();
    if (pathname !== '/') router.dismissTo('/');
  };
  const alternar = (clave) => setSeccion((s) => (s === clave ? null : clave));
  const compartir = () =>
    Share.share({
      message: `Fanáticos 360: Liga BetPlay, Copa BetPlay y fútbol internacional con cuotas en vivo. Descarga la app en ${WEB_PUBLICA}/download (solo mayores de 18).`,
    }).catch(() => {});

  if (!visible) return null;

  const enVivo = ligas.reduce((n, l) => n + (l.live ?? 0), 0);
  const proximos = ligas.reduce((n, l) => n + (l.upcoming ?? 0), 0);
  const iniciales = user?.name
    ?.split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Modal visible transparent statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.backdrop, { opacity: t }]}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Cerrar menú" />
      </Animated.View>

      <Animated.View
        {...gesto.panHandlers}
        style={[
          styles.panel,
          {
            width: panelAncho,
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom,
            transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-panelAncho, 0] }) }],
          },
        ]}
        accessibilityViewIsModal
      >
        <View style={styles.top}>
          <Pressable onPress={alInicio} hitSlop={6}>
            <Logo size="compact" />
          </Pressable>
          <Pressable onPress={close} hitSlop={8} style={styles.close} accessibilityLabel="Cerrar menú">
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          style={{
            opacity: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.5, 1] }),
            transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-36, 0] }) }],
          }}
        >
          {/* Saldo arriba, que es lo que más se consulta. */}
          {user && (
            <Pressable
              onPress={() => ir('/billetera')}
              style={({ pressed }) => [styles.balance, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceValue}>{formatCOP(wallet?.balanceCop ?? 0)}</Text>
              </View>
              <View style={styles.balanceBtn}>
                <Ionicons name="add" size={16} color={colors.accentForeground} />
                <Text style={styles.balanceBtnText}>Depositar</Text>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={alInicio}
            style={({ pressed }) => [styles.home, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={[styles.homeIcon, pathname === '/' && styles.homeIconOn]}>
              <Ionicons name="home-outline" size={18} color={pathname === '/' ? colors.accentForeground : colors.foreground} />
            </View>
            <Text style={styles.homeText}>Inicio</Text>
            {pathname === '/' && <Text style={styles.here}>Estás aquí</Text>}
          </Pressable>

          <View style={styles.divider} />

          {/* ---------- Partidos ---------- */}
          <AccordionItem
            icon="football-outline"
            title="Partidos"
            summary={enVivo > 0 ? `${enVivo} en vivo · ${proximos} próximos` : proximos ? `${proximos} próximos` : 'Calendario y cuotas'}
            expanded={seccion === 'partidos'}
            active={actual === 'partidos'}
            onToggle={() => alternar('partidos')}
          >
            <LinkRow icon="list-outline" label="Todos los partidos" onPress={() => ir('/partidos')} strong />
            <LinkRow
              icon="radio-outline"
              label="En vivo"
              meta={enVivo ? String(enVivo) : undefined}
              onPress={() => ir({ pathname: '/partidos', params: { status: 'live' } })}
            />
            {ligas.map((l) => {
              const e = estiloLiga(l, colors);
              return (
                <LinkRow
                  key={l.id}
                  icon={e.icon}
                  iconColor={e.fg}
                  label={l.name}
                  meta={l.upcoming ? String(l.upcoming) : undefined}
                  onPress={() => ir({ pathname: '/partidos', params: { league: String(l.id) } })}
                />
              );
            })}
            <LinkRow
              icon="checkmark-done-outline"
              label="Resultados"
              onPress={() => ir({ pathname: '/partidos', params: { status: 'finished' } })}
            />
          </AccordionItem>

          {/* ---------- Mis apuestas ---------- */}
          <AccordionItem
            icon="receipt-outline"
            title="Mis apuestas"
            summary={
              slip.count > 0
                ? `Boleto: ${slip.count} selección${slip.count === 1 ? '' : 'es'}`
                : user && wallet?.openBets
                  ? `${wallet.openBets} abierta${wallet.openBets === 1 ? '' : 's'}`
                  : 'Boleto e historial'
            }
            expanded={seccion === 'apuestas'}
            active={actual === 'apuestas'}
            onToggle={() => alternar('apuestas')}
          >
            <LinkRow
              icon="ticket-outline"
              label="Boleto actual"
              meta={slip.count ? String(slip.count) : undefined}
              onPress={() => ir('/boleto')}
              strong
            />
            <LinkRow icon="time-outline" label="Apuestas abiertas" onPress={() => ir({ pathname: '/apuestas', params: { status: 'open' } })} />
            <LinkRow icon="archive-outline" label="Historial" onPress={() => ir({ pathname: '/apuestas', params: { status: 'settled' } })} />
          </AccordionItem>

          {/* ---------- Billetera ---------- */}
          <AccordionItem
            icon="wallet-outline"
            title="Billetera"
            summary={user ? formatCOP(wallet?.balanceCop ?? 0) : 'Depósitos y retiros'}
            expanded={seccion === 'billetera'}
            active={actual === 'billetera'}
            onToggle={() => alternar('billetera')}
          >
            {user ? (
              <>
                <LinkRow icon="arrow-down-circle-outline" label="Depositar" onPress={() => ir({ pathname: '/billetera', params: { tab: 'depositar' } })} strong />
                <LinkRow icon="arrow-up-circle-outline" label="Retirar" onPress={() => ir({ pathname: '/billetera', params: { tab: 'retirar' } })} />
                <LinkRow icon="swap-vertical-outline" label="Movimientos" onPress={() => ir({ pathname: '/billetera', params: { tab: 'movimientos' } })} />
              </>
            ) : (
              <Text style={styles.note}>Inicia sesión para ver tu saldo, depositar y retirar.</Text>
            )}
          </AccordionItem>

          {/* ---------- Cuenta ---------- */}
          <AccordionItem
            icon="person-outline"
            title="Cuenta"
            summary={user ? user.name : 'Ingresa o regístrate'}
            expanded={seccion === 'cuenta'}
            active={actual === 'cuenta'}
            onToggle={() => alternar('cuenta')}
          >
            {user ? (
              <>
                <View style={styles.userCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{iniciales}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>
                <LinkRow icon="person-circle-outline" label="Mi cuenta" onPress={() => ir('/cuenta')} />
                <LinkRow icon="shield-checkmark-outline" label="Juego responsable" hint="Límites y autoexclusión" onPress={() => ir('/juego-responsable')} />
                <LinkRow
                  icon="log-out-outline"
                  label="Cerrar sesión"
                  danger
                  chevron={false}
                  onPress={async () => {
                    close();
                    await logout();
                  }}
                />
              </>
            ) : (
              <>
                <Text style={styles.note}>Tu cuenta guarda tus apuestas, tu saldo y tus límites de juego.</Text>
                <View style={styles.authRow}>
                  <Pressable onPress={() => ir('/login')} style={({ pressed }) => [styles.primary, styles.flex1, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.primaryText}>Iniciar</Text>
                  </Pressable>
                  <Pressable onPress={() => ir('/registro')} style={({ pressed }) => [styles.secondary, styles.flex1, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>Registrarse</Text>
                  </Pressable>
                </View>
                <LinkRow icon="shield-checkmark-outline" label="Juego responsable" onPress={() => ir('/juego-responsable')} />
              </>
            )}
          </AccordionItem>

          {/* ---------- App ---------- */}
          <AccordionItem
            icon="phone-portrait-outline"
            title="App"
            summary="Apariencia, conexión y términos"
            expanded={seccion === 'app'}
            active={actual === 'app'}
            onToggle={() => alternar('app')}
          >
            <Text style={styles.label}>Apariencia</Text>
            <View style={styles.segment}>
              {MODOS.map((m) => {
                const on = preference === m.value;
                return (
                  <Pressable
                    key={m.value}
                    onPress={() => setPreference(m.value)}
                    style={[styles.segmentItem, on && styles.segmentOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <LinkRow icon="server-outline" label="Conexión con el servidor" onPress={() => ir('/ajustes')} />
            <LinkRow icon="document-text-outline" label="Términos y condiciones" onPress={() => ir('/terminos')} />
            <LinkRow icon="share-social-outline" label="Compartir Fanáticos 360" onPress={compartir} chevron={false} />
          </AccordionItem>
        </Animated.ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.age}>
              <Text style={styles.ageText}>18+</Text>
            </View>
            <Text style={styles.footerText}>Juega con responsabilidad</Text>
          </View>
          <Text style={styles.footerVersion}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

/** Fila de enlace dentro de una sección. */
function LinkRow({ icon, iconColor, label, hint, meta, onPress, strong, danger, chevron = true }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tono = danger ? colors.danger : strong ? colors.foreground : colors.muted;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.link, pressed && styles.pressed]} accessibilityRole="button">
      <Ionicons
        name={icon}
        size={17}
        color={danger ? colors.danger : (iconColor ?? (strong ? colors.accent : colors.subtle))}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.linkText, { color: tono }, strong && { fontWeight: '700' }]} numberOfLines={1}>
          {label}
        </Text>
        {!!hint && <Text style={styles.linkHint}>{hint}</Text>}
      </View>
      {!!meta && (
        <View style={styles.meta}>
          <Text style={styles.metaText}>{meta}</Text>
        </View>
      )}
      {chevron && <Ionicons name="chevron-forward" size={15} color={colors.subtle} />}
    </Pressable>
  );
}

const absoluto = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

const useStyles = makeStyles((colors) => ({
  backdrop: { ...absoluto, backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  list: { padding: 10, paddingBottom: 24, gap: 4 },
  pressed: { backgroundColor: colors.surfaceHover },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accentLine,
    backgroundColor: colors.accentSoft,
  },
  balanceLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  balanceValue: { color: colors.foreground, fontSize: 21, fontWeight: '900', marginTop: 2, fontVariant: ['tabular-nums'] },
  balanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  balanceBtnText: { color: colors.accentForeground, fontSize: 13, fontWeight: '800' },
  home: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12, borderRadius: 18 },
  homeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  homeIconOn: { backgroundColor: colors.accent },
  homeText: { flex: 1, color: colors.foreground, fontSize: 15.5, fontWeight: '700' },
  here: { color: colors.subtle, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 12, marginVertical: 4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12 },
  linkText: { fontSize: 14.5 },
  linkHint: { color: colors.subtle, fontSize: 12, marginTop: 1 },
  meta: { minWidth: 24, paddingHorizontal: 7, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  metaText: { color: colors.muted, fontSize: 11.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingHorizontal: 10, paddingVertical: 6 },
  label: {
    color: colors.subtle,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  primary: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#e9b931',
  },
  primaryText: { color: '#1a1405', fontSize: 14.5, fontWeight: '800' },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  secondaryText: { color: colors.accent, fontSize: 14.5, fontWeight: '800' },
  authRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 6, marginBottom: 4 },
  flex1: { flex: 1 },
  segment: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    marginTop: 8,
    marginBottom: 6,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  segmentItem: { flex: 1, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  segmentTextOn: { color: colors.accentForeground },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  avatarText: { color: colors.accentForeground, fontSize: 15, fontWeight: '800' },
  userName: { color: colors.foreground, fontSize: 14.5, fontWeight: '700' },
  userEmail: { color: colors.muted, fontSize: 12.5, marginTop: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  age: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  ageText: { color: colors.danger, fontSize: 10.5, fontWeight: '900' },
  footerText: { color: colors.subtle, fontSize: 12 },
  footerVersion: { color: colors.subtle, fontSize: 11.5, fontFamily: 'monospace' },
}));
