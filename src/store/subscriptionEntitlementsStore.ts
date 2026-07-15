import { create } from 'zustand';
import {
  getEntitlements,
  type EntitlementsPayload,
  type SubscriptionReport,
} from '../api/paymentApi';

export interface Entitlements {
  loaded: boolean;
  loading: boolean;
  report: SubscriptionReport | null;
  /** Paid ACTIVE subscription (price > 0). */
  isPaid: boolean;
  isFree: boolean;
  planName: string;
  planTier: string;
  status: string;
  maxIncomeDays: number;
  canExport: boolean;
  canUseAi: boolean;
  canAdvancedReports: boolean;
  canQrPrintDownload: boolean;
  canRegenerateQr: boolean;
  canFullAnalytics: boolean;
  /** Free: 7. Paid: null (unlimited). */
  dataRetentionDays: number | null;
}

interface SubscriptionEntitlementsState {
  businessId: string | null;
  entitlements: EntitlementsPayload | null;
  loaded: boolean;
  loading: boolean;
  refresh: (businessId: string) => Promise<void>;
  clear: () => void;
}

function toReportShape(e: EntitlementsPayload): SubscriptionReport {
  return {
    planTier: e.planTier,
    planName: e.planName,
    planPrice: 0,
    durationDays: null,
    status: e.status,
    startDate: null,
    endDate: null,
    daysRemaining: e.daysRemaining,
    productLimits: e.productLimits,
    categoryLimits: e.categoryLimits,
    advancedReports: e.advancedReports,
    maxIncomeDays: e.maxIncomeDays,
    history: [],
  };
}

export const useSubscriptionEntitlementsStore = create<SubscriptionEntitlementsState>((set) => ({
  businessId: null,
  entitlements: null,
  loaded: false,
  loading: false,
  refresh: async (businessId: string) => {
    set({ loading: true, businessId });
    try {
      const entitlements = await getEntitlements(businessId);
      set({ entitlements, loaded: true });
    } catch {
      set({ entitlements: null, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  clear: () => set({ businessId: null, entitlements: null, loaded: false, loading: false }),
}));

export function useEntitlements(): Entitlements {
  const entitlements = useSubscriptionEntitlementsStore((s) => s.entitlements);
  const loaded = useSubscriptionEntitlementsStore((s) => s.loaded);
  const loading = useSubscriptionEntitlementsStore((s) => s.loading);

  const isPaid = Boolean(entitlements?.advancedReports);
  return {
    loaded,
    loading,
    report: entitlements ? toReportShape(entitlements) : null,
    isPaid,
    isFree: !isPaid,
    planName: entitlements?.planName ?? 'Free plan',
    planTier: entitlements?.planTier ?? 'FREE',
    status: entitlements?.status ?? 'FREE',
    maxIncomeDays: entitlements?.maxIncomeDays ?? 7,
    canExport: Boolean(entitlements?.canExport),
    canUseAi: Boolean(entitlements?.canUseAi),
    canAdvancedReports: Boolean(entitlements?.advancedReports),
    canQrPrintDownload: Boolean(entitlements?.canQrPrintDownload),
    canRegenerateQr: Boolean(entitlements?.canRegenerateQr),
    canFullAnalytics: Boolean(entitlements?.canFullAnalytics),
    dataRetentionDays: entitlements?.dataRetentionDays ?? (isPaid ? null : 7),
  };
}
