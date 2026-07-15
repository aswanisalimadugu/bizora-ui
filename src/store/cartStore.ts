import { create } from 'zustand';
import type { CartItem } from '../types';

const SESSION_KEY = 'bizora_cart_session_v1';

export function cartLineKey(productId: string, selectedOption?: string | null): string {
  const opt = selectedOption?.trim() || '';
  return opt ? `${productId}::${opt}` : productId;
}

interface PersistedCart {
  businessId: string | null;
  items: CartItem[];
}

function readSession(): PersistedCart {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { businessId: null, items: [] };
    const parsed = JSON.parse(raw) as PersistedCart;
    return {
      businessId: parsed.businessId ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { businessId: null, items: [] };
  }
}

function writeSession(businessId: string | null, items: CartItem[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ businessId, items }));
  } catch {
    /* private mode / quota */
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

interface CartState {
  businessId: string | null;
  items: CartItem[];
  setBusiness: (businessId: string) => void;
  addItem: (item: Omit<CartItem, 'lineKey' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (lineKey: string) => void;
  updateQty: (lineKey: string, quantity: number) => void;
  clear: () => void;
  /** Wipe cart for a brand-new customer on this device/tab. */
  startFreshOrder: () => void;
  total: () => number;
  count: () => number;
}

const initial = readSession();

export const useCartStore = create<CartState>((set, get) => ({
  businessId: initial.businessId,
  items: initial.items,
  setBusiness: (businessId) => {
    const current = get().businessId;
    if (current && current !== businessId) {
      set({ businessId, items: [] });
      writeSession(businessId, []);
    } else {
      set({ businessId });
      writeSession(businessId, get().items);
    }
  },
  addItem: (item) => {
    const lineKey = cartLineKey(item.productId, item.selectedOption);
    set((s) => {
      const existing = s.items.find((i) => i.lineKey === lineKey);
      const items = existing
        ? s.items.map((i) =>
            i.lineKey === lineKey ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i,
          )
        : [
            ...s.items,
            {
              ...item,
              lineKey,
              quantity: item.quantity ?? 1,
              description: item.description?.trim() || undefined,
              selectedOption: item.selectedOption?.trim() || undefined,
            },
          ];
      writeSession(s.businessId, items);
      return { items };
    });
  },
  removeItem: (lineKey) =>
    set((s) => {
      const items = s.items.filter((i) => i.lineKey !== lineKey);
      writeSession(s.businessId, items);
      return { items };
    }),
  updateQty: (lineKey, quantity) => {
    if (quantity <= 0) {
      get().removeItem(lineKey);
      return;
    }
    set((s) => {
      const items = s.items.map((i) => (i.lineKey === lineKey ? { ...i, quantity } : i));
      writeSession(s.businessId, items);
      return { items };
    });
  },
  clear: () => {
    set({ items: [] });
    writeSession(get().businessId, []);
  },
  startFreshOrder: () => {
    set({ items: [] });
    clearSession();
    writeSession(get().businessId, []);
  },
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
