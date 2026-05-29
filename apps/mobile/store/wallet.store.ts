import { create } from 'zustand';

interface WalletState {
  balance: number;
  reservedBalance: number;
  commissionPct: number;
  lastFetched: number | null;
  setWallet: (balance: number, reservedBalance: number, commissionPct: number) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  reservedBalance: 0,
  commissionPct: 15,
  lastFetched: null,
  setWallet: (balance, reservedBalance, commissionPct) =>
    set({ balance, reservedBalance, commissionPct, lastFetched: Date.now() }),
  reset: () => set({ balance: 0, reservedBalance: 0, commissionPct: 15, lastFetched: null }),
}));
