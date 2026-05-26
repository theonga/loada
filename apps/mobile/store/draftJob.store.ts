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
  requiredTonnes: number;
  specialRequirements: string[];
  askingPrice: number;
  currency: string;
}

interface DraftJobStore {
  draft: Partial<DraftJobState>;
  setRoute: (origin: RoutePoint, dest: RoutePoint) => void;
  setCargo: (cargo: string, tonnes: number, specialRequirements: string[]) => void;
  setPrice: (askingPrice: number, currency?: string) => void;
  reset: () => void;
  /** Returns a complete draft if all required fields are present, else null. */
  complete: () => (DraftJobState & { originAddress: string; destAddress: string; originLat: number; originLng: number; destLat: number; destLng: number }) | null;
}

export const useDraftJobStore = create<DraftJobStore>((set, get) => ({
  draft: {
    origin: { address: '', lat: HARARE_LAT, lng: HARARE_LNG },
    dest: { address: '', lat: BEITBRIDGE_LAT, lng: BEITBRIDGE_LNG },
    requiredTonnes: 10,
    specialRequirements: [],
    currency: 'USD',
  },

  setRoute: (origin, dest) =>
    set((s) => ({ draft: { ...s.draft, origin, dest } })),

  setCargo: (cargoDescription, requiredTonnes, specialRequirements) =>
    set((s) => ({ draft: { ...s.draft, cargoDescription, requiredTonnes, specialRequirements } })),

  setPrice: (askingPrice, currency = 'USD') =>
    set((s) => ({ draft: { ...s.draft, askingPrice, currency } })),

  reset: () =>
    set({
      draft: {
        origin: { address: '', lat: HARARE_LAT, lng: HARARE_LNG },
        dest: { address: '', lat: BEITBRIDGE_LAT, lng: BEITBRIDGE_LNG },
        requiredTonnes: 10,
        specialRequirements: [],
        currency: 'USD',
      },
    }),

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
      requiredTonnes: d.requiredTonnes ?? 10,
      specialRequirements: d.specialRequirements ?? [],
      askingPrice: d.askingPrice,
      currency: d.currency ?? 'USD',
    };
  },
}));
