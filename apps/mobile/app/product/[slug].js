import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch, resolveImage } from '../../src/lib/api';
import { useCart } from '../../src/lib/cart-context';
import { formatCOP } from '../../src/lib/format';
import { makeStyles, useTheme } from '../../src/theme';

export default function ProductDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { add, count } = useCart();
  const [added, setAdded] = useState(false);
  const { width } = useWindowDimensions();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setProduct(await apiFetch(`/api/products/${slug}`));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
        <Text style={styles.errorTitle}>No se pudo cargar el producto</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={load} style={styles.retry}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const images = product.images?.length
    ? product.images
    : product.coverUrl
      ? [{ url: product.coverUrl }]
      : [];
  const outOfStock = product.stock <= 0;
  const verified = product.authenticityStatus ? product.authenticityStatus === 'active' : true;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <Stack.Screen options={{ title: '' }} />

      <View style={{ height: width, backgroundColor: colors.tile }}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {images.map((img, i) => (
              <Image
                key={`${img.url}-${i}`}
                source={{ uri: resolveImage(img.url) }}
                style={{ width, height: width }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>VOKTER</Text>
          </View>
        )}

        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>
          {product.brand || product.category?.name || 'Vokter'}
        </Text>
        <Text style={styles.name}>{product.name}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>{formatCOP(product.priceCents)}</Text>
          {product.reviewCount > 0 && (
            <View style={styles.rating}>
              <Ionicons name="star" size={13} color={colors.accent} />
              <Text style={styles.ratingText}>
                {Number(product.rating).toFixed(1)} · {product.reviewCount} reseña
                {product.reviewCount === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.badges}>
          <View style={[styles.badge, outOfStock ? styles.badgeDanger : styles.badgeLive]}>
            <Ionicons
              name={outOfStock ? 'close-circle' : 'checkmark-circle'}
              size={13}
              color={outOfStock ? colors.danger : colors.live}
            />
            <Text style={[styles.badgeText, { color: outOfStock ? colors.danger : colors.live }]}>
              {outOfStock ? 'Agotado' : `${product.stock} disponibles`}
            </Text>
          </View>
          {product.category?.name && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.category.name}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => {
            add(product);
            setAdded(true);
            setTimeout(() => setAdded(false), 1600);
          }}
          disabled={outOfStock}
          style={({ pressed }) => [
            styles.addButton,
            (pressed || outOfStock) && { opacity: 0.55 },
            added && { backgroundColor: colors.live },
          ]}
        >
          <Ionicons
            name={added ? 'checkmark' : 'bag-add-outline'}
            size={18}
            color={colors.accentForeground}
          />
          <Text style={styles.addButtonText}>
            {outOfStock ? 'Agotado' : added ? 'Agregado al carrito' : 'Agregar al carrito'}
          </Text>
        </Pressable>

        {count > 0 && (
          <Pressable onPress={() => router.push('/carrito')} style={styles.cartLink}>
            <Text style={styles.cartLinkText}>
              Ver carrito ({count} producto{count === 1 ? '' : 's'})
            </Text>
            <Ionicons name="arrow-forward" size={15} color={colors.accent} />
          </Pressable>
        )}

        {product.description ? (
          <>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{product.description}</Text>
          </>
        ) : null}

        <View style={styles.authCard}>
          <View style={styles.authHead}>
            <Ionicons
              name={verified ? 'shield-checkmark' : 'shield-outline'}
              size={17}
              color={verified ? colors.live : colors.warning}
            />
            <Text style={styles.authTitle}>
              {verified ? 'Autenticidad verificada' : 'Autenticidad no confirmada'}
            </Text>
          </View>
          <Text style={styles.authLabel}>Código del producto</Text>
          <Text style={styles.authCode}>{product.authenticityCode}</Text>
          <Pressable onPress={() => router.push('/escaner')} style={styles.authButton}>
            <Ionicons name="qr-code-outline" size={17} color={colors.foreground} />
            <Text style={styles.authButtonText}>Verificar con la cámara</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  errorTitle: { color: colors.foreground, fontSize: 17, fontWeight: '700' },
  errorText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retry: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: colors.accentForeground, fontSize: 14, fontWeight: '700' },
  noImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: 'rgba(0,0,0,0.14)', fontSize: 34, fontWeight: '800', letterSpacing: 2 },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.25)' },
  dotActive: { backgroundColor: colors.accent, width: 18 },
  body: { paddingHorizontal: 20, paddingTop: 24, gap: 6 },
  eyebrow: {
    color: colors.subtle,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  name: { color: colors.foreground, fontSize: 26, fontWeight: '800', letterSpacing: -0.7, lineHeight: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { color: colors.foreground, fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { color: colors.muted, fontSize: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeLive: { borderColor: colors.liveLine, backgroundColor: colors.liveSoft },
  badgeDanger: { borderColor: colors.dangerLine, backgroundColor: colors.dangerSoft },
  badgeText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 24,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  addButtonText: { color: colors.accentForeground, fontSize: 15, fontWeight: '700' },
  cartLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
  },
  cartLinkText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: colors.foreground, fontSize: 15, fontWeight: '700', marginTop: 28 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 8 },
  authCard: {
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  authHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authTitle: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  authLabel: {
    color: colors.subtle,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  authCode: { color: colors.accent, fontFamily: 'monospace', fontSize: 16, marginTop: 5 },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  authButtonText: { color: colors.foreground, fontSize: 14.5, fontWeight: '600' },
}));
