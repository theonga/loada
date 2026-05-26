import { useEffect, useCallback } from 'react';
import { getSocket } from '@services/socket';
import type { Bid } from '@/types';

interface RawBid {
  id: string;
  jobId: string;
  driverId: string;
  offeredPrice: string | number;
  currency: string;
  status: string;
  note?: string | null;
  createdAt: string;
  driver?: {
    id: string;
    userId: string;
    user?: { name?: string } | null;
    capacityTonnes: number;
    truckRegistration: string;
    truckMake: string;
    truckModel: string;
    truckYear: number;
    documentStatus: string;
    isOnline: boolean;
  } | null;
}

function parseBid(raw: RawBid): Bid {
  return {
    id: raw.id,
    jobId: raw.jobId,
    driverId: raw.driverId,
    offeredPrice: typeof raw.offeredPrice === 'string' ? parseFloat(raw.offeredPrice) : raw.offeredPrice,
    currency: raw.currency,
    status: raw.status as Bid['status'],
    note: raw.note ?? undefined,
    createdAt: raw.createdAt,
    driver: {
      id: raw.driver?.id ?? raw.driverId,
      userId: raw.driver?.userId ?? '',
      name: raw.driver?.user?.name ?? 'Driver',
      capacityTonnes: raw.driver?.capacityTonnes ?? 0,
      truckRegistration: raw.driver?.truckRegistration ?? '',
      truckMake: raw.driver?.truckMake ?? '',
      truckModel: raw.driver?.truckModel ?? '',
      truckYear: raw.driver?.truckYear ?? 0,
      documentStatus: (raw.driver?.documentStatus ?? 'APPROVED') as Bid['driver']['documentStatus'],
      isOnline: raw.driver?.isOnline ?? false,
      rating: 0,
      reviewCount: 0,
      yearsOnPlatform: 0,
      subscriptionStatus: 'ACTIVE' as Bid['driver']['subscriptionStatus'],
    },
  };
}

/**
 * Subscribes to live bid updates for a job via Socket.IO /jobs namespace.
 * Calls onBid with a normalised Bid object each time a new bid arrives.
 * Also calls onJobUpdate when job status changes (radius expanded, matched, expired).
 */
export function useLiveBids(
  jobId: string | undefined,
  onBid: (bid: Bid) => void,
  onJobUpdate?: (status: string) => void,
) {
  const stableOnBid = useCallback(onBid, []);
  const stableOnJobUpdate = useCallback(onJobUpdate ?? (() => {}), []);

  useEffect(() => {
    if (!jobId) return;

    const socket = getSocket('/jobs');
    socket.connect();
    socket.emit('job:subscribe', { jobId });

    const handleBid = (raw: RawBid) => {
      stableOnBid(parseBid(raw));
    };

    const handleStatusChange = (data: { status: string }) => {
      stableOnJobUpdate(data.status);
    };

    socket.on('job:bid_received', handleBid);
    socket.on('job:status_changed', handleStatusChange);
    socket.on('job:radius_expanded', () => stableOnJobUpdate('RADIUS_EXPANDED'));
    socket.on('job:expired', () => stableOnJobUpdate('EXPIRED'));

    return () => {
      socket.off('job:bid_received', handleBid);
      socket.off('job:status_changed', handleStatusChange);
      socket.off('job:radius_expanded');
      socket.off('job:expired');
      socket.emit('job:unsubscribe', { jobId });
    };
  }, [jobId]);
}
