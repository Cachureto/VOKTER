import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Countdown from '../src/components/Countdown';
import Counter from '../src/components/Counter';
import FadeIn from '../src/components/FadeIn';
import HeaderActions, { MenuButton } from '../src/components/HeaderActions';
import HeroShowcase from '../src/components/HeroShowcase';
import Logo from '../src/components/Logo';
import Marquee from '../src/components/Marquee';
import ProductCard from '../src/components/ProductCard';
import SectionHeading from '../src/components/SectionHeading';
import { apiFetch, resolveImage } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { categoryIcon } from '../src/lib/categories';
import { formatCOP, formatDate } from '../src/lib/format';
import { makeStyles, useTheme } from '../src/theme';

const PADDING = 20;

// Mismos textos que la web (apps/web/components/Navbar.jsx y app/page.js).
const ANUNCIOS = [
  'Cada producto con código de autenticidad verificable',
  'Envíos a toda Colombia',
  'Asistente de IA que solo responde con el catálogo real',
  'Drops con lista de espera y aviso al móvil',
];
const TRUST = [
  { icon: 'shield-checkmark-outline', title: 'Autenticidad verificada', text: 'Código VKT único por producto' },
  { icon: 'sparkles-outline', title: 'Asistente con IA', text: 'Solo recomienda stock real' },
  { icon: 'calendar-outline', title: 'Drops exclusivos', text: 'Lista de espera y alertas' },
  { icon: 'car-outline', title: 'Envíos nacionales', text: 'Sigue tu pedido en tu cuenta' },
];
const TICKER = [
  'Autenticidad verificada',
  'Sneakers',
  'Audio',
  'Ropa urbana',
  'Accesorios',
  'Drops limitados',
  'Hogar',
  'Envíos a toda Colombia',
];
const AI_SUGGESTIONS = ['Power bank para viajar', 'Algo para jugar en la TV', 'Soporte de celular para la moto'];

/**
 * Inicio de la app: la misma página principal de la web, adaptada a una
 * columna. Antes la app abría directo en el catálogo; ahora el catálogo vive
 * en /catalogo y aquí se presenta la tienda.
 */
