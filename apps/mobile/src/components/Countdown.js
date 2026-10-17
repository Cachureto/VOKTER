import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../theme';

function partes(target) {
  const ms = Math.max(0, new Date(target) - Date.now());
  return {
    fin: ms === 0,
    valores: [
      [Math.floor(ms / 86400000), 'Días'],
      [Math.floor((ms % 86400000) / 3600000), 'Horas'],
      [Math.floor((ms % 3600000) / 60000), 'Min'],
      [Math.floor((ms % 60000) / 1000), 'Seg'],
    ],
  };
}

/** Cuenta regresiva en cajas, como la de la web. Se actualiza cada segundo. */
export default function Countdown({ target, size = 'md' }) {
  const styles = useStyles();
  const [estado, setEstado] = useState(() => partes(target));

  useEffect(() => {
    setEstado(partes(target));
    const id = setInterval(() => setEstado(partes(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (estado.fin) return <Text style={styles.done}>¡Ya está disponible!</Text>;

  const grande = size === 'lg';
  return (
    <View style={styles.row} accessibilityRole="timer">
      {estado.valores.map(([n, label]) => (
        <View key={label} style={[styles.box, grande && styles.boxLg]}>
          <Text style={[styles.num, grande && styles.numLg]}>{String(n).padStart(2, '0')}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  boxLg: { paddingVertical: 13, borderRadius: 14 },
  num: {
    color: colors.foreground,
    fontSize: 19,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  numLg: { fontSize: 26 },
  label: { color: colors.subtle, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  done: { color: colors.live, fontSize: 15, fontWeight: '700' },
}));
