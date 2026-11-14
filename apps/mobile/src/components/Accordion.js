import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURVAS, movimientoReducido } from '../lib/motion';
import { makeStyles, useTheme } from '../theme';

/**
 * Una sección del acordeón: cabecera con ícono, título y resumen, y un
 * contenido que se despliega animando su alto real.
 *
 * Al abrir, el contenido baja unos píxeles mientras aparece (como si saliera
 * de la cabecera), el ícono se rellena de dorado y la flecha gira. Al cerrar
 * todo vuelve un poco más rápido, para que no se sienta pegajoso.
 *
 * El contenido se mide en una capa absoluta (así su alto natural no depende
 * del contenedor que lo recorta) y el contenedor anima de 0 a esa medida.
 * Si el contenido cambia de tamaño estando abierto, la medida se actualiza.
 *
 * `variant="card"` lo pinta como tarjeta suelta (ficha del partido).
 * `right` permite poner algo a la derecha de la cabecera (un contador).
 */
export default function AccordionItem({
  icon,
  title,
  summary,
  expanded,
  onToggle,
  active,
  right,
  variant = 'menu',
  children,
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [alto, setAlto] = useState(0);
  const t = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const tarjeta = variant === 'card';

  useEffect(() => {
    if (movimientoReducido()) {
      t.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.timing(t, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 360 : 260,
      easing: expanded ? CURVAS.entrar : CURVAS.salir,
      // El alto no se puede animar en el hilo nativo.
      useNativeDriver: false,
    }).start();
  }, [expanded, t]);

  const giro = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const encendido = expanded || active;

  return (
    <Animated.View
      style={[
        styles.item,
        tarjeta && styles.card,
        !tarjeta && {
          borderColor: t.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', colors.border] }),
          backgroundColor: t.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', colors.surface] }),
        },
      ]}
    >
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.head, pressed && styles.headPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}. ${summary ?? ''}`}
      >
        {!!icon && (
          <Animated.View
            style={[
              styles.icon,
              {
                backgroundColor: active
                  ? colors.accent
                  : t.interpolate({ inputRange: [0, 1], outputRange: [colors.accentSoft, colors.accent] }),
                transform: [{ scale: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] }) }],
              },
            ]}
          >
            <Ionicons name={icon} size={18} color={encendido ? colors.accentForeground : colors.accent} />
          </Animated.View>
        )}
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, tarjeta && styles.titleCard]}>{title}</Text>
            {active && <View style={styles.activeDot} />}
          </View>
          {!!summary && (
            <Text style={styles.summary} numberOfLines={1}>
              {summary}
            </Text>
          )}
        </View>
        {right}
        <Animated.View style={[styles.chevron, { transform: [{ rotate: giro }] }]}>
          <Ionicons name="chevron-down" size={18} color={expanded ? colors.accent : colors.subtle} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={{ height: t.interpolate({ inputRange: [0, 1], outputRange: [0, alto] }), overflow: 'hidden' }}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!expanded}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <Animated.View
          style={[
            styles.measure,
            tarjeta && styles.measureCard,
            {
              opacity: t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.2, 1] }),
              transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
            },
          ]}
          onLayout={(e) => setAlto(e.nativeEvent.layout.height)}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  item: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  card: { borderRadius: 22, borderColor: colors.border, backgroundColor: colors.surface },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  headPressed: { backgroundColor: colors.surfaceHover },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: colors.foreground, fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  titleCard: { fontSize: 17, fontWeight: '900' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  summary: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measure: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, paddingBottom: 14 },
  measureCard: { paddingHorizontal: 16, paddingBottom: 16 },
}));
