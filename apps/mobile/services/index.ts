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
  RoutePoint,
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
  requiredTruckType?: string | null;
  paymentMethod?: string | null;
  status: string;
  searchRadiusKm: number;
  biddingExpiresAt: string | null;
  matchedDriverId: string | null;
  matchedBidId?: string | null;
  createdAt: string;
  updatedAt: string;
  shipper?: { user?: { name?: string } } | null;
  bids?: Array<{ status: string; driver?: { user?: { name?: string } | null } | null }>;
}

interface ApiDriverUser {
  id: string;
  name: string;
  email?: string | null;
  profilePhotoUrl?: string | null;
}

interface ApiDriverProfile {
  id: string;
  userId: string;
  truckType?: string | null;
  capacityTonnes: number;
  truckRegistration: string;
  truckMake: string;
  truckModel: string;
  truckYear: number;
  truckPhotoUrl?: string | null;
  vehicleSidePhotoUrl?: string | null;
  licenceUrl?: string | null;
  licenceBackUrl?: string | null;
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
  distanceKm?: number | null;
  etaMinutes?: number | null;
  job?: ApiJob | null;
}

interface ApiEarnings {
  totalEarned: number;
  totalCommissionPaid: number;
  netEarned: number;
  jobsCompleted: number;
  averagePerJob: number;
  bestDay: { dayOfWeek: string; earned: number } | null;
  byDay: { dayOfWeek: string; earned: number; commissionPaid?: number }[];
  trendPercent: number | null;
  walletBalance: number;
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
    requiredTruckType: j.requiredTruckType ?? undefined,
    paymentMethod: j.paymentMethod ?? undefined,
    status: j.status as Job['status'],
    searchRadiusKm: j.searchRadiusKm,
    biddingExpiresAt: j.biddingExpiresAt ?? undefined,
    matchedDriverId: j.matchedDriverId ?? undefined,
    matchedDriverName: j.bids?.find(b => b.status === 'ACCEPTED')?.driver?.user?.name ?? undefined,
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
    truckType: d.truckType ?? undefined,
    capacityTonnes: d.capacityTonnes,
    truckRegistration: d.truckRegistration,
    truckMake: d.truckMake,
    truckModel: d.truckModel,
    truckYear: d.truckYear,
    truckPhotoUrl: d.truckPhotoUrl ?? undefined,
    vehicleSidePhotoUrl: d.vehicleSidePhotoUrl ?? undefined,
    licenceUrl: d.licenceUrl ?? undefined,
    licenceBackUrl: d.licenceBackUrl ?? undefined,
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
        } satisfies DriverProfile),
    offeredPrice: typeof b.offeredPrice === 'string' ? parseFloat(b.offeredPrice) : b.offeredPrice,
    currency: b.currency,
    status: b.status as Bid['status'],
    note: b.note ?? undefined,
    distanceKm: b.distanceKm ?? null,
    etaMinutes: b.etaMinutes ?? null,
    createdAt: b.createdAt,
    job: b.job ? toJob(b.job) : undefined,
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
    totalCommissionPaid: e.totalCommissionPaid ?? 0,
    netEarned: e.netEarned ?? e.totalEarned,
    previousWeekTotal: prevTotal,
    jobsCompleted: e.jobsCompleted,
    totalKm: 0,
    averagePerJob: e.averagePerJob,
    bestDay: e.bestDay
      ? { day: e.bestDay.dayOfWeek, amount: e.bestDay.earned }
      : { day: 'Mon', amount: 0 },
    walletBalance: e.walletBalance ?? 0,
    days: e.byDay.map((d) => ({ day: d.dayOfWeek, earned: d.earned, commissionPaid: d.commissionPaid ?? 0 })),
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

export async function sendOTP(phone: string): Promise<{ devOtp?: string }> {
  const data = await api.post<{ message: string; devOtp?: string }>('/auth/send-otp', { phone });
  return { devOtp: data.devOtp };
}

export async function verifyOTP(
  phone: string,
  code: string,
): Promise<{ user: User; token: string; isNewUser: boolean; activeRole: 'SHIPPER' | 'DRIVER' | 'BOTH' }> {
  const { role } = useAuthStore.getState();
  const apiRole = role === 'driver' ? 'DRIVER' : 'SHIPPER';

  const data = await api.post<{
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    activeRole: 'SHIPPER' | 'DRIVER' | 'BOTH';
  }>('/auth/verify-otp', { phone, code, role: apiRole });

  useAuthStore.getState().setRefreshToken(data.refreshToken);
  return { user: data.user, token: data.accessToken, isNewUser: data.isNewUser ?? false, activeRole: data.activeRole };
}

export async function switchRole(role: 'shipper' | 'driver'): Promise<string> {
  const apiRole = role === 'driver' ? 'DRIVER' : 'SHIPPER';
  const data = await api.post<{ accessToken: string; activeRole: string }>('/auth/switch-role', { role: apiRole });
  useAuthStore.getState().setToken(data.accessToken);
  useAuthStore.getState().setRole(role);
  return data.accessToken;
}

