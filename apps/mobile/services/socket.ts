import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@store/auth.store';

const BASE = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

type Namespace = '/jobs' | '/location' | '/chat';

const _sockets: Partial<Record<Namespace, Socket>> = {};

/**
 * Returns a singleton socket for the given namespace.
 * The socket is created lazily with the current auth token.
 * Call disconnectAll() on logout to tear down and reset.
 */
export function getSocket(namespace: Namespace): Socket {
  if (!_sockets[namespace]) {
    const token = useAuthStore.getState().token;
    _sockets[namespace] = io(`${BASE}${namespace}`, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });
  }
  return _sockets[namespace]!;
}

export function disconnectAll(): void {
  (Object.values(_sockets) as Socket[]).forEach((s) => s.disconnect());
  (Object.keys(_sockets) as Namespace[]).forEach((k) => delete _sockets[k]);
}
