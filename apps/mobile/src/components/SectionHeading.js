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
          <Ionicons name="chevron-forward" size={17} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  title: { flex: 1, color: colors.foreground, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { color: colors.accent, fontSize: 15, fontWeight: '800' },
}));
