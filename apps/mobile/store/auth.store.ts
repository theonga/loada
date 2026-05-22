import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  role: 'shipper' | 'driver' | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setRole: (role: 'shipper' | 'driver') => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: true }),

  setRole: (role) =>
    set({ role }),

  setToken: (token) =>
    set({ token }),

  logout: () =>
    set({ user: null, role: null, token: null, isAuthenticated: false }),
}));
