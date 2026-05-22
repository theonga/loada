import { create } from 'zustand';

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
}

interface LocationStore {
  driverLocation: DriverLocation | null;
  isOnline: boolean;
  setDriverLocation: (loc: DriverLocation | null) => void;
  setOnline: (online: boolean) => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  driverLocation: null,
  isOnline: false,

  setDriverLocation: (loc) => set({ driverLocation: loc }),

  setOnline: (online) => set({ isOnline: online }),
}));