export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pregunta, setPregunta] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [productos, drops, categorias] = await Promise.all([
        apiFetch('/api/products?limit=8'),
        apiFetch('/api/drops'),
        apiFetch('/api/categories'),
      ]);
      const lista = Array.isArray(drops) ? drops : (drops?.items ?? []);
      const activos = lista
        .filter((d) => ['live', 'scheduled'].includes(d.status))
        .sort((a, b) => new Date(a.launchAt) - new Date(b.launchAt));
      setData({
        products: productos.items ?? [],
        total: productos.total ?? 0,
        categories: (categorias?.items ?? [])
          .filter((c) => c.productCount > 0)
          .sort((a, b) => b.productCount - a.productCount),
        liveDrop: activos.find((d) => d.status === 'live') ?? null,
        nextDrop: activos.find((d) => d.status === 'scheduled') ?? null,
        activeDrops: activos.length,
      });
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const preguntar = (texto) => {
    const q = (texto ?? pregunta).trim();
    if (q.length < 2) return;
    setPregunta('');
    router.push({ pathname: '/asistente', params: { q } });
  };

  const products = data?.products ?? [];
  const spotlight = data?.liveDrop ?? data?.nextDrop;
  const tileWidth = (width - PADDING * 2 - 12) / 2;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* 0 · Barra de anuncios (se va con el scroll, como en la web) */}
        <Marquee style={styles.announce}>
          {ANUNCIOS.map((texto) => (
            <View key={texto} style={styles.announceItem}>
              <Ionicons name="shield-checkmark" size={12} color={colors.live} />
              <Text style={styles.announceText}>{texto}</Text>
              <Text style={styles.announceSep}>/</Text>
            </View>
          ))}
        </Marquee>

        {/* 1 · Encabezado fijo. Va envuelto en un View sin estilos a propósito:
            en Android, ScrollView mueve el `style` del hijo fijo a un contenedor
            propio y al hijo le deja solo `flex: 1`, con lo que la fila se
            volvía columna y los botones caían debajo del logo. */}
        <View>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MenuButton bordered />
              <Logo height={20} />
            </View>
            <HeaderActions bordered />
          </View>
        </View>

        {/* ================= HERO ================= */}
        <View style={styles.hero}>
          <FadeIn>
            {user && <Text style={styles.hello}>Hola, {user.name.split(/\s+/)[0]}</Text>}
            {data?.liveDrop ? (
              <Pressable onPress={() => router.push('/drops')} style={[styles.pill, styles.pillLive]}>
                <LiveDot />
                <Text style={[styles.pillText, { color: colors.live }]} numberOfLines={1}>
                  Drop en vivo: {data.liveDrop.name}
                </Text>
                <Ionicons name="arrow-forward" size={12} color={colors.live} />
              </Pressable>
            ) : (
              <View style={[styles.pill, styles.pillAccent]}>
                <Ionicons name="sparkles" size={12} color={colors.accent} />
                <Text style={[styles.pillText, { color: colors.accent }]}>Autenticidad · IA · Drops</Text>
              </View>
            )}

            <Text style={styles.display}>
              Original{'\n'}o no es <Text style={{ color: colors.accent }}>Vokter.</Text>
            </Text>
            <Text style={styles.lead}>
              Tecnología urbana, accesorios y hogar con un código de autenticidad único en cada producto. Encuentra lo
              que buscas con el asistente de IA y entérate antes que nadie de los próximos drops.
            </Text>

            <View style={styles.ctas}>
              <Pressable
                onPress={() => router.push('/catalogo')}
                style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnPrimaryText}>Explorar catálogo</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.accentForeground} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/asistente')}
                style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
              >
                <Ionicons name="sparkles" size={16} color={colors.accent} />
                <Text style={styles.btnSecondaryText}>Pregúntale a la IA</Text>
              </Pressable>
            </View>
          </FadeIn>

          {/* Cifras que cuentan desde cero */}
          <View style={styles.stats}>
            <Stat label="Productos" value={data?.total} first />
            <Stat label="Con código" value={data ? 100 : null} suffix="%" middle />
            <Stat label="Drops activos" value={data?.activeDrops} />
          </View>

          {status === 'loading' && <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
          {status === 'error' && (
            <View style={styles.errorCard}>
              <Ionicons name="cloud-offline-outline" size={26} color={colors.danger} />
              <Text style={styles.errorTitle}>Sin conexión con la tienda</Text>
              <Text style={styles.errorText}>{error}</Text>
              <View style={styles.errorActions}>
                <Pressable onPress={load} style={styles.btnSmall}>
                  <Text style={styles.btnPrimaryText}>Reintentar</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/ajustes')} hitSlop={8}>
                  <Text style={styles.link}>Revisar conexión</Text>
                </Pressable>
              </View>
            </View>
          )}
          {status === 'ready' && <HeroShowcase products={products} />}
        </View>

        {/* ================= FRANJA DE CONFIANZA ================= */}
        <View style={styles.trust}>
          {TRUST.map((item, i) => (
            <FadeIn key={item.title} delay={i * 70} style={styles.trustItem}>
              <View style={styles.trustIcon}>
                <Ionicons name={item.icon} size={19} color={colors.accent} />
              </View>
              <Text style={styles.trustTitle}>{item.title}</Text>
              <Text style={styles.trustText}>{item.text}</Text>
            </FadeIn>
          ))}
        </View>

        {/* ================= TICKER ================= */}
        <Marquee speed={46} style={styles.ticker}>
          {TICKER.map((palabra) => (
            <View key={palabra} style={styles.tickerItem}>
              <Text style={styles.tickerText}>{palabra}</Text>
              <View style={styles.tickerDot} />
            </View>
          ))}
        </Marquee>

        {status === 'ready' && (
          <>
            {/* ================= CATEGORÍAS ================= */}
            {data.categories.length > 0 && (
              <View style={styles.section}>
                <SectionHeading
                  eyebrow="01 — Categorías"
                  title="Explora por categoría"
                  description="Todo el catálogo organizado para que llegues directo a lo que necesitas."
                  linkLabel="Catálogo"
                  onLink={() => router.push('/catalogo')}
                />
                <View style={styles.catGrid}>
                  {data.categories.slice(0, 6).map((c, i) => (
                    <FadeIn key={c.slug} delay={i * 60}>
                      <Pressable
                        onPress={() => router.push({ pathname: '/catalogo', params: { category: c.slug } })}
                        style={({ pressed }) => [styles.catTile, { width: tileWidth }, pressed && { opacity: 0.85 }]}
                      >
                        {resolveImage(c.coverUrl) && (
                          <Image source={{ uri: resolveImage(c.coverUrl) }} style={styles.catImage} />
                        )}
                        <View style={styles.catShade} />
                        <View style={styles.catIcon}>
                          <Ionicons name={categoryIcon(c)} size={17} color={colors.accentBright} />
                        </View>
                        <View style={styles.catFoot}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.catName} numberOfLines={2}>
                              {c.name}
                            </Text>
                            <Text style={styles.catCount}>
                              {c.productCount} producto{c.productCount === 1 ? '' : 's'}
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.75)" />
                        </View>
                      </Pressable>
                    </FadeIn>
                  ))}
                </View>
              </View>
            )}

            {/* ================= RECIÉN LLEGADOS ================= */}
            {products.length > 0 && (
              <View style={styles.section}>
                <SectionHeading
                  eyebrow="02 — Recién llegados"
                  title="Lo último en Vokter"
                  description="Cada uno con su certificado de autenticidad listo para validar."
                  onLink={() => router.push('/catalogo')}
                />
                <FlatList
                  horizontal
                  data={products}
                  keyExtractor={(p) => p.id}
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -PADDING }}
                  contentContainerStyle={{ paddingHorizontal: PADDING, gap: 12 }}
                  snapToInterval={tileWidth * 0.92 + 12}
                  decelerationRate="fast"
                  renderItem={({ item, index }) => (
                    <FadeIn delay={Math.min(index, 3) * 70}>
                      <ProductCard product={item} width={tileWidth * 0.92} />
                    </FadeIn>
                  )}
                />
              </View>
            )}

            {/* ================= POR QUÉ VOKTER ================= */}
            <View style={styles.section}>
              <SectionHeading eyebrow="03 — Por qué Vokter" title="Tres razones para comprar sin dudas" />

              <FadeIn style={styles.card}>
                <Text style={styles.cardNum}>01</Text>
                <Text style={styles.cardTitle}>Autenticidad verificada</Text>
                <Text style={styles.cardText}>
                  Cada producto trae un código único. Escanéalo con la app para confirmar que es original y está activo.
                </Text>
                <View style={styles.mock}>
                  <View style={styles.mockRow}>
                    <Text style={styles.mockCode} numberOfLines={1}>
                      {products[0]?.authenticityCode ?? 'VKT-XXXXXXXX'}
                    </Text>
                    <Pressable onPress={() => router.push('/escaner')} style={styles.mockBtn}>
                      <Text style={styles.mockBtnText}>Validar</Text>
                    </Pressable>
                  </View>
                  <View style={styles.mockOk}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.live} />
                    <Text style={styles.mockOkText}>Código auténtico y activo</Text>
                  </View>
                </View>
              </FadeIn>

              <FadeIn style={styles.card}>
                <Text style={styles.cardNum}>02</Text>
                <Text style={styles.cardTitle}>Asistente de compras IA</Text>
                <Text style={styles.cardText}>
                  Escribe lo que necesitas en tus palabras. La IA solo consulta el catálogo real: nunca inventa
                  productos, precios ni stock.
                </Text>
                <View style={styles.chat}>
                  <Text style={styles.bubbleUser}>Busco un power bank para viajar</Text>
                  <Text style={styles.bubbleBot}>
                    Encontré opciones con stock real.
                    {products[0] ? (
                      <Text style={{ color: colors.foreground }}>
                        {' '}
                        {products[0].name} · {formatCOP(products[0].priceCents)}
                      </Text>
                    ) : null}
                  </Text>
                </View>
              </FadeIn>

              <FadeIn style={styles.card}>
                <Text style={styles.cardNum}>03</Text>
                <Text style={styles.cardTitle}>Drops con lista de espera</Text>
                <Text style={styles.cardText}>
                  Lanzamientos limitados con cupos. Únete a la lista de espera y recibe la alerta en tu celular cuando
                  abran.
                </Text>
                {data.nextDrop ? (
                  <Pressable onPress={() => router.push('/drops')} style={styles.mock}>
                    <View style={styles.mockDropHead}>
                      <Text style={styles.mockDropName} numberOfLines={1}>
                        {data.nextDrop.name}
                      </Text>
                      <View style={styles.badgeSmall}>
                        <Ionicons name="notifications-outline" size={11} color={colors.muted} />
                        <Text style={styles.badgeSmallText}>{data.nextDrop.waitlistCount ?? 0}</Text>
                      </View>
                    </View>
                    <Countdown target={data.nextDrop.launchAt} />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => router.push('/drops')} style={[styles.btnSecondary, { marginTop: 18 }]}>
                    <Text style={styles.btnSecondaryText}>Ver calendario de drops</Text>
                  </Pressable>
                )}
              </FadeIn>
            </View>

            {/* ================= DROP DESTACADO ================= */}
            {spotlight && (
              <View style={styles.section}>
                <FadeIn style={styles.spot}>
                  <View style={styles.spotCover}>
                    {resolveImage(spotlight.coverUrl) ? (
                      <Image source={{ uri: resolveImage(spotlight.coverUrl) }} style={styles.fill} resizeMode="cover" />
                    ) : (
                      <View style={styles.spotEmpty}>
                        <Text style={styles.spotEmptyText}>VOKTER DROP</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.spotBody}>
                    {spotlight.status === 'live' ? (
                      <View style={[styles.pill, styles.pillLive, { marginBottom: 0 }]}>
                        <LiveDot />
                        <Text style={[styles.pillText, { color: colors.live }]}>En vivo ahora</Text>
                      </View>
                    ) : (
                      <View style={[styles.pill, styles.pillAccent, { marginBottom: 0 }]}>
                        <Ionicons name="calendar-outline" size={12} color={colors.accent} />
                        <Text style={[styles.pillText, { color: colors.accent }]}>Próximo drop</Text>
                      </View>
                    )}
                    <Text style={styles.spotTitle}>{spotlight.name}</Text>
                    {!!spotlight.description && (
                      <Text style={styles.spotText} numberOfLines={3}>
                        {spotlight.description}
                      </Text>
                    )}
                    <Text style={styles.spotMeta}>
                      {formatDate(spotlight.launchAt)} · {spotlight.waitlistCount ?? 0} en lista de espera
                    </Text>
                    {spotlight.status === 'scheduled' && (
                      <View style={{ marginTop: 18 }}>
                        <Countdown target={spotlight.launchAt} size="lg" />
                      </View>
                    )}
                    <Pressable
                      onPress={() => router.push('/drops')}
                      style={({ pressed }) => [styles.btnPrimary, { marginTop: 20 }, pressed && styles.btnPressed]}
                    >
                      <Text style={styles.btnPrimaryText}>
                        {spotlight.status === 'live' ? 'Ver productos del drop' : 'Unirme a la lista de espera'}
                      </Text>
                      <Ionicons name="arrow-forward" size={17} color={colors.accentForeground} />
                    </Pressable>
                  </View>
                </FadeIn>
              </View>
            )}
          </>
        )}

        {/* ================= ASISTENTE IA ================= */}
        <View style={styles.section}>
          <FadeIn style={styles.ai}>
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={22} color={colors.accentForeground} />
            </View>
            <Text style={styles.aiTitle}>¿No sabes qué buscar?{'\n'}Pregúntale a Vokter.</Text>
            <Text style={styles.aiText}>
              Describe lo que necesitas y tu presupuesto. Te mostramos productos reales con precio y stock actualizados.
            </Text>
            <View style={styles.aiInputRow}>
              <TextInput
                value={pregunta}
                onChangeText={setPregunta}
                placeholder="Ej: cargador rápido bajo $100.000"
                placeholderTextColor={colors.subtle}
                style={styles.aiInput}
                returnKeyType="send"
                onSubmitEditing={() => preguntar()}
              />
              <Pressable
                onPress={() => preguntar()}
                disabled={pregunta.trim().length < 2}
                style={({ pressed }) => [
                  styles.aiSend,
                  (pressed || pregunta.trim().length < 2) && { opacity: 0.5 },
                ]}
                accessibilityLabel="Preguntar"
              >
                <Ionicons name="arrow-up" size={19} color={colors.accentForeground} />
              </Pressable>
            </View>
            <View style={styles.aiChips}>
              {AI_SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => preguntar(s)} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>
        </View>

        {/* ================= EXCLUSIVO DE LA APP ================= */}
        <View style={styles.section}>
          <FadeIn style={styles.appCard}>
            <Text style={styles.eyebrow}>Exclusivo de la app</Text>
            <Text style={styles.appTitle}>Verifica en la calle, no solo en la web.</Text>
            <ScanMock products={products} />
            {[
              ['scan-outline', 'Escanea el QR del producto y valida su autenticidad al instante'],
              ['notifications-outline', 'Recibe una notificación cuando se anuncie un nuevo drop'],
              ['phone-portrait-outline', 'Tu misma cuenta, pedidos y reseñas que en la web'],
            ].map(([icon, text]) => (
              <View key={text} style={styles.appItem}>
                <View style={styles.appItemIcon}>
                  <Ionicons name={icon} size={15} color={colors.accent} />
                </View>
                <Text style={styles.appItemText}>{text}</Text>
              </View>
            ))}
            <Pressable
              onPress={() => router.push('/escaner')}
              style={({ pressed }) => [styles.btnContrast, pressed && styles.btnPressed]}
            >
              <Ionicons name="qr-code-outline" size={18} color={colors.contrastForeground} />
              <Text style={styles.btnContrastText}>Escanear un código</Text>
            </Pressable>
          </FadeIn>
        </View>

        {/* ================= PIE ================= */}
        <View style={styles.footer}>
          <Logo height={18} />
          <Text style={styles.footerText}>Original o no es Vokter.</Text>
          <Text style={styles.footerSmall}>© {new Date().getFullYear()} Vokter · Tecnología urbana verificada</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, suffix, middle, first }) {
  const styles = useStyles();
  return (
    <View style={[styles.stat, first ? styles.statFirst : middle ? styles.statMiddle : styles.statLast]}>
      <Text style={styles.statLabel}>{label}</Text>
      {value == null ? (
        <Text style={styles.statValue}>—</Text>
      ) : (
        <Counter value={value} suffix={suffix} style={styles.statValue} />
      )}
    </View>
  );
}

