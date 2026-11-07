import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeStyles, useTheme } from '../theme';
import { GoldButton, OutlineButton } from './ui';
import Logo from './Logo';

const CLAVE = 'f360.mayor';

/**
 * Confirmación de mayoría de edad la primera vez que se abre la app. En
 * Colombia las apuestas son solo para mayores de 18. El registro vuelve a
 * comprobarlo con la fecha de nacimiento: esto es solo la puerta de entrada.
 */
export default function AgeGate() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [estado, setEstado] = useState('cargando'); // cargando | preguntar | ok | menor

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((v) => setEstado(v === 'si' ? 'ok' : 'preguntar'))
      .catch(() => setEstado('preguntar'));
  }, []);

  if (estado === 'cargando' || estado === 'ok') return null;

  const confirmar = () => {
    setEstado('ok');
    AsyncStorage.setItem(CLAVE, 'si').catch(() => {});
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.screen}>
        <Logo />
        {estado === 'preguntar' ? (
          <View style={styles.card}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>18+</Text>
            </View>
            <Text style={styles.title}>¿Eres mayor de edad?</Text>
            <Text style={styles.text}>
              Fanáticos 360 es una app de apuestas deportivas. Para continuar debes tener 18 años o más.
            </Text>
            <GoldButton label="Sí, tengo 18 o más" onPress={confirmar} style={{ alignSelf: 'stretch', marginTop: 8 }} />
            <OutlineButton label="No" tone="neutral" onPress={() => setEstado('menor')} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : (
          <View style={styles.card}>
            <Ionicons name="hand-left-outline" size={34} color={colors.accent} />
            <Text style={styles.title}>Vuelve cuando cumplas 18</Text>
            <Text style={styles.text}>
              Las apuestas son solo para mayores de edad. Mientras tanto, disfruta el fútbol sin apostar.
            </Text>
            <OutlineButton label="Me equivoqué" tone="neutral" onPress={() => setEstado('preguntar')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          </View>
        )}
        <Text style={styles.foot}>Juega con responsabilidad. El juego puede causar adicción.</Text>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.danger, fontSize: 20, fontWeight: '900' },
  title: { color: colors.foreground, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  text: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  foot: { color: colors.subtle, fontSize: 12.5, textAlign: 'center' },
}));
