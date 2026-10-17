import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../theme';
import FadeIn from './FadeIn';

/** Encabezado de sección del inicio: "01 — Categorías" + título + enlace. */
export default function SectionHeading({ eyebrow, title, description, linkLabel = 'Ver todo', onLink }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <FadeIn style={styles.wrap}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {onLink && (
          <Pressable onPress={onLink} hitSlop={8} style={styles.link}>
            <Text style={styles.linkText}>{linkLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.accent} />
          </Pressable>
        )}
      </View>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </FadeIn>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { marginBottom: 16 },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  title: { flex: 1, color: colors.foreground, fontSize: 25, fontWeight: '800', letterSpacing: -0.9, lineHeight: 29 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 3 },
  linkText: { color: colors.accent, fontSize: 13.5, fontWeight: '600' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
}));
