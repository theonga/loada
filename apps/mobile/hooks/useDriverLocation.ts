import { useEffect, useState } from 'react';
import { getSocket } from '@services/socket';

export interface DriverPosition {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  etaSeconds?: number;
}

/**
 * Subscribes to live driver location updates via Socket.IO /location namespace.
 * Returns the latest known position, or null before the first update.
 * Used by the shipper tracking screen.
 */
export function useDriverLocation(jobId: string | undefined): DriverPosition | null {
  const [position, setPosition] = useState<DriverPosition | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const socket = getSocket('/location');
    socket.connect();
    socket.emit('location:subscribe', { jobId });

    const handleLocation = (data: DriverPosition) => {
      setPosition(data);
    };

    socket.on('location:driver', handleLocation);

    return () => {
      socket.off('location:driver', handleLocation);
      socket.emit('location:unsubscribe', { jobId });
    };
  }, [jobId]);

  return position;
}
