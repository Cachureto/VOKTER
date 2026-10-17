import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeIn from '../src/components/FadeIn';
import { VokterMark } from '../src/components/Logo';
import ProductCard from '../src/components/ProductCard';
import { apiFetch } from '../src/lib/api';
import { makeStyles, useTheme } from '../src/theme';

const SUGERENCIAS = [
  { icon: 'flash-outline', text: 'Cargador rápido bajo $100.000' },
  { icon: 'battery-charging-outline', text: 'Un power bank para viajar' },
  { icon: 'game-controller-outline', text: 'Algo para jugar en la TV' },
  { icon: 'bicycle-outline', text: 'Accesorios para el celular en la moto' },
];

/**
 * Asistente de compras con IA: el mismo de /search en la web. La IA solo
 * interpreta el mensaje; productos, precios y stock salen de la base de datos.
 */
export default function Asistente() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { q } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const enviada = useRef(null);

  async function send(text) {
    const message = (text ?? input).trim();
    if (message.length < 2 || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setLoading(true);
    try {
      const res = await apiFetch('/api/ai/search', {
        method: 'POST',
        body: { message, conversationId },
        // Gemini puede tardar más que una consulta normal.
        timeoutMs: 30000,
      });
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, products: res.products ?? [] }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.message, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  // Pregunta que llega desde el inicio o el menú (?q=...): se envía una vez.
  useEffect(() => {
    if (typeof q !== 'string' || !q.trim() || enviada.current === q) return;
    enviada.current = q;
    send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const reset = () => {
    setMessages([]);
    setConversationId(undefined);
  };

  const vacio = messages.length === 0 && !loading;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.head}>
        <VokterMark height={20} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headTitle}>Asistente de compras</Text>
          <View style={styles.headSub}>
            <Ionicons name="shield-checkmark" size={12} color={colors.live} />
            <Text style={styles.headSubText} numberOfLines={1}>
              Solo productos, precios y stock reales
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <Pressable onPress={reset} disabled={loading} hitSlop={8} style={styles.reset} accessibilityLabel="Nueva búsqueda">
            <Ionicons name="refresh" size={17} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, vacio && { flexGrow: 1, justifyContent: 'center' }]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => !vacio && scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {vacio ? (
          <FadeIn style={styles.empty}>
            <Text style={styles.emptyTitle}>¿Qué estás buscando hoy?</Text>
            <Text style={styles.emptyText}>
              Escríbelo como se lo dirías a un amigo. Incluye tu presupuesto y te mostramos lo que hay en stock.
            </Text>
            <View style={styles.suggestions}>
              {SUGERENCIAS.map((s, i) => (
                <FadeIn key={s.text} delay={120 + i * 70}>
                  <Pressable
                    onPress={() => send(s.text)}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                  >
                    <View style={styles.suggestionIcon}>
                      <Ionicons name={s.icon} size={17} color={colors.accent} />
                    </View>
                    <Text style={styles.suggestionText}>{s.text}</Text>
                    <Ionicons name="arrow-forward" size={15} color={colors.subtle} />
                  </Pressable>
                </FadeIn>
              ))}
            </View>
          </FadeIn>
        ) : (
          messages.map((m, i) =>
            m.role === 'user' ? (
              <FadeIn key={i} distance={8} style={styles.userRow}>
                <Text style={styles.userBubble}>{m.text}</Text>
              </FadeIn>
            ) : (
              <FadeIn key={i} distance={8} style={styles.botBlock}>
                <View style={styles.botRow}>
                  <VokterMark height={14} />
                  <Text style={[styles.botBubble, m.error && styles.botError]}>{m.text}</Text>
                </View>
                {m.products?.length > 0 && (
                  <View style={styles.grid}>
                    {m.products.map((p) => (
                      <ProductCard key={p.id} product={p} width={cardWidth} />
                    ))}
                  </View>
                )}
              </FadeIn>
            ),
          )
        )}
        {loading && <Typing />}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.inputWrap}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ej: cargador rápido bajo $100.000"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => send()}
            maxLength={500}
          />
          <Pressable
            onPress={() => send()}
            disabled={loading || input.trim().length < 2}
            style={({ pressed }) => [
              styles.send,
              (pressed || loading || input.trim().length < 2) && { opacity: 0.35 },
            ]}
            accessibilityLabel="Enviar"
          >
            <Ionicons name="arrow-up" size={19} color={colors.accentForeground} />
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>
          La IA interpreta tu mensaje; los productos y precios salen de la base de datos de Vokter.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Tres puntos que rebotan mientras responde. */
function Typing() {
  const styles = useStyles();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [t]);
  return (
    <View style={styles.botRow}>
      <VokterMark height={14} />
      <View style={styles.typing}>
        {[0, 1, 2].map((n) => (
          <Animated.View
            key={n}
            style={[
              styles.typingDot,
              {
                transform: [
                  {
                    translateY: t.interpolate({
                      inputRange: [0, 0.15 + n * 0.15, 0.3 + n * 0.15, 1],
                      outputRange: [0, -4, 0, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headTitle: { color: colors.foreground, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headSub: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  headSubText: { color: colors.muted, fontSize: 12 },
  reset: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { paddingHorizontal: 20, paddingVertical: 20, gap: 20 },
  empty: { alignItems: 'center' },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  emptyText: { color: colors.muted, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  suggestions: { alignSelf: 'stretch', gap: 10, marginTop: 28 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceHover },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  suggestionText: { flex: 1, color: colors.foreground, fontSize: 14 },
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '85%',
    overflow: 'hidden',
    color: colors.accentForeground,
    backgroundColor: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
    borderBottomRightRadius: 5,
  },
  botBlock: { gap: 14 },
  botRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  botBubble: {
    flexShrink: 1,
    overflow: 'hidden',
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  botError: { color: colors.danger, borderColor: colors.dangerLine, backgroundColor: colors.dangerSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typing: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 18,
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted },
  bar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 5,
    paddingLeft: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, height: 42, color: colors.foreground, fontSize: 14.5, padding: 0 },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  disclaimer: { color: colors.subtle, fontSize: 11, textAlign: 'center', marginTop: 8 },
}));
