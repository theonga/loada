/**
 * Real service layer — same function signatures as services/mock/index.ts so all
 * screens just change their import from '@services/mock' to '@services'.
 *
 * The API uses Prisma types: Decimal fields arrive as strings ("480.00"), Date
 * fields as ISO strings, and relations as nested objects.  Transform functions
 * below normalise these into the mobile-side types defined in types/index.ts.
 */

import { api } from './api';
import { useAuthStore } from '@store/auth.store';
import { useLocationStore } from '@store/location.store';
import { SubscriptionStatus } from '@constants/index';
import type {
  User,
  Job,
  Bid,
  DriverProfile,
  Message,
  EarningsSummary,
  AppNotification,
  MarketReference,
  CreateJobInput,
} from '@/types';

// ─── Internal API response shapes ────────────────────────────────────────────
// (These mirror the Prisma/Fastify serialisation — not exported to screens.)

interface ApiJob {
  id: string;
  shipperId: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  cargoDescription: string;
  requiredTonnes: number;
  specialRequirements: string[];
  askingPrice: string | number;
  currency: string;
  status: string;
  searchRadiusKm: number;
  biddingExpiresAt: string | null;
  matchedDriverId: string | null;
  matchedBidId?: string | null;
  createdAt: string;
  updatedAt: string;
  shipper?: { user?: { name?: string } } | null;
  bids?: unknown[];
}

interface ApiDriverUser {
  id: string;
  name: string;
  profilePhotoUrl?: string | null;
}

interface ApiDriverProfile {
  id: string;
  userId: string;
  capacityTonnes: number;
  truckRegistration: string;
  truckMake: string;
  truckModel: string;
  truckYear: number;
  truckPhotoUrl?: string | null;
  licenceUrl?: string | null;
  licenceExpiry?: string | null;
  registrationUrl?: string | null;
  registrationExpiry?: string | null;
  documentStatus: string;
  isOnline: boolean;
  lastLocationLat?: number | null;
  lastLocationLng?: number | null;
  user?: ApiDriverUser | null;
}

interface ApiBid {
  id: string;
  jobId: string;
  driverId: string;
  offeredPrice: string | number;
  currency: string;
  status: string;
  note?: string | null;
  createdAt: string;
  driver?: ApiDriverProfile | null;
}

interface ApiEarnings {
  totalEarned: number;
  jobsCompleted: number;
  averagePerJob: number;
  bestDay: { dayOfWeek: string; earned: number } | null;
  byDay: { dayOfWeek: string; earned: number }[];
  subscriptionCost: number;
  trendPercent: number | null;
}

interface ApiMarketReference {
  low: number | null;
  median: number | null;
  high: number | null;
  jobCount: number;
  estimatedMatchMinutes: number;
  isFallback: boolean;
}

interface ApiMessage {
  id: string;
  jobId: string;
  senderId: string;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; name: string } | null;
}

// ─── Haversine distance (straight-line) ──────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Transform helpers ────────────────────────────────────────────────────────

