import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch, resolveImage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { categoryIcon, faltaPara } from '../lib/categories';
import { formatCOP } from '../lib/format';
import { useMenu } from '../lib/menu-context';
import { makeStyles, useTheme } from '../theme';
import AccordionItem from './Accordion';
import Logo from './Logo';

const SUGERENCIAS = ['Power bank para viajar', 'Cargador rápido bajo $100.000', 'Algo para jugar en la TV'];
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

const WEB_PUBLICA = (process.env.EXPO_PUBLIC_WEB_URL || 'https://nova-web-vokter.vercel.app').replace(/\/+$/, '');

// Qué sección del menú corresponde a cada pantalla: esa se marca y se abre sola.
function seccionDe(pathname) {
  if (pathname.startsWith('/catalogo') || pathname.startsWith('/product')) return 'catalogo';
  if (pathname.startsWith('/drops')) return 'drops';
  if (pathname.startsWith('/asistente')) return 'ia';
  if (pathname.startsWith('/escaner') || pathname.startsWith('/ajustes')) return 'app';
  if (pathname.startsWith('/carrito')) return 'carrito';
  if (['/cuenta', '/pedidos', '/login', '/registro'].some((r) => pathname.startsWith(r))) return 'cuenta';
  return null;
}

/**
 * Menú principal: panel que entra por la izquierda con las secciones del encabezado de la web
 * (Catálogo, Drops, Asistente IA, App, Carrito y Cuenta) en acordeón.
 * Solo una sección abierta a la vez, para que el panel nunca se vuelva una
 * lista interminable.
 */
