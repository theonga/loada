import { router } from 'expo-router';
import { showAlert } from '@components/ui/AppAlert';
import { getShipperJobs, getDriverActiveJobs } from '@services';
import { activeScreenForStatus } from '@hooks/useActiveJobRoute';
import { JobStatus } from '@constants/index';
import type { Job } from '@/types';

const ACTIVE_STATUSES: Job['status'][] = [
  JobStatus.MATCHED,
  JobStatus.PICKUP_EN_ROUTE,
  JobStatus.PICKUP_ARRIVED,
  JobStatus.LOADED,
  JobStatus.IN_TRANSIT,
  JobStatus.DELIVERED,
];

function isActive(j: Job): boolean {
  return ACTIVE_STATUSES.includes(j.status);
}

export async function handleShipperActiveJobConflict(err: unknown): Promise<boolean> {
  const code = (err as { code?: string }).code;
  if (code !== 'ACTIVE_JOB_EXISTS') return false;

  let jobId: string | null = null;
  try {
    const jobs = await getShipperJobs('');
    jobId = jobs.find(isActive)?.id ?? null;
  } catch {
    // best-effort lookup
  }

  showAlert({
    icon: 'briefcase-outline',
    iconVariant: 'accent',
    title: 'You already have an active job',
    message: 'Wrap up your current load before posting a new one. Confirm delivery from the active job screen.',
    buttons: [
      { label: 'Not now', variant: 'default' },
      {
        label: jobId ? 'Open active job' : 'View my jobs',
        variant: 'accent',
        onPress: () => {
          if (jobId) router.push(`/(shipper)/tracking/${jobId}` as never);
          else router.push('/(shipper)/jobs' as never);
        },
      },
    ],
  });
  return true;
}

export async function handleDriverActiveJobConflict(err: unknown): Promise<boolean> {
  const code = (err as { code?: string }).code;
  if (code !== 'ACTIVE_JOB_IN_PROGRESS') return false;

  let target: string | null = null;
  try {
    const jobs = await getDriverActiveJobs('');
    const active = jobs.find(isActive);
    if (active) target = activeScreenForStatus(active.status);
  } catch {
    // best-effort lookup
  }

  showAlert({
    icon: 'navigate-outline',
    iconVariant: 'accent',
    title: 'You already have an active job',
    message: 'Finish your current delivery before bidding on another load. Tap below to mark it complete.',
    buttons: [
      { label: 'Not now', variant: 'default' },
      {
        label: target ? 'Open active job' : 'View my loads',
        variant: 'accent',
        onPress: () => {
          if (target) router.push(target as never);
          else router.push('/(driver)/loads' as never);
        },
      },
    ],
  });
  return true;
}
