import { BidStatus, JobStatus } from '@constants/index';
import type {
  User,
  Job,
  Bid,
  EarningsSummary,
  AppNotification,
  MarketReference,
  CreateJobInput,
} from '@/types';
import {
  MOCK_SHIPPER,
  MOCK_DRIVER,
  MOCK_JOBS,
  MOCK_BIDS,
  MOCK_EARNINGS,
  MOCK_NOTIFICATIONS,
  MOCK_MARKET_REFERENCE,
} from './data';

let pendingRole: 'shipper' | 'driver' = 'shipper';

export function setPendingRole(role: 'shipper' | 'driver'): void {
  pendingRole = role;
}

function delay(ms?: number): Promise<void> {
  const wait = ms ?? Math.floor(Math.random() * 500) + 300;
  return new Promise((resolve) => setTimeout(resolve, wait));
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function sendOTP(_phone: string): Promise<void> {
  await delay(400);
}

export async function verifyOTP(
  _phone: string,
  _code: string,
): Promise<{ user: User; token: string }> {
  await delay(600);
  const user = pendingRole === 'driver' ? MOCK_DRIVER : MOCK_SHIPPER;
  return { user, token: 'mock-jwt-token-xxxx' };
}

// ─── JOBS ────────────────────────────────────────────────────────────────────

export async function getAvailableLoads(_driverId: string): Promise<Job[]> {
  await delay();
  return MOCK_JOBS.filter(
    (j) => j.status === JobStatus.POSTED || j.status === JobStatus.BIDDING,
  );
}

export async function getJobById(jobId: string): Promise<Job> {
  await delay();
  const job = MOCK_JOBS.find((j) => j.id === jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  return job;
}

export async function postJob(data: CreateJobInput): Promise<Job> {
  await delay(700);
  const job: Job = {
    id: `job-${Date.now()}`,
    shipperId: MOCK_SHIPPER.id,
    shipperName: MOCK_SHIPPER.name,
    ...data,
    status: JobStatus.POSTED,
    searchRadiusKm: 25,
    bidCount: 0,
    distanceKm: 0,
    estimatedHours: 0,
    biddingExpiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return job;
}

export async function cancelJob(_jobId: string): Promise<void> {
  await delay();
}

export async function getShipperJobs(_shipperId: string): Promise<Job[]> {
  await delay();
  return MOCK_JOBS;
}

// ─── BIDS ────────────────────────────────────────────────────────────────────

export async function placeBid(jobId: string, price: number): Promise<Bid> {
  await delay(500);
  const bid: Bid = {
    id: `bid-${Date.now()}`,
    jobId,
    driverId: MOCK_DRIVER.id,
    driver: {
      id: 'dp-001',
      userId: MOCK_DRIVER.id,
      name: MOCK_DRIVER.name,
      capacityTonnes: 10,
      truckRegistration: 'ABZ 4521',
      truckMake: 'Hino',
      truckModel: 'Hino 500',
      truckYear: 2019,
      documentStatus: 'APPROVED',
      isOnline: true,
      rating: 4.8,
      reviewCount: 142,
      yearsOnPlatform: 2,
    },
    offeredPrice: price,
    currency: 'USD',
    status: BidStatus.PENDING,
    createdAt: new Date().toISOString(),
  };
  return bid;
}

export async function acceptBid(bidId: string): Promise<Job> {
  await delay(600);
  const bid = MOCK_BIDS.find((b) => b.id === bidId);
  const job = MOCK_JOBS.find((j) => j.id === bid?.jobId) ?? MOCK_JOBS[0];
  return { ...job, status: JobStatus.MATCHED, matchedDriverId: bid?.driverId };
}

export async function counterBid(bidId: string, price: number): Promise<Bid> {
  await delay();
  const bid = MOCK_BIDS.find((b) => b.id === bidId);
  if (!bid) throw new Error(`Bid ${bidId} not found`);
  return { ...bid, offeredPrice: price, status: BidStatus.COUNTERED };
}

export async function getJobBids(jobId: string): Promise<Bid[]> {
  await delay();
  return MOCK_BIDS.filter((b) => b.jobId === jobId);
}

// ─── DELIVERY ────────────────────────────────────────────────────────────────

export async function confirmPickup(
  _jobId: string,
  _photoUri: string,
): Promise<void> {
  await delay(800);
}

export async function confirmDelivery(
  _jobId: string,
  _photoUri: string,
  _recipientName: string,
): Promise<void> {
  await delay(800);
}

// ─── RATINGS ────────────────────────────────────────────────────────────────

export async function submitRating(
  _jobId: string,
  _toUserId: string,
  _score: number,
  _tags: string[],
): Promise<void> {
  await delay(500);
}

// ─── EARNINGS ────────────────────────────────────────────────────────────────

export async function getEarningsSummary(
  _driverId: string,
): Promise<EarningsSummary> {
  await delay();
  return MOCK_EARNINGS;
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

export async function getNotifications(
  _userId: string,
): Promise<AppNotification[]> {
  await delay();
  return MOCK_NOTIFICATIONS;
}

// ─── MARKET REFERENCE ────────────────────────────────────────────────────────

export async function getMarketReference(
  _route: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
  },
  _tonnes: number,
): Promise<MarketReference> {
  await delay();
  return MOCK_MARKET_REFERENCE;
}
