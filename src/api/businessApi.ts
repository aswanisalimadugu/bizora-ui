import type { ApiResponse, Business } from '../types';
import { axiosInstance } from './axios';

export async function getMyBusinesses(): Promise<Business[]> {
  const { data } = await axiosInstance.get<ApiResponse<Business[]>>('/api/business/my');
  return data.data;
}

export async function getPublicBusiness(slug: string): Promise<Business> {
  const { data } = await axiosInstance.get<ApiResponse<Business>>(`/api/public/business/${slug}`);
  return data.data;
}

function buildForm(payload: Partial<Business>, logo?: File, cover?: File): FormData {
  const form = new FormData();
  form.append('business', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (logo) form.append('logo', logo);
  if (cover) form.append('cover', cover);
  return form;
}

export async function createBusiness(
  payload: Partial<Business>,
  logo?: File,
  cover?: File,
): Promise<Business> {
  const { data } = await axiosInstance.post<ApiResponse<Business>>(
    '/api/business',
    buildForm(payload, logo, cover),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export async function updateBusiness(
  id: string,
  payload: Partial<Business>,
  logo?: File,
  cover?: File,
): Promise<Business> {
  const { data } = await axiosInstance.put<ApiResponse<Business>>(
    `/api/business/${id}`,
    buildForm(payload, logo, cover),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export interface RazorpayStatus {
  paymentMode: string;
  keyId?: string | null;
  configured: boolean;
  hasWebhookSecret: boolean;
  platformOrderPaymentsAllowed: boolean;
}

export async function getRazorpayStatus(businessId: string): Promise<RazorpayStatus> {
  const { data } = await axiosInstance.get<ApiResponse<RazorpayStatus>>(
    `/api/business/${businessId}/razorpay`,
  );
  return data.data;
}

export async function connectRazorpay(
  businessId: string,
  body: { keyId: string; keySecret: string; webhookSecret?: string },
): Promise<RazorpayStatus> {
  const { data } = await axiosInstance.put<ApiResponse<RazorpayStatus>>(
    `/api/business/${businessId}/razorpay`,
    body,
  );
  return data.data;
}

export async function disconnectRazorpay(businessId: string): Promise<RazorpayStatus> {
  const { data } = await axiosInstance.delete<ApiResponse<RazorpayStatus>>(
    `/api/business/${businessId}/razorpay`,
  );
  return data.data;
}
