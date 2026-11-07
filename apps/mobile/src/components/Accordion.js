import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../theme';

/**
 * Una sección del acordeón: cabecera con ícono, título y resumen, y un
 * contenido que se despliega animando su alto real.
 *
 * El contenido se mide en una capa absoluta (así su alto natural no depende
 * del contenedor que lo recorta) y el contenedor anima de 0 a esa medida.
 * Si el contenido cambia de tamaño estando abierto, la medida se actualiza.
 */
export default function AccordionItem({ icon, title, summary, expanded, onToggle, active, children }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [alto, setAlto] = useState(0);
  const t = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      // El alto no se puede animar en el hilo nativo.
      useNativeDriver: false,
    }).start();
  }, [expanded, t]);

  const giro = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.item, expanded && styles.itemOpen]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.head, pressed && styles.headPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}. ${summary ?? ''}`}
      >
        <View style={[styles.icon, (expanded || active) && styles.iconOn]}>
          <Ionicons
            name={icon}
            size={18}
            color={expanded || active ? colors.accentForeground : colors.accent}
          />
        </View>
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {active && <View style={styles.activeDot} />}
          </View>
          {!!summary && (
            <Text style={styles.summary} numberOfLines={1}>
              {summary}
            </Text>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate: giro }] }}>
          <Ionicons name="chevron-down" size={18} color={colors.subtle} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={{
          height: t.interpolate({ inputRange: [0, 1], outputRange: [0, alto] }),
          opacity: t,
          overflow: 'hidden',
        }}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!expanded}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <View style={styles.measure} onLayout={(e) => setAlto(e.nativeEvent.layout.height)}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  item: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemOpen: { borderColor: colors.border, backgroundColor: colors.surface },
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
    backgroundColor: colors.accentSoft,
  },
  iconOn: { backgroundColor: colors.accent },
  texts: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: colors.foreground, fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  summary: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  measure: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, paddingBottom: 14 },
}));
