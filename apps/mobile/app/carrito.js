import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Field } from '../src/components/Field';
import { apiFetch, resolveImage } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { useCart } from '../src/lib/cart-context';
import { formatCOP } from '../src/lib/format';
import { makeStyles, useTheme } from '../src/theme';

export default function Carrito() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { items, count, subtotalCents, setQuantity, remove, clear } = useCart();

  const [step, setStep] = useState('cart'); // cart | address | done
  const [form, setForm] = useState({ fullName: user?.name ?? '', phone: '', city: '', address: '' });
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [order, setOrder] = useState(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const goToAddress = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setForm((f) => ({ ...f, fullName: f.fullName || user.name }));
    setStep('address');
  };

  const submit = async () => {
    setError(null);
    const { fullName, phone, city, address } = form;
    if (!fullName.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      setError('Completa todos los datos de envío.');
      return;
    }
    setSending(true);
    try {
      const created = await apiFetch('/api/orders', {
        method: 'POST',
        auth: true,
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            city: city.trim(),
            address: address.trim(),
          },
        },
      });
      setOrder(created);
      clear();
      setStep('done');
    } catch (err) {
      setError(err.fieldMessage ?? err.message);
    } finally {
      setSending(false);
    }
  };

  // ---------- Pedido creado ----------
  if (step === 'done' && order) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.doneContent}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark" size={32} color={colors.accentForeground} />
        </View>
        <Text style={styles.doneTitle}>Pedido confirmado</Text>
        <Text style={styles.doneText}>
          Tu pedido quedó registrado y el stock ya está reservado.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Número de pedido</Text>
          <Text style={styles.mono}>{order.id}</Text>
          <Text style={[styles.label, { marginTop: 16 }]}>Total</Text>
          <Text style={styles.total}>{formatCOP(order.totalCents)}</Text>
        </View>

        <Pressable onPress={() => router.replace('/pedidos')} style={styles.button}>
          <Text style={styles.buttonText}>Ver mis pedidos</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/catalogo')} style={styles.buttonGhost}>
          <Text style={styles.buttonGhostText}>Seguir viendo el catálogo</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- Carrito vacío ----------
  if (count === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="bag-outline" size={32} color={colors.subtle} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyText}>Agrega productos desde el catálogo.</Text>
        <Pressable onPress={() => router.replace('/catalogo')} style={styles.button}>
          <Text style={styles.buttonText}>Ir al catálogo</Text>
        </Pressable>
      </View>
    );
  }

  // ---------- Datos de envío ----------
  if (step === 'address') {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Datos de envío</Text>
          <Text style={styles.subtitle}>
            {count} producto{count === 1 ? '' : 's'} · {formatCOP(subtotalCents)}
          </Text>

          <Field
            label="Nombre completo"
            value={form.fullName}
            onChangeText={set('fullName')}
            placeholder="Como aparece en tu documento"
            autoCapitalize="words"
            style={{ marginTop: 24 }}
          />
          <Field
            label="Teléfono"
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="300 000 0000"
            keyboardType="phone-pad"
            style={{ marginTop: 16 }}
          />
          <Field
            label="Ciudad"
            value={form.city}
            onChangeText={set('city')}
            placeholder="Bogotá"
            autoCapitalize="words"
            style={{ marginTop: 16 }}
          />
          <Field
            label="Dirección"
            value={form.address}
            onChangeText={set('address')}
            placeholder="Calle, número, apartamento"
            style={{ marginTop: 16 }}
          />

          {error ? (
            <View style={styles.alert}>
              <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={sending}
            style={({ pressed }) => [styles.button, (pressed || sending) && { opacity: 0.75 }]}
          >
            {sending ? (
              <ActivityIndicator color={colors.accentForeground} />
            ) : (
              <Text style={styles.buttonText}>Confirmar pedido · {formatCOP(subtotalCents)}</Text>
            )}
          </Pressable>
          <Pressable onPress={() => setStep('cart')} style={styles.buttonGhost}>
            <Text style={styles.buttonGhostText}>Volver al carrito</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---------- Carrito ----------
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Carrito</Text>
        <Text style={styles.subtitle}>
          {count} producto{count === 1 ? '' : 's'}
        </Text>

        <View style={{ marginTop: 20, gap: 12 }}>
          {items.map((item) => {
            const image = resolveImage(item.coverUrl);
            return (
              <View key={item.productId} style={styles.line}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]} />
                )}

                <View style={styles.lineBody}>
                  <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
                    <Text style={styles.lineName} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </Pressable>
                  <Text style={styles.linePrice}>{formatCOP(item.priceCents)}</Text>

                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => setQuantity(item.productId, item.quantity - 1)}
                      hitSlop={6}
                      style={styles.stepButton}
                    >
                      <Ionicons name="remove" size={16} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <Pressable
                      onPress={() => setQuantity(item.productId, item.quantity + 1)}
                      hitSlop={6}
                      style={styles.stepButton}
                    >
                      <Ionicons name="add" size={16} color={colors.foreground} />
                    </Pressable>

                    <Pressable
                      onPress={() => remove(item.productId)}
                      hitSlop={8}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.subtle} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <View>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.total}>{formatCOP(subtotalCents)}</Text>
        </View>
        <Pressable onPress={goToAddress} style={({ pressed }) => [styles.barButton, pressed && { opacity: 0.8 }]}>
          <Text style={styles.buttonText}>{user ? 'Continuar' : 'Entrar para comprar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  title: { color: colors.foreground, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 6 },
  emptyTitle: { color: colors.foreground, fontSize: 19, fontWeight: '700', marginTop: 6 },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  line: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: colors.tile },
  thumbEmpty: { backgroundColor: colors.surfaceHover },
  lineBody: { flex: 1, justifyContent: 'space-between' },
  lineName: { color: colors.foreground, fontSize: 14.5, fontWeight: '500', lineHeight: 19 },
  linePrice: { color: colors.muted, fontSize: 13, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stepButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { color: colors.foreground, fontSize: 15, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { color: colors.subtle, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' },
  total: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 3 },
  mono: { color: colors.foreground, fontFamily: 'monospace', fontSize: 13, marginTop: 5 },
  barButton: {
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 20,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.dangerLine,
    backgroundColor: colors.dangerSoft,
  },
  alertText: { flex: 1, color: colors.danger, fontSize: 13.5, lineHeight: 19 },
  button: {
    marginTop: 24,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: { color: colors.accentForeground, fontSize: 15, fontWeight: '700' },
  buttonGhost: {
    marginTop: 12,
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhostText: { color: colors.foreground, fontSize: 14.5, fontWeight: '600' },
  doneContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.live,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { color: colors.foreground, fontSize: 24, fontWeight: '800', marginTop: 18 },
  doneText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  card: {
    width: '100%',
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
}));
