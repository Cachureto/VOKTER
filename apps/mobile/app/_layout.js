import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/lib/auth-context';
import { onNotificationTap } from '../src/lib/push';
import { CartProvider } from '../src/lib/cart-context';
import { MenuProvider } from '../src/lib/menu-context';
import HeaderActions, { HeaderLeft } from '../src/components/HeaderActions';
import MainMenu from '../src/components/MainMenu';
import { ThemeProvider, useTheme } from '../src/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MenuProvider>
            <SafeAreaProvider>
              <NotificationRouter />
              <ThemedStack />
              <MainMenu />
            </SafeAreaProvider>
          </MenuProvider>
        </CartProvider>
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
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
          // Menú a la izquierda (por ahí entra el panel); modo y carrito a la derecha.
          headerLeft: ({ canGoBack }) => <HeaderLeft canGoBack={canGoBack} />,
          headerRight: () => <HeaderActions />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="catalogo" options={{ title: '' }} />
        <Stack.Screen name="asistente" options={{ title: '' }} />
        <Stack.Screen name="product/[slug]" options={{ title: '' }} />
        <Stack.Screen name="drops" options={{ title: 'Drops' }} />
        <Stack.Screen name="escaner" options={{ title: 'Autenticidad' }} />
        <Stack.Screen name="carrito" options={{ title: 'Carrito' }} />
        <Stack.Screen name="pedidos" options={{ title: 'Mis pedidos' }} />
        <Stack.Screen name="cuenta" options={{ title: 'Cuenta' }} />
        <Stack.Screen name="login" options={{ title: '' }} />
        <Stack.Screen name="registro" options={{ title: '' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      </Stack>
    </>
  );
}

/**
 * Abre la pantalla de drops cuando el usuario toca una notificación,
 * ya sea con la app abierta o desde la app cerrada.
 */
function NotificationRouter() {
  const router = useRouter();

  useEffect(
    () =>
      onNotificationTap((response) => {
        if (response?.notification?.request?.content?.data?.type === 'drop') {
          router.push('/drops');
        }
      }),
    [router],
  );

  return null;
}
