import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { apiFetch } from './api';

/**
 * Expo Go quitó las notificaciones remotas en el SDK 53, y en Android
 * `expo-notifications` lanza un error **al importarse**: su módulo
 * DevicePushTokenAutoRegistration registra un listener de token en el ámbito
 * global, y ese listener es justo lo que ya no existe.
 *
 * Por eso el módulo se carga con un require() en línea y solo fuera de Expo Go.
 * Con un import normal arriba, el error saltaría al abrir la app y ningún
 * try/catch nuestro podría atraparlo. Se usa require() y no import() dinámico
 * porque este último obliga a Metro a partir el bundle, y el trozo aparte se
 * queda colgado al cargar en el teléfono.
 */
export const isExpoGo = (() => {
  try {
    return isRunningInExpoGo();
  } catch {
    return Constants.appOwnership === 'expo';
  }
})();

let cache; // undefined = sin intentar, null = no disponible
let configurado = false;

function loadNotifications() {
  if (cache !== undefined) return cache;
  if (isExpoGo || Platform.OS === 'web') {
    cache = null;
    return cache;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cache = require('expo-notifications');
  } catch {
    cache = null;
  }
  if (cache && !configurado) {
    configurado = true;
    try {
      cache.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      if (Platform.OS === 'android') {
        // El backend manda channelId 'drops', así que el canal debe existir.
        cache
          .setNotificationChannelAsync('drops', {
            name: 'Drops',
            importance: cache.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00a2e8',
          })
          .catch(() => {});
      }
    } catch {
      // ignorar
    }
  }
  return cache;
}

function projectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined
  );
}

function esDispositivoReal() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-device').isDevice;
  } catch {
    return true; // si no se puede comprobar, el token dirá si funciona
  }
}

/**
 * Pide permiso, obtiene el token de Expo y lo registra en el backend.
 * Nunca lanza: devuelve { token, reason } y la app sigue funcionando sin push.
 */
export async function registerForPush() {
  if (isExpoGo) return { token: null, reason: 'expo-go' };

  const Notifications = loadNotifications();
  if (!Notifications) return { token: null, reason: 'no-disponible' };
  if (!esDispositivoReal()) return { token: null, reason: 'emulador' };

  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      if (!current.canAskAgain) return { token: null, reason: 'permiso-denegado' };
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return { token: null, reason: 'permiso-denegado' };

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });

    try {
      await apiFetch('/api/notifications/token', {
        method: 'POST',
        auth: true,
        body: { expoToken: token, platform: Platform.OS },
      });
    } catch {
      return { token, reason: 'no-registrado-en-servidor' };
    }

    return { token, reason: null };
  } catch {
    // Build sin credenciales de push, permiso revocado a medias, etc.
    return { token: null, reason: 'no-disponible' };
  }
}

/** Al cerrar sesión, este teléfono deja de recibir avisos de esa cuenta. */
export async function unregisterPush(token) {
  if (!token) return;
  try {
    await apiFetch('/api/notifications/token', {
      method: 'DELETE',
      auth: true,
      body: { expoToken: token },
    });
  } catch {
    // Si el servidor no responde, el token se limpia solo cuando Expo lo
    // reporte como no registrado.
  }
}

/**
 * Suscribe la navegación a los toques sobre una notificación.
 * Devuelve la función de limpieza. No hace nada en Expo Go.
 */
export function onNotificationTap(handler) {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};

  let alive = true;
  let subscription = null;

  try {
    // La app estaba cerrada y se abrió tocando la notificación.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (alive && response) handler(response);
      })
      .catch(() => {});

    subscription = Notifications.addNotificationResponseReceivedListener(handler);
  } catch {
    // Sin soporte de notificaciones remotas: no pasa nada.
  }

  return () => {
    alive = false;
    try {
      subscription?.remove();
    } catch {
      // ignorar
    }
  };
}
