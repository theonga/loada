import { useEffect } from 'react';
import { getSocket } from '@services/socket';
import { useAuthStore } from '@store/auth.store';

/**
 * Keeps a /jobs socket open whenever the shipper is in the app. The server
 * uses these socket connections as the source of truth for "online shippers"
 * on the admin overview. The socket auto-reconnects on transient failures and
 * is torn down on logout (via disconnectAll).
 */
export function useShipperPresence() {
  const role = useAuthStore((s) => s.role);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (role !== 'shipper' || !token) return;
    const socket = getSocket('/jobs');
    if (!socket.connected) socket.connect();
    // No need to subscribe to a specific job — the mere act of having an
    // authenticated /jobs connection registers the shipper as online.
    return () => {
      // Don't disconnect on unmount — other screens (bid inbox, tracking) may
      // share this socket. Logout handles teardown via disconnectAll().
    };
  }, [role, token]);
}
