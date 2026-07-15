import type { ApiResponse } from '../types';
import { axiosInstance } from './axios';

export type AiType =
  | 'product_description'
  | 'business_bio'
  | 'product_fill'
  | 'category_suggestions';

export type AiActionType =
  | 'navigate'
  | 'add_product'
  | 'add_products'
  | 'add_category'
  | 'apply_bio'
  | 'setup_profile'
  | 'suggest_categories'
  | 'show_text'
  | 'help'
  | 'none';

export interface AiProductItem {
  name: string;
  price?: number;
  description?: string;
  categoryName?: string;
}

export interface AiCommandAction {
  type: AiActionType;
  path?: string;
  name?: string;
  price?: number;
  description?: string;
  categoryName?: string;
  categories?: string[];
  products?: AiProductItem[];
  businessName?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  businessHours?: string;
  autoCreate?: boolean;
}

export interface AiCommandResult {
  reply: string;
  action: AiCommandAction;
}

export interface ProductFillResult {
  description: string;
  suggestedPrice: number;
  suggestedCategory: string;
}

export interface AiContextPayload {
  page: string;
  businessId?: string;
  businessName?: string;
  businessDescription?: string;
  city?: string;
  userName?: string;
  hasBusiness: boolean;
  existingCategories?: string;
}

export async function generateContent(
  type: AiType,
  params: Record<string, string | number | undefined>,
  businessId?: string,
): Promise<string> {
  const { data } = await axiosInstance.post<ApiResponse<{ text: string }>>('/api/ai/generate', {
    type,
    params,
    businessId: businessId ?? params.businessId,
  });
  return data.data.text;
}

export async function runAiCommand(
  prompt: string,
  context: AiContextPayload,
): Promise<AiCommandResult> {
  const { data } = await axiosInstance.post<ApiResponse<AiCommandResult>>('/api/ai/command', {
    prompt,
    context,
    businessId: context.businessId,
  });
  return data.data;
}

export async function generateProductFill(
  params: Record<string, string | number | undefined>,
): Promise<ProductFillResult> {
  const text = await generateContent('product_fill', params, params.businessId as string | undefined);
  return JSON.parse(text) as ProductFillResult;
}

export async function generateCategorySuggestions(
  params: Record<string, string | number | undefined>,
): Promise<string[]> {
  const text = await generateContent(
    'category_suggestions',
    params,
    params.businessId as string | undefined,
  );
  const parsed = JSON.parse(text) as { suggestions: string[] };
  return parsed.suggestions ?? [];
}
