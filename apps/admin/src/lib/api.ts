const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const ADMIN_PREFIX = `${API_BASE}/v1/admin`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("loada_admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${ADMIN_PREFIX}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = (await res.json()) as { success: boolean; data?: T; error?: { code: string; message: string } };

  if (!body.success) {
    const msg = body.error?.message ?? "Unknown error";
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("loada_admin_token");
        window.location.href = "/login";
      }
    }
    throw new Error(msg);
  }

  return body.data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getStats: () =>
    request<{ stats: AdminStats }>("/stats"),

  getConfig: () =>
    request<{ config: Record<string, ConfigEntry> }>("/config"),

  patchConfig: (updates: Record<string, string>) =>
    request<{ updated: Record<string, string> }>("/config", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  getUsers: (params?: UserQuery) =>
    request<PaginatedUsers>(`/users?${new URLSearchParams(params as Record<string, string>)}`),

  suspendUser: (userId: string, reason: string) =>
    request<unknown>(`/users/${userId}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  unsuspendUser: (userId: string) =>
    request<unknown>(`/users/${userId}/unsuspend`, { method: "PATCH" }),

  getDrivers: (params?: DriverQuery) =>
    request<PaginatedDrivers>(`/drivers?${new URLSearchParams(params as Record<string, string>)}`),

  approveDocs: (driverId: string) =>
    request<unknown>(`/drivers/${driverId}/approve-docs`, { method: "PATCH" }),

  rejectDocs: (driverId: string, reason: string) =>
    request<unknown>(`/drivers/${driverId}/reject-docs`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  getJobs: (params?: JobQuery) =>
    request<PaginatedJobs>(`/jobs?${new URLSearchParams(params as Record<string, string>)}`),

  getJob: (jobId: string) =>
    request<{ job: JobDetail }>(`/jobs/${jobId}`),

  cancelJob: (jobId: string, reason: string) =>
    request<unknown>(`/jobs/${jobId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  getWallets: (params?: WalletQuery) =>
    request<PaginatedWallets>(`/wallets?${new URLSearchParams(params as Record<string, string>)}`),

  adjustWallet: (driverId: string, amount: number, note: string) =>
    request<{ wallet: WalletRecord }>(`/wallets/${driverId}/adjust`, {
      method: "PATCH",
      body: JSON.stringify({ amount, note }),
    }),

  getAnalytics: (params: AnalyticsQuery) =>
    request<AnalyticsData>(`/analytics?${new URLSearchParams(params as Record<string, string>)}`),

  getFlaggedMessages: (params?: { page?: string; limit?: string }) =>
    request<PaginatedFlaggedMessages>(`/audit/flagged-messages?${new URLSearchParams(params as Record<string, string>)}`),

  getLowBids: (params?: { page?: string; limit?: string }) =>
    request<PaginatedLowBids>(`/audit/low-bids?${new URLSearchParams(params as Record<string, string>)}`),

  bulkSuspendUsers:    (ids: string[], reason: string) =>
    request<{ updated: number }>("/users/bulk-suspend",   { method: "POST", body: JSON.stringify({ ids, reason }) }),

  bulkUnsuspendUsers:  (ids: string[]) =>
    request<{ updated: number }>("/users/bulk-unsuspend", { method: "POST", body: JSON.stringify({ ids }) }),

  bulkApproveDriverDocs: (ids: string[]) =>
    request<{ updated: number }>("/drivers/bulk-approve-docs", { method: "POST", body: JSON.stringify({ ids }) }),

  bulkRejectDriverDocs:  (ids: string[], reason: string) =>
    request<{ updated: number }>("/drivers/bulk-reject-docs",  { method: "POST", body: JSON.stringify({ ids, reason }) }),

  bulkCancelJobs: (ids: string[], reason: string) =>
    request<{ updated: number }>("/jobs/bulk-cancel", { method: "POST", body: JSON.stringify({ ids, reason }) }),
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalShippers: number;
  onlineDrivers: number;
  onlineShippers: number;
  totalJobs: number;
  activeJobs: number;
  completedJobsToday: number;
  pendingDocuments: number;
  totalWalletFunds: number;
  totalCommissionCollected: number;
  commissionThisMonth: number;
}

export interface ConfigEntry {
  value: string;
  label: string;
  group: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UserRecord {
  id: string;
  name: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  createdAt: string;
}

export interface DriverRecord {
  id: string;
  userId: string;
  capacityTonnes: number;
  truckRegistration: string;
  truckMake: string;
  truckModel: string;
  truckYear?: number | null;
  truckPhotoUrl?: string | null;
  licenceUrl?: string | null;
  licenceExpiry?: string | null;
  registrationUrl?: string | null;
  registrationExpiry?: string | null;
  documentStatus: string;
  isOnline: boolean;
  user: UserRecord;
}

export interface WalletTxRecord {
  id: string;
  type: string;
  amount: string;
  note: string | null;
  createdAt: string;
}

export interface WalletRecord {
  id: string;
  driverId: string;
  balance: string;
  reservedBalance: string;
  createdAt: string;
  updatedAt: string;
  driver: { user: UserRecord };
  transactions: WalletTxRecord[];
}

export interface JobRecord {
  id: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  cargoDescription: string;
  requiredTonnes: number;
  specialRequirements: string[];
  askingPrice: string;
  currency: string;
  requiredTruckType?: string | null;
  paymentMethod?: string | null;
  status: string;
  searchRadiusKm: number;
  biddingExpiresAt: string | null;
  matchedDriverId: string | null;
  matchedBidId: string | null;
  createdAt: string;
  updatedAt: string;
  shipper: { user: UserRecord; companyName?: string | null };
  bids: Array<JobBidSummary>;
  delivery: JobDeliverySummary | null;
  _count?: { bids: number; messages: number };
}

export interface JobBidSummary {
  id: string;
  driverId: string;
  offeredPrice: string;
  currency: string;
  status: string;
  note?: string | null;
  commissionAmount?: string | null;
  createdAt: string;
  driver: {
    id: string;
    truckMake: string;
    truckModel: string;
    truckRegistration: string;
    capacityTonnes: number;
    user: UserRecord;
  };
}

export interface JobDeliverySummary {
  id: string;
  pickupConfirmedAt: string | null;
  pickupPhotoUrl: string | null;
  deliveredAt: string | null;
  deliveryPhotoUrl: string | null;
  recipientName: string | null;
  signatureUrl: string | null;
}

export interface JobDetail extends JobRecord {
  messages: Array<{
    id: string;
    senderId: string;
    content: string | null;
    mediaUrl: string | null;
    isRead: boolean;
    createdAt: string;
    sender: UserRecord | null;
  }>;
  ratings: Array<{
    id: string;
    score: number;
    comment: string | null;
    tags: string[];
    createdAt: string;
    fromUser: UserRecord;
    toUser: UserRecord;
  }>;
}

interface UserQuery { page?: string; limit?: string; role?: string; search?: string; suspended?: string }
interface DriverQuery { page?: string; limit?: string; documentStatus?: string }
interface JobQuery { page?: string; limit?: string; status?: string }
interface WalletQuery { page?: string; limit?: string; search?: string }

interface PaginatedUsers { users: UserRecord[]; total: number; page: number; limit: number }
interface PaginatedDrivers { drivers: DriverRecord[]; total: number; page: number; limit: number }
interface PaginatedJobs { jobs: JobRecord[]; total: number; page: number; limit: number }

export interface FlaggedMessageRecord {
  id: string;
  jobId: string;
  senderId: string;
  content: string | null;
  flaggedReason: string;
  createdAt: string;
  sender: { id: string; name: string; phone: string; role: string };
  job:    { id: string; originAddress: string; destAddress: string; status: string; shipperId: string };
}

interface PaginatedFlaggedMessages {
  messages: FlaggedMessageRecord[];
  total:    number;
  page:     number;
  limit:    number;
}

export interface LowBidJobRecord {
  id:              string;
  originAddress:   string;
  destAddress:     string;
  requiredTonnes:  number;
  askingPrice:     string;
  bidPrice:        string;
  currency:        string;
  status:          string;
  createdAt:       string;
  shipperName:     string;
  driverName:      string;
  distanceKm:      number;
  estimatedMarket: number;
  ratioPct:        number;
}

interface PaginatedLowBids {
  jobs:      LowBidJobRecord[];
  threshold: number;
  page:      number;
  limit:     number;
}
export interface WalletStats {
  /** balance + reservedBalance summed across every wallet — matches stats.totalWalletFunds */
  totalHeld:      number;
  /** sum of reservedBalance across every wallet */
  totalReserved:  number;
  /** sum of balance (i.e. available to spend) across every wallet */
  totalAvailable: number;
  /** count of wallets with $0 balance AND $0 reserved (truly empty) */
  zeroCount:      number;
  /** total number of driver wallets */
  driversCount:   number;
  /** totalHeld / driversCount */
  avg:            number;
}

interface PaginatedWallets {
  wallets: WalletRecord[];
  total:   number;
  page:    number;
  limit:   number;
  stats:   WalletStats;
}

export interface AnalyticsQuery {
  from?:        string;
  to?:          string;
  granularity?: "day" | "week" | "month";
}

export interface AnalyticsData {
  series: {
    jobs:    Array<{ date: string; created: number; completed: number }>;
    revenue: Array<{ date: string; amount: number }>;
    users:   Array<{ date: string; newUsers: number }>;
  };
  breakdown: {
    jobsByStatus:      Record<string, number>;
    walletBalanceBands: Record<string, number>;
  };
}
