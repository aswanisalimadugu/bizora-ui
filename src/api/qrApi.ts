import type { ApiResponse, BusinessQr } from '../types';
import { axiosInstance } from './axios';

export async function getBusinessQr(businessId: string): Promise<BusinessQr> {
  const { data } = await axiosInstance.get<ApiResponse<BusinessQr>>(
    `/api/business/${businessId}/qr`,
  );
  return data.data;
}

export async function regenerateBusinessQr(businessId: string): Promise<BusinessQr> {
  const { data } = await axiosInstance.post<ApiResponse<BusinessQr>>(
    `/api/business/${businessId}/qr/regenerate`,
  );
  return data.data;
}
