import { create } from 'zustand';

export interface PendingProductFill {
  name: string;
  description?: string;
  price?: number;
  categoryName?: string;
  openModal?: boolean;
}

export interface PendingProfileFill {
  businessName?: string;
  description?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  businessHours?: string;
  autoCreate?: boolean;
}

interface AiActionState {
  pendingProduct: PendingProductFill | null;
  pendingProfile: PendingProfileFill | null;
  pendingCategories: string[] | null;
  categoryRefreshTick: number;
  productRefreshTick: number;
  profileFillTick: number;
  setPendingProduct: (data: PendingProductFill | null) => void;
  consumePendingProduct: () => PendingProductFill | null;
  setPendingProfile: (data: PendingProfileFill | null) => void;
  consumePendingProfile: () => PendingProfileFill | null;
  bumpProfileFill: () => void;
  setPendingCategories: (items: string[] | null) => void;
  consumePendingCategories: () => string[] | null;
  bumpCategoryRefresh: () => void;
  bumpProductRefresh: () => void;
}

export const useAiActionStore = create<AiActionState>((set, get) => ({
  pendingProduct: null,
  pendingProfile: null,
  pendingCategories: null,
  categoryRefreshTick: 0,
  productRefreshTick: 0,
  profileFillTick: 0,
  setPendingProduct: (data) => set({ pendingProduct: data }),
  consumePendingProduct: () => {
    const data = get().pendingProduct;
    set({ pendingProduct: null });
    return data;
  },
  setPendingProfile: (data) => set({ pendingProfile: data }),
  consumePendingProfile: () => {
    const data = get().pendingProfile;
    set({ pendingProfile: null });
    return data;
  },
  bumpProfileFill: () => set((s) => ({ profileFillTick: s.profileFillTick + 1 })),
  setPendingCategories: (items) => set({ pendingCategories: items }),
  consumePendingCategories: () => {
    const items = get().pendingCategories;
    set({ pendingCategories: null });
    return items;
  },
  bumpCategoryRefresh: () => set((s) => ({ categoryRefreshTick: s.categoryRefreshTick + 1 })),
  bumpProductRefresh: () => set((s) => ({ productRefreshTick: s.productRefreshTick + 1 })),
}));
