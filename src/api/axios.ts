import axios from 'axios';
import { toast } from 'react-toastify';
import { authStorage } from '../utils/authStorage';

function resolveApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') return envUrl;
  if (typeof window !== 'undefined') {
    if ((window as Window & { bizoraDesktop?: boolean }).bizoraDesktop) return '';
    if (window.location.port === '8080') return '';
  }
  return 'https://bizora-backend-ko42.onrender.com';
}

const API_URL = resolveApiUrl();

export const TOKEN_KEY = 'bizora_token';
export const USER_KEY = 'bizora_user';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = authStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      authStorage.clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        toast.error('Session expired. Please sign in again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission for this action.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(err);
  },
);

export default axiosInstance;
