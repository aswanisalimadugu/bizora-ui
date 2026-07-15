import type { ApiResponse, CategoryLimits, ProductLimits, SubscriptionPlan, TenantSubscription } from '../types';
import { axiosInstance } from './axios';

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await axiosInstance.get<ApiResponse<SubscriptionPlan[]>>(
    '/api/subscription/plans',
  );
  return data.data;
}

export interface OwnerPayment {
  id: string;
  businessId?: string;
  orderId?: string | null;
  subscriptionId?: string | null;
  orderNumber?: string | null;
  /** ORDER | SUBSCRIPTION | OTHER */
  type?: string;
  transactionId?: string;
  gatewayPaymentId?: string;
  gateway?: string;
  amount: number;
  status: string;
  createdAt: string;
}

export async function getBusinessPayments(businessId: string): Promise<OwnerPayment[]> {
  const { data } = await axiosInstance.get<ApiResponse<OwnerPayment[]>>(
    `/api/payment/business/${businessId}`,
  );
  return data.data;
}

export async function getActiveSubscription(businessId: string): Promise<TenantSubscription | null> {
  const { data } = await axiosInstance.get<ApiResponse<TenantSubscription | null>>(
    `/api/subscription/active/${businessId}`,
  );
  return data.data;
}

export async function getProductLimits(businessId: string): Promise<ProductLimits> {
  const { data } = await axiosInstance.get<ApiResponse<ProductLimits>>(
    `/api/subscription/limits/${businessId}`,
  );
  return data.data;
}

export async function getCategoryLimits(businessId: string): Promise<CategoryLimits> {
  const { data } = await axiosInstance.get<ApiResponse<CategoryLimits>>(
    `/api/subscription/category-limits/${businessId}`,
  );
  return data.data;
}

export async function createSubscription(
  businessId: string,
  planId: string,
): Promise<TenantSubscription> {
  const { data } = await axiosInstance.post<ApiResponse<TenantSubscription>>(
    '/api/subscription/create',
    { businessId, planId },
  );
  return data.data;
}

export interface PaymentOrderResult {
  keyId?: string;
  razorpayOrderId?: string;
  amount?: number;
  payment?: { id: string };
}

export async function createPayment(
  businessId: string,
  subscriptionId: string,
): Promise<PaymentOrderResult> {
  const { data } = await axiosInstance.post<ApiResponse<PaymentOrderResult>>('/api/payment/create', {
    businessId,
    subscriptionId,
  });
  return data.data;
}

export async function verifyPayment(body: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<void> {
  await axiosInstance.post('/api/payment/verify', body);
}

export interface SubscriptionHistoryItem {
  id: string;
  planId: string;
  planName: string;
  planPrice?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
}

export interface SubscriptionReport {
  planTier: 'FREE' | 'PAID' | string;
  planName: string;
  planPrice: number;
  durationDays?: number | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  daysRemaining?: number | null;
  productLimits: ProductLimits;
  categoryLimits: CategoryLimits;
  advancedReports: boolean;
  maxIncomeDays: number;
  history: SubscriptionHistoryItem[];
}

export async function getSubscriptionReport(businessId: string): Promise<SubscriptionReport> {
  const { data } = await axiosInstance.get<ApiResponse<SubscriptionReport>>(
    `/api/subscription/report/${businessId}`,
  );
  return data.data;
}

export interface EntitlementsPayload {
  planTier: string;
  planName: string;
  status: string;
  advancedReports: boolean;
  maxIncomeDays: number;
  canExport: boolean;
  canUseAi: boolean;
  canQrPrintDownload: boolean;
  canRegenerateQr: boolean;
  canFullAnalytics: boolean;
  /** Free: 7. Paid: null = unlimited. */
  dataRetentionDays?: number | null;
  productLimits: ProductLimits;
  categoryLimits: CategoryLimits;
  daysRemaining?: number | null;
}

export async function getEntitlements(businessId: string): Promise<EntitlementsPayload> {
  const { data } = await axiosInstance.get<ApiResponse<EntitlementsPayload>>(
    `/api/subscription/entitlements/${businessId}`,
  );
  return data.data;
}
