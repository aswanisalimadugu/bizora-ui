import type {
  AdminBusinessRow,
  AdminPaymentRow,
  AdminSubscriptionRow,
  ApiResponse,
  Business,
  DashboardStats,
  RevenueReport,
  SubscriptionPlan,
  User,
} from '../types';
import { axiosInstance } from './axios';

export async function getDashboard(): Promise<DashboardStats> {
  const { data } = await axiosInstance.get<ApiResponse<DashboardStats>>('/api/admin/dashboard');
  return data.data;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await axiosInstance.get<ApiResponse<User[]>>('/api/admin/users');
  return data.data;
}

export async function createUser(user: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role?: string;
}): Promise<User> {
  const { data } = await axiosInstance.post<ApiResponse<User>>('/api/admin/user', user);
  return data.data;
}

export async function updateUser(
  id: string,
  updates: { name?: string; mobile?: string; password?: string },
): Promise<User> {
  const { data } = await axiosInstance.put<ApiResponse<User>>(`/api/admin/user/${id}`, updates);
  return data.data;
}

export async function updateUserStatus(id: string, status: string): Promise<User> {
  const { data } = await axiosInstance.put<ApiResponse<User>>(`/api/admin/user/${id}/status`, null, {
    params: { status },
  });
  return data.data;
}

export async function getAdminBusinesses(): Promise<AdminBusinessRow[]> {
  const { data } = await axiosInstance.get<ApiResponse<AdminBusinessRow[]>>('/api/admin/businesses');
  return data.data;
}

export async function createBusiness(payload: {
  ownerId: string;
  businessName: string;
  description?: string;
  phone?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<Business> {
  const { data } = await axiosInstance.post<ApiResponse<Business>>('/api/admin/business', payload);
  return data.data;
}

export async function updateBusinessStatus(id: string, status: string): Promise<void> {
  await axiosInstance.put(`/api/admin/business/${id}/status`, null, { params: { status } });
}

export async function verifyBusiness(id: string): Promise<void> {
  await axiosInstance.put(`/api/admin/business/${id}/verify`);
}

export async function getAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const { data } =
    await axiosInstance.get<ApiResponse<AdminSubscriptionRow[]>>('/api/admin/subscriptions');
  return data.data;
}

export async function createPlan(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
  const { data } = await axiosInstance.post<ApiResponse<SubscriptionPlan>>(
    '/api/admin/subscription-plan',
    plan,
  );
  return data.data;
}

export async function updatePlan(id: string, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  const { data } = await axiosInstance.put<ApiResponse<SubscriptionPlan>>(
    `/api/admin/subscription-plan/${id}`,
    plan,
  );
  return data.data;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await axiosInstance.get<ApiResponse<SubscriptionPlan[]>>('/api/admin/plans');
  return data.data;
}

export async function deletePlan(id: string): Promise<void> {
  await axiosInstance.delete(`/api/admin/subscription-plan/${id}`);
}

export async function getAdminPayments(businessId?: string): Promise<AdminPaymentRow[]> {
  const { data } = await axiosInstance.get<ApiResponse<AdminPaymentRow[]>>('/api/admin/payments', {
    params: businessId ? { businessId } : undefined,
  });
  return data.data;
}

export async function getRevenueReport(businessId?: string): Promise<RevenueReport> {
  const { data } = await axiosInstance.get<ApiResponse<RevenueReport>>(
    '/api/admin/reports/revenue',
    { params: businessId ? { businessId } : undefined },
  );
  return data.data;
}
