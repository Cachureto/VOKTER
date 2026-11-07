import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AgeGate from '../src/components/AgeGate';
import BetSlipBar from '../src/components/BetSlipBar';
import HeaderActions, { HeaderLeft } from '../src/components/HeaderActions';
import MainMenu from '../src/components/MainMenu';
import { AuthProvider } from '../src/lib/auth-context';
import { BetSlipProvider } from '../src/lib/betslip-context';
import { MenuProvider } from '../src/lib/menu-context';
import { ThemeProvider, useTheme } from '../src/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BetSlipProvider>
          <MenuProvider>
            <SafeAreaProvider>
              <ThemedStack />
              <BetSlipBar />
              <MainMenu />
              <AgeGate />
            </SafeAreaProvider>
          </MenuProvider>
        </BetSlipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Separado del layout porque necesita leer el tema, y el tema solo existe
// dentro de <ThemeProvider>.
function ThemedStack() {
  const { colors, isLight } = useTheme();

  return (
    <>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
          // Menú a la izquierda (por ahí entra el panel); modo y boleto a la derecha.
          headerLeft: ({ canGoBack }) => <HeaderLeft canGoBack={canGoBack} />,
          headerRight: () => <HeaderActions />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="partidos" options={{ title: 'Partidos' }} />
        <Stack.Screen name="partido/[id]" options={{ title: '' }} />
        <Stack.Screen name="boleto" options={{ title: 'Boleto' }} />
        <Stack.Screen name="apuestas" options={{ title: 'Mis apuestas' }} />
        <Stack.Screen name="billetera" options={{ title: 'Billetera' }} />
        <Stack.Screen name="cuenta" options={{ title: 'Mi cuenta' }} />
        <Stack.Screen name="juego-responsable" options={{ title: 'Juego responsable' }} />
        <Stack.Screen name="login" options={{ title: '' }} />
        <Stack.Screen name="registro" options={{ title: '' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
        <Stack.Screen name="terminos" options={{ title: 'Términos' }} />
      </Stack>
    </>
  );
}
