import { useEffect } from 'react';
import { getSocket } from '@services/socket';

const HEARTBEAT_MS = 30_000; // server TTL is 60s; heartbeat at half that

/**
 * Marks the current driver as actively viewing the given job. The server keeps
 * a Redis sorted set of viewers per job and broadcasts the count to the job's
 * shipper. The mount sends an immediate `job:view`, then a heartbeat every 30s
 * to keep presence alive. Unmount fires `job:unview` and the server cleans up.
 *
 * Pass `undefined` (or rely on no-op when jobId is empty) to disable.
 */
export function useJobViewerPresence(jobId: string | undefined) {
  useEffect(() => {
    if (!jobId) return;

    const socket = getSocket('/jobs');
    if (!socket.connected) socket.connect();

    const ping = () => socket.emit('job:view', { jobId });
    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);

    return () => {
      clearInterval(interval);
      socket.emit('job:unview', { jobId });
    };
  }, [jobId]);
}
