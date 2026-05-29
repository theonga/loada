import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { JobStatus } from '@constants/index';
import type { Job } from '@/types';

/**
 * Maps an active-job status to the screen the driver should currently be on.
 * Returns null for terminal/idle statuses where the driver shouldn't be in the
 * active flow at all.
 */
export function activeScreenForStatus(status: Job['status'] | undefined): string | null {
  switch (status) {
    case JobStatus.MATCHED:
    case JobStatus.PICKUP_EN_ROUTE:
      return '/(driver)/active/en-route';
    case JobStatus.PICKUP_ARRIVED:
    case JobStatus.LOADED:
      return '/(driver)/active/pickup';
    case JobStatus.IN_TRANSIT:
      return '/(driver)/active/in-transit';
    case JobStatus.DELIVERED:
      return '/(driver)/active/complete';
    default:
      return null;
  }
}

/**
 * Guards an active-flow screen against a stale local status. If the job's
 * current status belongs to a different screen, we redirect there — this fixes
 * the "I've arrived at pickup is still showing even though I'm IN_TRANSIT" bug
 * which used to happen when the driver re-opened the active job from home.
 *
 * Pass the screen's own path so it doesn't redirect onto itself.
 */
export function useActiveJobRouteGuard(job: Job | null | undefined, expectedPath: string) {
  const router = useRouter();
  useEffect(() => {
    if (!job) return;
    const target = activeScreenForStatus(job.status);
    if (!target) return;
    if (target !== expectedPath) {
      router.replace(target as never);
    }
  }, [job?.id, job?.status, expectedPath, router]);
}
