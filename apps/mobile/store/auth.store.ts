import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types';

const KEYS = {
  token: 'auth:token',
  refreshToken: 'auth:refreshToken',
  user: 'auth:user',
  role: 'auth:role',
} as const;

type ActiveRole = 'shipper' | 'driver';

interface AuthStore {
  user: User | null;
  /** Which UI the user is currently viewing. For BOTH users, this can be toggled. */
  role: ActiveRole | null;
  token: string | null;
  refreshToken: string | null;
  pendingPhone: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateName: (name: string) => void;
  updateEmail: (email: string | null | undefined) => void;
  setRole: (role: ActiveRole) => void;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setPendingPhone: (phone: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  /** Does this account have access to both roles (without re-logging in)? */
  canSwitchRole: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  role: null,
  token: null,
  refreshToken: null,
  pendingPhone: null,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: true });
    AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  },

  updateName: (name: string) => {
    set((s) => {
      if (!s.user) return {};
      const updated = { ...s.user, name };
      AsyncStorage.setItem(KEYS.user, JSON.stringify(updated));
      return { user: updated };
    });
  },

  updateEmail: (email: string | null | undefined) => {
    set((s) => {
      if (!s.user) return {};
      const updated = { ...s.user, email: email ?? null };
      AsyncStorage.setItem(KEYS.user, JSON.stringify(updated));
      return { user: updated };
    });
  },

  setRole: (role) => {
    set({ role });
    AsyncStorage.setItem(KEYS.role, role);
  },

  setToken: (token) => {
    set({ token });
    AsyncStorage.setItem(KEYS.token, token);
  },

  setRefreshToken: (refreshToken) => {
    set({ refreshToken });
    AsyncStorage.setItem(KEYS.refreshToken, refreshToken);
  },

  setPendingPhone: (pendingPhone) => set({ pendingPhone }),

  logout: () => {
    set({
      user: null,
      role: null,
      token: null,
      refreshToken: null,
      pendingPhone: null,
      isAuthenticated: false,
    });
    Promise.all([
      AsyncStorage.removeItem(KEYS.token),
      AsyncStorage.removeItem(KEYS.refreshToken),
      AsyncStorage.removeItem(KEYS.user),
      AsyncStorage.removeItem(KEYS.role),
    ]);
  },

  canSwitchRole: () => get().user?.role === 'BOTH',

  hydrate: async () => {
    try {
      const [token, refreshToken, userJson, role] = await Promise.all([
        AsyncStorage.getItem(KEYS.token),
        AsyncStorage.getItem(KEYS.refreshToken),
        AsyncStorage.getItem(KEYS.user),
        AsyncStorage.getItem(KEYS.role),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          token,
          refreshToken,
          user,
          role: role as 'shipper' | 'driver' | null,
          isAuthenticated: true,
        });
      }
    } catch {
      // AsyncStorage unavailable — stay logged out
    }
  },
}));
