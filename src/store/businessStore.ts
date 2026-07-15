import { create } from 'zustand';
import { getMyBusinesses } from '../api/businessApi';
import type { Business } from '../types';

interface BusinessState {
  businesses: Business[];
  activeBusiness: Business | null;
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  setActive: (business: Business) => void;
  reset: () => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  businesses: [],
  activeBusiness: null,
  loading: false,
  loaded: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const list = await getMyBusinesses();
      const current = get().activeBusiness;
      const active = current
        ? list.find((b) => b.id === current.id) ?? list[0] ?? null
        : list[0] ?? null;
      set({ businesses: list, activeBusiness: active, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  setActive: (business) => set({ activeBusiness: business }),
  reset: () => set({ businesses: [], activeBusiness: null, loaded: false }),
}));