export default function MainMenu() {
  const styles = useStyles();
  const { colors, preference, setPreference } = useTheme();
  const { abierto, close } = useMenu();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, isAdmin, logout } = useAuth();
  const { items, count, subtotalCents } = useCart();

  const [visible, setVisible] = useState(false);
  const [seccion, setSeccion] = useState(null);
  const [datos, setDatos] = useState({ categorias: [], total: null, drop: null });
  const t = useRef(new Animated.Value(0)).current;
  const panelAncho = Math.min(width * 0.9, 400);
  const actual = seccionDe(pathname);

  // Categorías y próximo drop: se piden al abrir el menú (y se refrescan en
  // cada apertura), no al arrancar la app.
  const cargar = useCallback(async () => {
    const [cats, drops] = await Promise.allSettled([apiFetch('/api/categories'), apiFetch('/api/drops')]);
    setDatos((prev) => {
      const categorias =
        cats.status === 'fulfilled'
          ? (cats.value?.items ?? [])
              .filter((c) => c.productCount > 0)
              .sort((a, b) => b.productCount - a.productCount)
          : prev.categorias;
      const lista = drops.status === 'fulfilled' ? (Array.isArray(drops.value) ? drops.value : drops.value?.items ?? []) : [];
      const activos = lista
        .filter((d) => ['live', 'scheduled'].includes(d.status))
        .sort((a, b) => new Date(a.launchAt) - new Date(b.launchAt));
      return {
        categorias,
        total: categorias.length ? categorias.reduce((n, c) => n + c.productCount, 0) : prev.total,
        drop: activos.find((d) => d.status === 'live') ?? activos[0] ?? (drops.status === 'fulfilled' ? null : prev.drop),
      };
    });
  }, []);

  const animacion = useRef(null);
  const animar = useCallback(
    (toValue, config, alTerminar) => {
      animacion.current?.stop();
      animacion.current = Animated.timing(t, { toValue, ...config, useNativeDriver: true });
      animacion.current.start(({ finished }) => finished && alTerminar?.());
    },
    [t],
  );

  // Los datos se piden una vez al arrancar, para que la primera apertura ya
  // los muestre, y se refrescan después de cada apertura.
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
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
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
      message: `Vokter: tecnología urbana con autenticidad verificada. Descarga la app en ${WEB_PUBLICA}/download`,
    }).catch(() => {});

  if (!visible) return null;

  const drop = datos.drop;
  const dropEnVivo = drop?.status === 'live';
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
            <Logo height={20} />
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
          {/* Inicio no tiene nada que desplegar: es un enlace directo. */}
          <Pressable
            onPress={alInicio}
            style={({ pressed }) => [styles.home, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={[styles.homeIcon, pathname === '/' && styles.homeIconOn]}>
              <Ionicons name="home-outline" size={18} color={pathname === '/' ? colors.contrastForeground : colors.foreground} />
            </View>
            <Text style={styles.homeText}>Inicio</Text>
            {pathname === '/' && <Text style={styles.here}>Estás aquí</Text>}
          </Pressable>

          <View style={styles.divider} />

          {/* ---------- Catálogo ---------- */}
          <AccordionItem
            icon="grid-outline"
            title="Catálogo"
            summary={datos.total ? `${datos.total} productos verificados` : 'Todo lo que hay en Vokter'}
            expanded={seccion === 'catalogo'}
            active={actual === 'catalogo'}
            onToggle={() => alternar('catalogo')}
          >
            <LinkRow icon="apps-outline" label="Ver todo el catálogo" onPress={() => ir('/catalogo')} strong />
            {datos.categorias.slice(0, 8).map((c) => (
              <LinkRow
                key={c.slug}
                icon={categoryIcon(c)}
                label={c.name}
                meta={String(c.productCount)}
                onPress={() => ir({ pathname: '/catalogo', params: { category: c.slug } })}
              />
            ))}
          </AccordionItem>

          {/* ---------- Drops ---------- */}
          <AccordionItem
            icon="flash-outline"
            title="Drops"
            summary={drop ? (dropEnVivo ? `En vivo: ${drop.name}` : `Próximo: ${drop.name}`) : 'Lanzamientos limitados'}
            expanded={seccion === 'drops'}
            active={actual === 'drops'}
            onToggle={() => alternar('drops')}
          >
            {drop ? (
              <Pressable onPress={() => ir('/drops')} style={({ pressed }) => [styles.dropCard, pressed && styles.pressed]}>
                {resolveImage(drop.coverUrl) ? (
                  <Image source={{ uri: resolveImage(drop.coverUrl) }} style={styles.dropCover} />
                ) : (
                  <View style={[styles.dropCover, styles.dropCoverEmpty]}>
                    <Ionicons name="flash" size={20} color={colors.accent} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={[styles.pill, dropEnVivo ? styles.pillLive : styles.pillAccent]}>
                    <Text style={[styles.pillText, { color: dropEnVivo ? colors.live : colors.accent }]}>
                      {dropEnVivo ? '● En vivo' : 'Próximo drop'}
                    </Text>
                  </View>
                  <Text style={styles.dropName} numberOfLines={1}>
                    {drop.name}
                  </Text>
                  <Text style={styles.dropMeta} numberOfLines={1}>
                    {[!dropEnVivo && faltaPara(drop.launchAt), `${drop.waitlistCount ?? 0} en espera`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Text style={styles.note}>No hay drops programados por ahora.</Text>
            )}
            <LinkRow icon="calendar-outline" label="Calendario de drops" onPress={() => ir('/drops')} strong />
          </AccordionItem>

          {/* ---------- Asistente IA ---------- */}
          <AccordionItem
            icon="sparkles-outline"
            title="Asistente IA"
            summary="Busca con tus palabras"
            expanded={seccion === 'ia'}
            active={actual === 'ia'}
            onToggle={() => alternar('ia')}
          >
            <Text style={styles.note}>
              Describe lo que necesitas y tu presupuesto. Solo responde con productos, precios y stock reales.
            </Text>
            <View style={styles.chips}>
              {SUGERENCIAS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => ir({ pathname: '/asistente', params: { q: s } })}
                  style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => ir('/asistente')}
              style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="sparkles" size={16} color={colors.accentForeground} />
              <Text style={styles.primaryText}>Abrir el asistente</Text>
            </Pressable>
          </AccordionItem>

          {/* ---------- App ---------- */}
          <AccordionItem
            icon="phone-portrait-outline"
            title="App"
            summary="Escáner, apariencia y conexión"
            expanded={seccion === 'app'}
            active={actual === 'app'}
            onToggle={() => alternar('app')}
          >
            <LinkRow
              icon="qr-code-outline"
              label="Verificar autenticidad"
              hint="Escanea el QR del producto"
              onPress={() => ir('/escaner')}
            />
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
            <LinkRow icon="share-social-outline" label="Compartir Vokter" onPress={compartir} chevron={false} />
          </AccordionItem>

          {/* ---------- Carrito ---------- */}
          <AccordionItem
            icon="bag-outline"
            title="Carrito"
            summary={count > 0 ? `${count} producto${count === 1 ? '' : 's'} · ${formatCOP(subtotalCents)}` : 'Vacío'}
            expanded={seccion === 'carrito'}
            active={actual === 'carrito'}
            onToggle={() => alternar('carrito')}
          >
            {count === 0 ? (
              <>
                <Text style={styles.note}>Tu carrito está vacío. Agrega productos desde el catálogo.</Text>
                <LinkRow icon="grid-outline" label="Ir al catálogo" onPress={() => ir('/catalogo')} strong />
              </>
            ) : (
              <>
                {items.slice(0, 3).map((item) => (
                  <View key={item.productId} style={styles.cartLine}>
                    {resolveImage(item.coverUrl) ? (
                      <Image source={{ uri: resolveImage(item.coverUrl) }} style={styles.cartThumb} />
                    ) : (
                      <View style={styles.cartThumb} />
                    )}
                    <Text style={styles.cartName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartQty}>×{item.quantity}</Text>
                  </View>
                ))}
                {items.length > 3 && <Text style={styles.note}>y {items.length - 3} más</Text>}
                <View style={styles.subtotal}>
                  <Text style={styles.label}>Subtotal</Text>
                  <Text style={styles.subtotalValue}>{formatCOP(subtotalCents)}</Text>
                </View>
                <Pressable
                  onPress={() => ir('/carrito')}
                  style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.primaryText}>Ver carrito y pagar</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.accentForeground} />
                </Pressable>
              </>
            )}
          </AccordionItem>

          {/* ---------- Cuenta ---------- */}
          <AccordionItem
            icon="person-outline"
            title="Cuenta"
            summary={user ? user.name : 'Entra o crea tu cuenta'}
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
                  {isAdmin && (
                    <View style={[styles.pill, styles.pillAccent]}>
                      <Text style={[styles.pillText, { color: colors.accent }]}>Admin</Text>
                    </View>
                  )}
                </View>
                <LinkRow icon="person-circle-outline" label="Mi cuenta" onPress={() => ir('/cuenta')} />
                <LinkRow icon="cube-outline" label="Mis pedidos" onPress={() => ir('/pedidos')} />
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
                <Text style={styles.note}>
                  La misma cuenta de la web: pedidos, reseñas y validaciones en un solo lugar.
                </Text>
                <View style={styles.authRow}>
                  <Pressable
                    onPress={() => ir('/login')}
                    style={({ pressed }) => [styles.primary, styles.flex1, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={styles.primaryText}>Entrar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => ir('/registro')}
                    style={({ pressed }) => [styles.secondary, styles.flex1, pressed && styles.pressed]}
                  >
                    <Text style={styles.secondaryText}>Crear cuenta</Text>
                  </Pressable>
                </View>
              </>
            )}
          </AccordionItem>
        </Animated.ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Original o no es Vokter.</Text>
          <Text style={styles.footerVersion}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

/** Fila de enlace dentro de una sección. */
function LinkRow({ icon, label, hint, meta, onPress, strong, danger, chevron = true }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tono = danger ? colors.danger : strong ? colors.foreground : colors.muted;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.link, pressed && styles.pressed]} accessibilityRole="button">
      <Ionicons name={icon} size={17} color={danger ? colors.danger : strong ? colors.accent : colors.subtle} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.linkText, { color: tono }, strong && { fontWeight: '600' }]} numberOfLines={1}>
          {label}
        </Text>
        {!!hint && <Text style={styles.linkHint}>{hint}</Text>}
      </View>
      {!!meta && <Text style={styles.linkMeta}>{meta}</Text>}
      {chevron && <Ionicons name="chevron-forward" size={15} color={colors.subtle} />}
    </Pressable>
  );
}

