import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../theme';

/** Título de sección con "Ver todo >" a la derecha, como en la plantilla. */
export default function SectionHeading({ title, onLink, linkLabel = 'Ver todo', style }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {onLink && (
        <Pressable onPress={onLink} hitSlop={10} style={styles.link} accessibilityRole="link">
          <Text style={styles.linkText}>{linkLabel}</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  title: { flex: 1, color: colors.foreground, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surface2,
  },
  linkText: { color: colors.foreground, fontSize: 12.5, fontWeight: '700' },
}));
