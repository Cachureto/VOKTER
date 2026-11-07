import { ScrollView, Text, View } from 'react-native';
import { makeStyles } from '../src/theme';

const SECCIONES = [
  ['1. Quién puede jugar', 'Solo personas mayores de 18 años, residentes en Colombia y con documento válido. Cada persona puede tener una sola cuenta, a su nombre.'],
  ['2. Tu cuenta', 'Eres responsable de mantener tu contraseña en secreto. Los datos de registro deben coincidir con tu documento: se usan para verificar tu edad y para enviarte los retiros.'],
  ['3. Apuestas', 'Una apuesta queda aceptada cuando la app la confirma. Las cuotas pueden cambiar hasta ese momento y nunca se cobra una cuota que no hayas visto. Las apuestas se cierran un minuto antes del inicio del partido.'],
  ['4. Liquidación', 'Los mercados se liquidan con el resultado de los 90 minutos más el tiempo de reposición, salvo «Clasifica», que cuenta prórroga y penales. Si un partido se cancela, la selección se anula: en una simple se devuelve el valor; en una combinada esa selección cuenta con cuota 1.00.'],
  ['5. Límites', 'Apuesta mínima $1.000 y máxima $2.000.000 por boleto. La ganancia de un boleto no puede superar $50.000.000. Máximo 10 selecciones por combinada, una por partido.'],
  ['6. Depósitos y retiros', 'Depósito mínimo $10.000. Retiro mínimo $20.000, solo a cuentas a nombre del titular y con la identidad verificada. Mientras la app muestre «modo pruebas», los movimientos son simulados y no hay dinero real.'],
  ['7. Juego responsable', 'Puedes poner límites de depósito diarios, semanales y mensuales, y pausar tu cuenta entre 24 horas y un año. Durante una pausa no se puede apostar ni depositar, pero sí retirar.'],
  ['8. Operación', 'La operación con dinero real en Colombia requiere la autorización de Coljuegos. Fanáticos 360 solo habilita pagos reales cuando cuenta con ella.'],
];

export default function Terminos() {
  const styles = useStyles();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Términos y condiciones</Text>
      <Text style={styles.lead}>Resumen de las reglas de Fanáticos 360. Al registrarte aceptas estas condiciones.</Text>
      {SECCIONES.map(([t, p]) => (
        <View key={t} style={styles.section}>
          <Text style={styles.h}>{t}</Text>
          <Text style={styles.p}>{p}</Text>
        </View>
      ))}
      <Text style={styles.fine}>El juego en exceso puede causar adicción. Prohibida la venta a menores de edad.</Text>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 4, paddingBottom: 48, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { color: colors.foreground, fontSize: 26, fontWeight: '900' },
  lead: { color: colors.muted, fontSize: 14.5, lineHeight: 21, marginTop: 6 },
  section: { marginTop: 20 },
  h: { color: colors.foreground, fontSize: 16, fontWeight: '900' },
  p: { color: colors.muted, fontSize: 14.5, lineHeight: 22, marginTop: 6 },
  fine: { color: colors.subtle, fontSize: 12.5, marginTop: 28, textAlign: 'center' },
}));