export async function updateProfile(updates: { name?: string; email?: string | null }): Promise<void> {
  await api.patch('/auth/me', updates);
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

export async function updateJobStatus(
  jobId: string,
  status: 'PICKUP_EN_ROUTE' | 'PICKUP_ARRIVED' | 'IN_TRANSIT',
): Promise<Job> {
  const data = await api.patch<{ job: ApiJob }>(`/jobs/${jobId}/status`, { status });
  return toJob(data.job);
}

export async function getShipperJobs(_shipperId: string, status?: string): Promise<Job[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await api.get<{ jobs: ApiJob[] }>(`/jobs${qs}`);
  return (data.jobs ?? []).map(toJob);
}

export async function getDriverActiveJobs(_driverId: string): Promise<Job[]> {
  const data = await api.get<{ jobs: ApiJob[] }>('/jobs?role=driver&view=active');
  return (data.jobs ?? []).map(toJob);
}

export async function getJobDirections(jobId: string): Promise<Array<{ latitude: number; longitude: number }>> {
  const data = await api.get<{ points: Array<{ latitude: number; longitude: number }> }>(`/jobs/${jobId}/directions`);
  return data.points ?? [];
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

export async function rejectBid(bidId: string): Promise<Bid> {
  const data = await api.patch<{ bid: ApiBid }>(`/bids/${bidId}/reject`);
  return toBid(data.bid);
}

export async function counterBid(bidId: string, price: number): Promise<Bid> {
  const data = await api.patch<{ bid: ApiBid }>(`/bids/${bidId}/counter`, { newPrice: price });
  return toBid(data.bid);
}

export async function getJobBids(jobId: string): Promise<Bid[]> {
  const data = await api.get<{ bids: ApiBid[] }>(`/bids?jobId=${jobId}`);
  return (data.bids ?? []).map(toBid);
}

export async function getMyBids(): Promise<Bid[]> {
  const data = await api.get<{ bids: ApiBid[] }>('/bids/mine');
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

export async function confirmPickup(jobId: string, photoUri?: string): Promise<void> {
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

export async function updateDriverProfile(fields: {
  truckType?: string;
  truckMake?: string;
  truckModel?: string;
  truckYear?: number;
  truckRegistration?: string;
  capacityTonnes?: 1 | 1.5 | 2 | 5 | 10 | 20 | 30;
  licenceUrl?: string;
  licenceBackUrl?: string;
  licenceExpiry?: string;
  registrationUrl?: string;
  registrationExpiry?: string;
  truckPhotoUrl?: string;
  vehicleSidePhotoUrl?: string;
  [key: string]: unknown;
}): Promise<void> {
  await api.patch('/drivers/me', fields);
}

export async function updateShipperProfile(fields: { companyName?: string | null }): Promise<void> {
  await api.patch('/shippers/me', fields);
}

export async function setDriverOnline(lat: number, lng: number): Promise<void> {
  await api.patch('/drivers/me/online', { lat, lng });
}

export async function setDriverOffline(): Promise<void> {
  await api.patch('/drivers/me/offline');
}

export async function getNearbyDrivers(lat: number, lng: number, radiusKm = 25): Promise<DriverProfile[]> {
  try {
    const data = await api.get<{ drivers: ApiDriverProfile[] }>(
      `/drivers/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`,
    );
    return (data.drivers ?? []).map(toDriverProfile);
  } catch {
    return [];
  }
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

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletBalance {
  balance: number;
  reservedBalance: number;
  commissionPct: number;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  return api.get<WalletBalance>('/wallet/me');
}

export async function initiateWalletDeposit(params: {
  amount: number;
  method: 'ecocash' | 'onemoney' | 'vmc';
  phone?: string;
}): Promise<{ transactionId: string; pollUrl: string; redirectUrl: string }> {
  return api.post<{ transactionId: string; pollUrl: string; redirectUrl: string }>(
    '/wallet/deposit',
    params,
  );
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

/**
 * Acknowledge a completed S3 upload.
 *
 * Returns:
 *   - s3Key: persist THIS in profile / delivery fields. The DB stores the key.
 *   - url:   a short-lived presigned URL for immediate in-app preview only.
 *            Do not persist; it expires in 1 hour and the API resolves fresh
 *            URLs on every read.
 */
export async function confirmUpload(s3Key: string): Promise<{ s3Key: string; url: string }> {
  return api.post<{ s3Key: string; url: string }>('/uploads/confirm', { s3Key });
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

// ─── Frequent locations ───────────────────────────────────────────────────────

export interface FrequentLocation {
  address: string;
  lat: number;
  lng: number;
  count: number;
}

export async function getFrequentLocations(): Promise<{
  pickups: FrequentLocation[];
  dropoffs: FrequentLocation[];
}> {
  try {
    const data = await api.get<{ pickups: FrequentLocation[]; dropoffs: FrequentLocation[] }>(
      '/shippers/me/frequent-locations',
    );
    return data;
  } catch {
    return { pickups: [], dropoffs: [] };
  }
}
