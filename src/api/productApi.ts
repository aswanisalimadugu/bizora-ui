import type { ApiResponse, Category, Product } from '../types';
import { axiosInstance } from './axios';

export async function getCategories(businessId: string): Promise<Category[]> {
  const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
    `/api/categories/business/${businessId}`,
  );
  return data.data;
}

export async function createCategory(payload: {
  businessId: string;
  name: string;
}): Promise<Category> {
  const { data } = await axiosInstance.post<ApiResponse<Category>>('/api/categories', payload);
  return data.data;
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data } = await axiosInstance.put<ApiResponse<Category>>(`/api/categories/${id}`, { name });
  return data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await axiosInstance.delete(`/api/categories/${id}`);
}

export async function getProducts(businessId: string): Promise<Product[]> {
  const { data } = await axiosInstance.get<ApiResponse<Product[]>>(
    `/api/products/business/${businessId}`,
  );
  return data.data;
}

function buildForm(product: Partial<Product>, image?: File): FormData {
  const form = new FormData();
  form.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }));
  if (image) form.append('image', image);
  return form;
}

export async function createProduct(product: Partial<Product>, image?: File): Promise<Product> {
  const { data } = await axiosInstance.post<ApiResponse<Product>>(
    '/api/products',
    buildForm(product, image),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export async function updateProduct(
  id: string,
  product: Partial<Product>,
  image?: File,
): Promise<Product> {
  const { data } = await axiosInstance.put<ApiResponse<Product>>(
    `/api/products/${id}`,
    buildForm(product, image),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await axiosInstance.delete(`/api/products/${id}`);
}
