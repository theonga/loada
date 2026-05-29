import { create } from 'zustand';

// Default coordinates (Harare CBD) used when the address hasn't been geocoded yet.
// Real geocoding via Google Places will replace these values in a future integration.
const HARARE_LAT = -17.8252;
const HARARE_LNG = 31.0335;
const BEITBRIDGE_LAT = -22.2167;
const BEITBRIDGE_LNG = 30.0025;

interface RoutePoint {
  address: string;
  lat: number;
  lng: number;
}

interface DraftJobState {
  origin: RoutePoint;
  dest: RoutePoint;
  cargoDescription: string;
  requiredTruckType: string;
  requiredTonnes: number;
  specialRequirements: string[];
  askingPrice: number;
  currency: string;
  paymentMethod: string;
}

interface DraftJobStore {
  draft: Partial<DraftJobState>;
  setRoute: (origin: RoutePoint, dest: RoutePoint) => void;
  setCargo: (cargo: string, truckType: string, tonnes: number, specialRequirements: string[]) => void;
  setPrice: (askingPrice: number, currency?: string) => void;
  setPaymentMethod: (paymentMethod: string) => void;
  prefill: (from: {
    origin: RoutePoint;
    dest: RoutePoint;
    cargoDescription: string;
    requiredTruckType?: string;
    requiredTonnes: number;
    specialRequirements: string[];
  }) => void;
  reset: () => void;
  /** Returns a complete draft if all required fields are present, else null. */
  complete: () => (DraftJobState & { originAddress: string; destAddress: string; originLat: number; originLng: number; destLat: number; destLng: number }) | null;
}

const EMPTY_DRAFT: Partial<DraftJobState> = {
  origin: { address: '', lat: HARARE_LAT, lng: HARARE_LNG },
  dest: { address: '', lat: BEITBRIDGE_LAT, lng: BEITBRIDGE_LNG },
  requiredTruckType: 'TRUCK',
  requiredTonnes: 1,
  specialRequirements: [],
  currency: 'USD',
  paymentMethod: 'CASH',
};

export const useDraftJobStore = create<DraftJobStore>((set, get) => ({
  draft: { ...EMPTY_DRAFT },

  setRoute: (origin, dest) =>
    set((s) => ({ draft: { ...s.draft, origin, dest } })),

  setCargo: (cargoDescription, requiredTruckType, requiredTonnes, specialRequirements) =>
    set((s) => ({ draft: { ...s.draft, cargoDescription, requiredTruckType, requiredTonnes, specialRequirements } })),

  setPrice: (askingPrice, currency = 'USD') =>
    set((s) => ({ draft: { ...s.draft, askingPrice, currency } })),

  setPaymentMethod: (paymentMethod) =>
    set((s) => ({ draft: { ...s.draft, paymentMethod } })),

  prefill: ({ origin, dest, cargoDescription, requiredTruckType, requiredTonnes, specialRequirements }) =>
    set({
      draft: {
        ...EMPTY_DRAFT,
        origin,
        dest,
        cargoDescription,
        requiredTruckType: requiredTruckType ?? 'TRUCK',
        requiredTonnes,
        specialRequirements,
      },
    }),

  reset: () => set({ draft: { ...EMPTY_DRAFT } }),

  complete: () => {
    const d = get().draft;
    if (!d.origin?.address || !d.dest?.address || !d.cargoDescription || !d.askingPrice) {
      return null;
    }
    return {
      origin: d.origin,
      dest: d.dest,
      originAddress: d.origin.address,
      originLat: d.origin.lat,
      originLng: d.origin.lng,
      destAddress: d.dest.address,
      destLat: d.dest.lat,
      destLng: d.dest.lng,
      cargoDescription: d.cargoDescription,
      requiredTruckType: d.requiredTruckType ?? 'TRUCK',
      requiredTonnes: d.requiredTonnes ?? 1,
      specialRequirements: d.specialRequirements ?? [],
      askingPrice: d.askingPrice,
      currency: d.currency ?? 'USD',
      paymentMethod: d.paymentMethod ?? 'CASH',
    };
  },
}));
