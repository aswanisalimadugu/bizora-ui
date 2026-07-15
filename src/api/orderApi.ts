import type { ApiResponse, Customer, Order, OrderItem, OrderTrack } from '../types';
import { axiosInstance } from './axios';

export async function getOrders(businessId: string): Promise<Order[]> {
  const { data } = await axiosInstance.get<ApiResponse<Order[]>>(
    `/api/orders/business/${businessId}`,
  );
  return data.data;
}

export interface DashboardStats {
  businessId: string;
  productCount: number;
  orderCount: number;
  pendingOrders: number;
  paidRevenue: number;
  todayIncome: number;
  subscriptionStatus: string;
  planName: string;
  paidPlan: boolean;
}

export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const { data } = await axiosInstance.get<ApiResponse<DashboardStats>>(
    `/api/orders/business/${businessId}/stats`,
  );
  return data.data;
}

export async function createOrder(payload: {
  businessId: string;
  customerId: string;
  items: OrderItem[];
}): Promise<Order> {
  const { data } = await axiosInstance.post<ApiResponse<Order>>('/api/orders', payload);
  return data.data;
}

export interface OrderPaymentResult {
  keyId?: string;
  razorpayOrderId?: string;
  amount?: number;
  orderId?: string;
  orderNumber?: string;
  payment?: { id: string };
}

export async function createOrderPayment(orderId: string): Promise<OrderPaymentResult> {
  const { data } = await axiosInstance.post<ApiResponse<OrderPaymentResult>>(
    `/api/public/orders/${orderId}/payment`,
  );
  return data.data;
}

export async function verifyOrderPayment(body: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Order> {
  const { data } = await axiosInstance.post<ApiResponse<Order>>(
    '/api/public/orders/payment/verify',
    body,
  );
  return data.data;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const { data } = await axiosInstance.put<ApiResponse<Order>>(
    `/api/orders/${orderId}/status`,
    null,
    { params: { status } },
  );
  return data.data;
}

export async function updateOrderItems(
  orderId: string,
  items: { productId: string; quantity: number; selectedOption?: string }[],
): Promise<Order> {
  const { data } = await axiosInstance.put<ApiResponse<Order>>(`/api/orders/${orderId}/items`, {
    items,
  });
  return data.data;
}

export async function createCustomer(payload: {
  businessId: string;
  name: string;
  mobile: string;
  email?: string;
}): Promise<Customer> {
  const { data } = await axiosInstance.post<ApiResponse<Customer>>('/api/customers', payload);
  return data.data;
}

export async function getCustomers(businessId: string): Promise<Customer[]> {
  const { data } = await axiosInstance.get<ApiResponse<Customer[]>>(
    `/api/customers/business/${businessId}`,
  );
  return data.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await axiosInstance.delete(`/api/customers/${id}`);
}

export async function trackOrder(orderNumber: string): Promise<OrderTrack> {
  const { data } = await axiosInstance.get<ApiResponse<OrderTrack>>(
    `/api/public/orders/track/${encodeURIComponent(orderNumber)}`,
  );
  return data.data;
}

export async function cancelPublicOrder(orderNumber: string, mobile: string): Promise<OrderTrack> {
  const { data } = await axiosInstance.post<ApiResponse<OrderTrack>>(
    `/api/public/orders/${encodeURIComponent(orderNumber)}/cancel`,
    { mobile },
  );
  return data.data;
}
