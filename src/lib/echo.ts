import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getApiBaseUrl, getStoredToken } from '@/lib/apiClient';

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

let echo: Echo | null = null;
let echoUserId: string | null = null;

/**
 * Shared Laravel Echo client (Reverb) for the signed-in user.
 * Returns null when realtime is not configured or no token is stored.
 * Recreated automatically when the signed-in user changes.
 */
export function getEcho(userId: string): Echo | null {
  const key = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
  if (!key) return null;

  const token = getStoredToken();
  if (!token) return null;

  if (echo && echoUserId === userId) return echo;

  if (echo) {
    echo.disconnect();
    echo = null;
  }

  const host = (import.meta.env.VITE_REVERB_HOST as string | undefined) || '127.0.0.1';
  const port = Number(import.meta.env.VITE_REVERB_PORT || 6001);
  const scheme = ((import.meta.env.VITE_REVERB_SCHEME as string | undefined) || 'http').replace('://', '');

  echo = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${getApiBaseUrl()}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  echoUserId = userId;
  return echo;
}

export function disconnectEcho(): void {
  if (echo) {
    echo.disconnect();
    echo = null;
    echoUserId = null;
  }
}