/** Punto verde que late (el "en vivo" de la web). */
function LiveDot() {
  const styles = useStyles();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [t]);
  return (
    <View style={styles.liveWrap}>
      <Animated.View
        style={[
          styles.liveRing,
          {
            opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
          },
        ]}
      />
      <View style={styles.liveCore} />
    </View>
  );
}

/** Mini escáner con la línea que barre el QR. */
function ScanMock({ products }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [t]);
  return (
    <View style={styles.scan}>
      <View style={styles.scanBox}>
        <Ionicons name="qr-code" size={78} color={colors.foreground} style={{ opacity: 0.8 }} />
        <Animated.View
          style={[
            styles.scanLine,
            { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-52, 52] }) }] },
          ]}
        />
        {['tl', 'tr', 'bl', 'br'].map((c) => (
          <View key={c} style={[styles.scanCorner, styles[c]]} />
        ))}
      </View>
      <View style={styles.scanResult}>
        <View style={styles.mockOk}>
          <Ionicons name="checkmark-circle" size={15} color={colors.live} />
          <Text style={styles.mockOkText}>Producto original</Text>
        </View>
        <Text style={styles.scanCode} numberOfLines={1}>
          {products[0]?.authenticityCode ?? 'VKT-XXXXXXXX'}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  announce: {
    height: 32,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  announceItem: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 18 },
  announceText: { color: colors.muted, fontSize: 11.5 },
  announceSep: { color: colors.subtle, fontSize: 11.5, marginLeft: 11 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Hero
  hero: { paddingHorizontal: PADDING, paddingTop: 30, overflow: 'hidden' },
  hello: { color: colors.muted, fontSize: 14, marginBottom: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    maxWidth: '100%',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pillLive: { borderColor: colors.liveLine, backgroundColor: colors.liveSoft },
  pillAccent: { borderColor: colors.accentLine, backgroundColor: colors.accentSoft },
  pillText: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  display: {
    color: colors.foreground,
    fontSize: 46,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: -2.2,
    marginTop: 22,
  },
  lead: { color: colors.muted, fontSize: 15.5, lineHeight: 24, marginTop: 18 },
  ctas: { gap: 10, marginTop: 26 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryText: { color: colors.accentForeground, fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  btnSecondaryText: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
  btnContrast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginTop: 22,
    borderRadius: 999,
    backgroundColor: colors.contrast,
  },
  btnContrastText: { color: colors.contrastForeground, fontSize: 15, fontWeight: '700' },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnSmall: {
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { color: colors.accent, fontSize: 13.5, fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    marginTop: 34,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1 },
  statFirst: { paddingRight: 12 },
  statLast: { paddingLeft: 14 },
  statMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  statLabel: {
    color: colors.subtle,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
    paddingLeft: 0,
  },
  statValue: { color: colors.foreground, fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 },
  errorCard: {
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.dangerLine,
    backgroundColor: colors.dangerSoft,
  },
  errorTitle: { color: colors.foreground, fontSize: 16, fontWeight: '700' },
  errorText: { color: colors.muted, fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  errorActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 6 },

  // Confianza
  trust: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: PADDING - 6,
    paddingVertical: 18,
  },
  trustItem: { width: '50%', padding: 6, paddingVertical: 10 },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  trustTitle: { color: colors.foreground, fontSize: 13.5, fontWeight: '700', marginTop: 10 },
  trustText: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },

  // Ticker
  ticker: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  tickerItem: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingLeft: 22 },
  tickerText: { color: colors.foreground, opacity: 0.85, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  tickerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },

  // Secciones
  section: { paddingHorizontal: PADDING, paddingTop: 48 },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catTile: {
    aspectRatio: 4 / 3,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0d0d10',
    padding: 12,
    justifyContent: 'flex-end',
  },
  catImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 },
  catShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  catIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  catFoot: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  catName: { color: '#ffffff', fontSize: 14, fontWeight: '700', lineHeight: 17 },
  catCount: { color: 'rgba(255,255,255,0.65)', fontSize: 10.5, fontFamily: 'monospace', marginTop: 2 },

  card: {
    marginBottom: 12,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardNum: { color: colors.subtle, fontSize: 12, fontFamily: 'monospace' },
  cardTitle: { color: colors.foreground, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginTop: 12 },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6 },
  mock: {
    marginTop: 20,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 12,
  },
  mockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mockCode: {
    flex: 1,
    color: colors.muted,
    fontFamily: 'monospace',
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mockBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  mockBtnText: { color: colors.accentForeground, fontSize: 12, fontWeight: '700' },
  mockOk: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mockOkText: { color: colors.live, fontSize: 12.5, fontWeight: '600' },
  mockDropHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mockDropName: { flex: 1, color: colors.foreground, fontSize: 13.5, fontWeight: '700' },
  badgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSmallText: { color: colors.muted, fontSize: 11 },
  chat: { marginTop: 20, gap: 8 },
  bubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    overflow: 'hidden',
    backgroundColor: colors.accent,
    color: colors.accentForeground,
    fontSize: 12.5,
    fontWeight: '600',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    borderBottomRightRadius: 5,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    overflow: 'hidden',
    color: colors.muted,
    fontSize: 12.5,
    lineHeight: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  // Drop destacado
  spot: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  spotCover: { margin: 8, aspectRatio: 4 / 3, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.tile },
  spotEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spotEmptyText: { color: 'rgba(0,0,0,0.15)', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  spotBody: { padding: 20, paddingTop: 14 },
  spotTitle: { color: colors.foreground, fontSize: 28, fontWeight: '800', letterSpacing: -1, marginTop: 14 },
  spotText: { color: colors.muted, fontSize: 14.5, lineHeight: 22, marginTop: 8 },
  spotMeta: {
    color: colors.subtle,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
    marginTop: 12,
  },

  // Asistente
  ai: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  aiTitle: {
    color: colors.foreground,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginTop: 18,
  },
  aiText: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'stretch',
    marginTop: 22,
    padding: 5,
    paddingLeft: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  aiInput: { flex: 1, height: 42, color: colors.foreground, fontSize: 14.5, padding: 0 },
  aiSend: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  aiChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipText: { color: colors.muted, fontSize: 12.5 },

  // App
  appCard: {
    padding: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  appTitle: { color: colors.foreground, fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.9, marginTop: 10 },
  appItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginTop: 14 },
  appItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  appItemText: { flex: 1, color: colors.muted, fontSize: 14, lineHeight: 20, paddingTop: 3 },
  scan: {
    marginTop: 20,
    marginBottom: 6,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  scanBox: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 3,
  },
  scanCorner: { position: 'absolute', width: 22, height: 22, borderColor: colors.accent },
  tl: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  tr: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  bl: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  br: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
  scanResult: {
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.liveLine,
    backgroundColor: colors.liveSoft,
  },
  scanCode: { color: colors.muted, fontSize: 11, fontFamily: 'monospace', marginTop: 3 },

  // Pie
  footer: { alignItems: 'center', gap: 8, paddingTop: 48, paddingBottom: 16, paddingHorizontal: PADDING },
  footerText: { color: colors.muted, fontSize: 13.5, marginTop: 4 },
  footerSmall: { color: colors.subtle, fontSize: 11.5 },

  // Punto en vivo
  liveWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  liveRing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  liveCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
}));
