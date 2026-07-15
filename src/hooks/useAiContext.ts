import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';

export interface AiContext {
  page: string;
  businessId?: string;
  businessName?: string;
  businessDescription?: string;
  city?: string;
  userName?: string;
  hasBusiness: boolean;
  existingCategories?: string;
}

export function useAiContext(): AiContext {
  const { pathname } = useLocation();
  const { activeBusiness } = useBusinessStore();
  const { user } = useAuthStore();

  return useMemo(
    () => ({
      page: pathname,
      businessId: activeBusiness?.id,
      businessName: activeBusiness?.businessName,
      businessDescription: activeBusiness?.description,
      city: activeBusiness?.city,
      userName: user?.name,
      hasBusiness: Boolean(activeBusiness?.id),
      existingCategories: activeBusiness?.categories?.map((c) => c.name).join(', '),
    }),
    [pathname, activeBusiness, user?.name],
  );
}

export function getContextSuggestions(page: string, hasBusiness: boolean): string[] {
  if (!hasBusiness) {
    return [
      'Setup tiffin center profile, number 9912164017, Hyderabad',
      'Create business profile',
      'What can you do?',
    ];
  }
  const common = ['Open orders', 'Add product', 'Suggest categories'];
  const byPage: Record<string, string[]> = {
    '/dashboard': ['Show my orders', 'Add product Biryani 299', 'Write business bio'],
    '/dashboard/products': ['Add products dosa, idli and bonda', 'Add product Masala Dosa 80', 'Open categories'],
    '/dashboard/profile': ['Write bio for my business', 'Open products'],
    '/dashboard/categories': ['Add category Biryani', 'Suggest categories', 'Open products'],
    '/dashboard/orders': ['Open products', 'Open customers'],
  };
  return byPage[page] ?? common;
}
