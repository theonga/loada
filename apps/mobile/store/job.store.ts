import { create } from 'zustand';
import type { Job, Bid } from '@/types';

interface JobStore {
  activeJob: Job | null;
  bids: Bid[];
  loads: Job[];
  shipperJobs: Job[];
  setActiveJob: (job: Job | null) => void;
  setBids: (bids: Bid[]) => void;
  addBid: (bid: Bid) => void;
  setLoads: (loads: Job[]) => void;
  setShipperJobs: (jobs: Job[]) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  activeJob: null,
  bids: [],
  loads: [],
  shipperJobs: [],

  setActiveJob: (job) => set({ activeJob: job }),

  setBids: (bids) => set({ bids }),

  addBid: (bid) =>
    set((state) => ({ bids: [...state.bids, bid] })),

  setLoads: (loads) => set({ loads }),

  setShipperJobs: (jobs) => set({ shipperJobs: jobs }),
}));
