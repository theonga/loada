import { useEffect } from 'react';
import { useJobStore } from '@store/job.store';
import { getDriverActiveJobs } from '@services';

const ACTIVE_STATUSES = ['MATCHED', 'PICKUP_EN_ROUTE', 'PICKUP_ARRIVED', 'LOADED', 'IN_TRANSIT'];

/**
 * Returns the active job from the store, and self-heals if the store is empty
 * (e.g. app was backgrounded, push notification deep-link bypassed the loads screen).
 */
export function useEnsureActiveJob() {
  const job = useJobStore((s) => s.activeJob);
  const setActiveJob = useJobStore((s) => s.setActiveJob);

  useEffect(() => {
    if (job) return;
    getDriverActiveJobs('')
      .then((jobs) => {
        const active = jobs.find((j) => ACTIVE_STATUSES.includes(j.status));
        if (active) setActiveJob(active);
      })
      .catch(() => {});
  }, []);

  return job;
}
