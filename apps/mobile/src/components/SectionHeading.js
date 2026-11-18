import { Text, View } from 'react-native';
import { makeStyles } from '../theme';
import Tap from './Tap';

/** Título de sección grande con un enlace dorado a la derecha. */
export default function SectionHeading({ title, onLink, linkLabel = 'Ver todos', style }) {
  const styles = useStyles();
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {onLink && (
        <Tap onPress={onLink} hitSlop={10} scaleTo={0.92} accessibilityRole="link">
          <Text style={styles.linkText}>{linkLabel}</Text>
        </Tap>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  title: { flex: 1, color: colors.foreground, fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  linkText: { color: colors.accent, fontSize: 13.5, fontWeight: '700' },
}));
