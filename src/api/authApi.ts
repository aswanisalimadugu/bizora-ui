import type { ApiResponse, AuthResult } from '../types';
import { axiosInstance } from './axios';

export interface RegisterPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export async function loginRequest(email: string, password: string): Promise<AuthResult> {
  const { data } = await axiosInstance.post<ApiResponse<AuthResult>>('/api/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResult> {
  const { data } = await axiosInstance.post<ApiResponse<AuthResult>>('/api/auth/register', {
    role: 'OWNER',
    ...payload,
  });
  return data.data;
}