function toJob(j: ApiJob): Job {
  return {
    id: j.id,
    shipperId: j.shipperId,
    shipperName: j.shipper?.user?.name ?? '',
    originAddress: j.originAddress,
    originLat: j.originLat,
    originLng: j.originLng,
    destAddress: j.destAddress,
    destLat: j.destLat,
    destLng: j.destLng,
    cargoDescription: j.cargoDescription,
    requiredTonnes: j.requiredTonnes,
    specialRequirements: j.specialRequirements ?? [],
    askingPrice: typeof j.askingPrice === 'string' ? parseFloat(j.askingPrice) : j.askingPrice,
    currency: j.currency,
    status: j.status as Job['status'],
    searchRadiusKm: j.searchRadiusKm,
    biddingExpiresAt: j.biddingExpiresAt ?? undefined,
    matchedDriverId: j.matchedDriverId ?? undefined,
    bidCount: Array.isArray(j.bids) ? j.bids.length : 0,
    distanceKm: Math.round(haversineKm(j.originLat, j.originLng, j.destLat, j.destLng)),
    estimatedHours: Math.round(haversineKm(j.originLat, j.originLng, j.destLat, j.destLng) / 70 * 10) / 10,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

function toDriverProfile(d: ApiDriverProfile): DriverProfile {
  return {
    id: d.id,
    userId: d.userId,
    name: d.user?.name ?? '',
    capacityTonnes: d.capacityTonnes,
    truckRegistration: d.truckRegistration,
    truckMake: d.truckMake,
    truckModel: d.truckModel,
    truckYear: d.truckYear,
    truckPhotoUrl: d.truckPhotoUrl ?? undefined,
    licenceUrl: d.licenceUrl ?? undefined,
    licenceExpiry: d.licenceExpiry ?? undefined,
    registrationUrl: d.registrationUrl ?? undefined,
    registrationExpiry: d.registrationExpiry ?? undefined,
    documentStatus: d.documentStatus as DriverProfile['documentStatus'],
    isOnline: d.isOnline,
    lastLocationLat: d.lastLocationLat ?? undefined,
    lastLocationLng: d.lastLocationLng ?? undefined,
    rating: 0,
    reviewCount: 0,
    yearsOnPlatform: 0,
    subscriptionStatus: 'ACTIVE' as DriverProfile['subscriptionStatus'],
  };
}

function toBid(b: ApiBid): Bid {
  return {
    id: b.id,
    jobId: b.jobId,
    driverId: b.driverId,
    driver: b.driver
      ? toDriverProfile(b.driver)
      : ({
          id: b.driverId,
          userId: '',
          name: 'Unknown driver',
          capacityTonnes: 0,
          truckRegistration: '',
          truckMake: '',
          truckModel: '',
          truckYear: 0,
          documentStatus: 'APPROVED' as DriverProfile['documentStatus'],
          isOnline: false,
          rating: 0,
          reviewCount: 0,
          yearsOnPlatform: 0,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        } satisfies DriverProfile),
    offeredPrice: typeof b.offeredPrice === 'string' ? parseFloat(b.offeredPrice) : b.offeredPrice,
    currency: b.currency,
    status: b.status as Bid['status'],
    note: b.note ?? undefined,
    createdAt: b.createdAt,
  };
}

function toEarnings(e: ApiEarnings): EarningsSummary {
  const prevTotal =
    e.trendPercent != null && e.trendPercent !== 0
      ? Math.round((e.totalEarned * 100) / (100 + e.trendPercent))
      : 0;

  return {
    weekLabel: 'This week',
    totalEarned: e.totalEarned,
    previousWeekTotal: prevTotal,
    jobsCompleted: e.jobsCompleted,
    totalKm: 0,
    averagePerJob: e.averagePerJob,
    bestDay: e.bestDay
      ? { day: e.bestDay.dayOfWeek, amount: e.bestDay.earned }
      : { day: 'Mon', amount: 0 },
    subscriptionCost: e.subscriptionCost,
    days: e.byDay.map((d) => ({ day: d.dayOfWeek, earned: d.earned })),
  };
}

function toMarketReference(m: ApiMarketReference, tonnes: number): MarketReference {
  const low = m.low ?? 0;
  const median = m.median ?? 0;
  const high = m.high ?? 0;
  const eta = m.estimatedMatchMinutes;
  return {
    route: '',
    tonnes,
    periodDays: 30,
    jobCount: m.jobCount,
    low,
    median,
    high,
    estimatedMatchMinutes: { min: Math.max(1, eta - 2), max: eta + 2 },
  };
}

function toMessage(m: ApiMessage): Message {
  return {
    id: m.id,
    jobId: m.jobId,
    senderId: m.senderId,
    senderName: m.sender?.name ?? '',
    content: m.content ?? undefined,
    mediaUrl: m.mediaUrl ?? undefined,
    mediaType: m.mediaType as Message['mediaType'] ?? undefined,
    isRead: m.isRead,
    createdAt: m.createdAt,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function sendOTP(phone: string): Promise<void> {
  await api.post('/auth/send-otp', { phone });
}

export async function verifyOTP(
  phone: string,
  code: string,
): Promise<{ user: User; token: string; isNewUser: boolean }> {
  const { role } = useAuthStore.getState();
  const apiRole = role === 'driver' ? 'DRIVER' : 'SHIPPER';

  const data = await api.post<{
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }>('/auth/verify-otp', { phone, code, role: apiRole });

  useAuthStore.getState().setRefreshToken(data.refreshToken);
  return { user: data.user, token: data.accessToken, isNewUser: data.isNewUser ?? false };
}

export async function updateProfile(name: string): Promise<void> {
  await api.patch('/auth/me', { name });
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function getAvailableLoads(_driverId: string): Promise<Job[]> {
  const location = useLocationStore.getState().driverLocation;
  const lat = location?.lat ?? -17.8252;
  const lng = location?.lng ?? 31.0335;
  const data = await api.get<{ jobs: ApiJob[] }>(`/jobs?role=driver&lat=${lat}&lng=${lng}`);
  return (data.jobs ?? []).map(toJob);
}

export async function getJobById(jobId: string): Promise<Job> {
  const data = await api.get<{ job: ApiJob }>(`/jobs/${jobId}`);
  return toJob(data.job);
}

export async function postJob(input: CreateJobInput): Promise<Job> {
  const data = await api.post<{ job: ApiJob }>('/jobs', input);
  return toJob(data.job);
}

export async function cancelJob(jobId: string): Promise<void> {
  await api.patch(`/jobs/${jobId}/cancel`);
}

export async function getShipperJobs(_shipperId: string): Promise<Job[]> {
  const data = await api.get<{ jobs: ApiJob[] }>('/jobs');
  return (data.jobs ?? []).map(toJob);
}

// ─── Bids ─────────────────────────────────────────────────────────────────────

export async function placeBid(jobId: string, price: number): Promise<Bid> {
  const data = await api.post<{ bid: ApiBid }>('/bids', { jobId, offeredPrice: price });
  return toBid(data.bid);
}

export async function acceptBid(bidId: string): Promise<Job> {
  const data = await api.patch<{ job: ApiJob }>(`/bids/${bidId}/accept`);
  return toJob(data.job);
}

export async function counterBid(bidId: string, price: number): Promise<Bid> {
  const data = await api.patch<{ bid: ApiBid }>(`/bids/${bidId}/counter`, { newPrice: price });
  return toBid(data.bid);
}

export async function getJobBids(jobId: string): Promise<Bid[]> {
  const data = await api.get<{ bids: ApiBid[] }>(`/bids?jobId=${jobId}`);
  return (data.bids ?? []).map(toBid);
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export async function getDelivery(jobId: string): Promise<import('@/types').Delivery | null> {
  try {
    const data = await api.get<{ pod: import('@/types').Delivery }>(`/deliveries/${jobId}/pod`);
    return data.pod ?? null;
  } catch {
    return null;
  }
}

export async function confirmPickup(jobId: string, photoUri: string): Promise<void> {
  await api.post(`/deliveries/${jobId}/pickup`, { photoUri });
}

export async function confirmDelivery(
  jobId: string,
  photoUri: string,
  recipientName: string,
): Promise<void> {
  await api.post(`/deliveries/${jobId}/confirm`, { photoUri, recipientName });
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export async function submitRating(
  jobId: string,
  toUserId: string,
  score: number,
  tags: string[],
  comment?: string,
): Promise<void> {
  await api.post('/ratings', { jobId, toUserId, score, tags, comment });
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export async function getEarningsSummary(_driverId: string): Promise<EarningsSummary> {
  const data = await api.get<{ earnings: ApiEarnings }>('/drivers/me/earnings');
  return toEarnings(data.earnings);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(_userId: string): Promise<AppNotification[]> {
  const data = await api.get<{ notifications: AppNotification[] }>('/notifications');
  return data.notifications ?? [];
}

// ─── Market reference ─────────────────────────────────────────────────────────

export async function getMarketReference(
  route: { originLat: number; originLng: number; destLat: number; destLng: number },
  tonnes: number,
): Promise<MarketReference> {
  const { originLat, originLng, destLat, destLng } = route;
  const qs = `originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}&tonnes=${tonnes}`;
  const data = await api.get<{ marketReference: ApiMarketReference }>(
    `/jobs/market-reference?${qs}`,
  );
  return toMarketReference(data.marketReference, tonnes);
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export async function getDriverProfile(profileId: string): Promise<DriverProfile> {
  const data = await api.get<{ driver: ApiDriverProfile }>(`/drivers/${profileId}`);
  return toDriverProfile(data.driver);
}

export async function getMyDriverProfile(): Promise<DriverProfile> {
  const data = await api.get<{ driver: ApiDriverProfile }>('/drivers/me');
  return toDriverProfile(data.driver);
}

export async function getMySubscription(): Promise<import('@/types').Subscription | null> {
  try {
    const data = await api.get<{ subscription: import('@/types').Subscription }>('/subscriptions/me');
    return data.subscription ?? null;
  } catch {
    return null;
  }
}

export async function initiateSubscription(params: {
  plan: 'WEEKLY' | 'MONTHLY' | 'ANNUAL';
  method: 'ecocash' | 'onemoney' | 'vmc';
  phone?: string;
  email?: string;
}): Promise<{ pollUrl: string; redirectUrl: string }> {
  const data = await api.post<{ pollUrl: string; redirectUrl: string; subscription: unknown }>('/subscriptions', params);
  return { pollUrl: data.pollUrl, redirectUrl: data.redirectUrl ?? '' };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(jobId: string): Promise<Message[]> {
  const data = await api.get<{ messages: ApiMessage[] }>(`/messages?jobId=${jobId}`);
  return (data.messages ?? []).map(toMessage);
}

export async function sendMessage(jobId: string, content: string): Promise<Message> {
  const data = await api.post<{ message: ApiMessage }>('/messages', { jobId, content });
  return toMessage(data.message);
}

// ─── Push notifications ────────────────────────────────────────────────────────

export async function registerPushToken(token: string): Promise<void> {
  await api.post('/notifications/fcm-token', { token });
}

// ─── S3 uploads ───────────────────────────────────────────────────────────────

export async function getPresignedUrl(
  purpose: string,
  mimeType: string,
): Promise<{ presignedUrl: string; s3Key: string }> {
  return api.post<{ presignedUrl: string; s3Key: string }>('/uploads/presign', { purpose, mimeType });
}

export async function confirmUpload(s3Key: string): Promise<{ url: string }> {
  return api.post<{ url: string }>('/uploads/confirm', { s3Key });
}

// ─── Places autocomplete ──────────────────────────────────────────────────────

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export async function getPlaceSuggestions(
  input: string,
  sessiontoken: string,
): Promise<PlacePrediction[]> {
  const data = await api.get<{ predictions: PlacePrediction[] }>(
    `/places/autocomplete?input=${encodeURIComponent(input)}&sessiontoken=${encodeURIComponent(sessiontoken)}`,
  );
  return data.predictions ?? [];
}

export async function reverseGeocodePlace(lat: number, lng: number): Promise<string> {
  const data = await api.get<{ address: string }>(
    `/places/reverse-geocode?lat=${lat}&lng=${lng}`,
  );
  return data.address;
}

export async function getPlaceDetails(
  placeId: string,
  sessiontoken?: string,
): Promise<{ lat: number; lng: number; address: string }> {
  const qs = sessiontoken
    ? `placeId=${encodeURIComponent(placeId)}&sessiontoken=${encodeURIComponent(sessiontoken)}`
    : `placeId=${encodeURIComponent(placeId)}`;
  const data = await api.get<{ place: { lat: number; lng: number; address: string } }>(
    `/places/details?${qs}`,
  );
  return data.place;
}