const absoluto = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

const useStyles = makeStyles((colors) => ({
  backdrop: { ...absoluto, backgroundColor: 'rgba(0,0,0,0.55)' },
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
  home: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12, borderRadius: 18 },
  homeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  homeIconOn: { backgroundColor: colors.contrast },
  homeText: { flex: 1, color: colors.foreground, fontSize: 15.5, fontWeight: '700' },
  here: { color: colors.subtle, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 12, marginVertical: 4 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  linkText: { fontSize: 14.5 },
  linkHint: { color: colors.subtle, fontSize: 12, marginTop: 1 },
  linkMeta: { color: colors.subtle, fontSize: 12, fontFamily: 'monospace' },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingHorizontal: 10, paddingVertical: 6 },
  label: {
    color: colors.subtle,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipText: { color: colors.muted, fontSize: 12.5 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    marginTop: 12,
    marginHorizontal: 6,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  primaryText: { color: colors.accentForeground, fontSize: 14.5, fontWeight: '700' },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryText: { color: colors.foreground, fontSize: 14.5, fontWeight: '600' },
  authRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 6 },
  flex1: { flex: 1, marginHorizontal: 0 },
  segment: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    marginTop: 8,
    marginBottom: 6,
    marginHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  segmentItem: { flex: 1, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.contrast },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  segmentTextOn: { color: colors.contrastForeground },
  dropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    marginHorizontal: 2,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  dropCover: { width: 58, height: 58, borderRadius: 10, backgroundColor: colors.tile },
  dropCoverEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  dropName: { color: colors.foreground, fontSize: 14.5, fontWeight: '700', marginTop: 5 },
  dropMeta: { color: colors.subtle, fontSize: 12, marginTop: 2 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  pillLive: { borderColor: colors.liveLine, backgroundColor: colors.liveSoft },
  pillAccent: { borderColor: colors.accentLine, backgroundColor: colors.accentSoft },
  pillText: { fontSize: 10.5, fontWeight: '700' },
  cartLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 6 },
  cartThumb: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.tile },
  cartName: { flex: 1, color: colors.foreground, fontSize: 13.5 },
  cartQty: { color: colors.subtle, fontSize: 12.5, fontFamily: 'monospace' },
  subtotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subtotalValue: { color: colors.foreground, fontSize: 16, fontWeight: '800' },
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  avatarText: { color: colors.accentForeground, fontSize: 15, fontWeight: '800' },
  userName: { color: colors.foreground, fontSize: 14.5, fontWeight: '700' },
  userEmail: { color: colors.muted, fontSize: 12.5, marginTop: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { color: colors.subtle, fontSize: 12 },
  footerVersion: { color: colors.subtle, fontSize: 11.5, fontFamily: 'monospace' },
}));

