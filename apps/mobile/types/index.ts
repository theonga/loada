import { JobStatus, BidStatus } from '@constants/index';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  role: 'SHIPPER' | 'DRIVER' | 'BOTH';
  profilePhotoUrl?: string;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export interface ShipperProfile {
  id: string;
  userId: string;
  companyName?: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  truckType?: string;
  capacityTonnes: number;
  truckRegistration: string;
  truckMake: string;
  truckModel: string;
  truckYear: number;
  truckPhotoUrl?: string;
  vehicleSidePhotoUrl?: string;
  licenceUrl?: string;
  licenceBackUrl?: string;
  licenceExpiry?: string;
  registrationUrl?: string;
  registrationExpiry?: string;
  documentStatus: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  isOnline: boolean;
  lastLocationLat?: number;
  lastLocationLng?: number;
  rating: number;
  reviewCount: number;
  yearsOnPlatform: number;
}

export interface Job {
  id: string;
  shipperId: string;
  shipperName: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  cargoDescription: string;
  requiredTonnes: number;
  specialRequirements: string[];
  askingPrice: number;
  currency: string;
  requiredTruckType?: string;
  paymentMethod?: string;
  status: JobStatus;
  searchRadiusKm: number;
  biddingExpiresAt?: string;
  matchedDriverId?: string;
  matchedDriverName?: string;
  bidCount: number;
  distanceKm: number;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  jobId: string;
  driverId: string;
  driver: DriverProfile;
  offeredPrice: number;
  currency: string;
  status: BidStatus;
  note?: string;
  isBestMatch?: boolean;
  distanceKm?: number | null;
  etaMinutes?: number | null;
  createdAt: string;
  job?: Job;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Message {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'voice';
  isRead: boolean;
  createdAt: string;
}

export interface Delivery {
  id: string;
  jobId: string;
  pickupConfirmedAt?: string;
  pickupPhotoUrl?: string;
  deliveredAt?: string;
  deliveryPhotoUrl?: string;
  recipientName?: string;
  signatureUrl?: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment?: string;
  tags: string[];
  createdAt: string;
}


export interface EarningsSummary {
  weekLabel: string;
  totalEarned: number;
  totalCommissionPaid: number;
  netEarned: number;
  previousWeekTotal: number;
  jobsCompleted: number;
  totalKm: number;
  averagePerJob: number;
  bestDay: { day: string; amount: number };
  walletBalance: number;
  days: { day: string; earned: number; commissionPaid: number }[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'BID_RECEIVED' | 'MATCH_CONFIRMED' | 'DRIVER_EN_ROUTE' | 'DELIVERED' | 'WALLET' | 'SYSTEM';
  title: string;
  body: string;
  jobId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MarketReference {
  route: string;
  tonnes: number;
  periodDays: number;
  jobCount: number;
  low: number;
  median: number;
  high: number;
  estimatedMatchMinutes: { min: number; max: number };
}

export interface CreateJobInput {
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  cargoDescription: string;
  requiredTonnes: number;
  specialRequirements: string[];
  askingPrice: number;
  currency: string;
  requiredTruckType?: string;
  paymentMethod?: string;
}
