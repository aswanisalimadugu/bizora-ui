import { toast } from 'react-toastify';
import type { NavigateFunction } from 'react-router-dom';
import { createCategory, createProduct, getCategories } from '../api/productApi';
import type { AiCommandAction, AiCommandResult, AiProductItem } from '../api/aiApi';
import type { PendingProfileFill } from '../store/aiActionStore';
import { useAiActionStore } from '../store/aiActionStore';
import { getErrorMessage } from './format';

interface ExecuteOptions {
  navigate: NavigateFunction;
  businessId?: string;
  refreshBusiness?: () => Promise<void>;
  /** Original user prompt — used for local fallback when backend action is weak. */
  prompt?: string;
}

export interface ExecuteOutcome {
  /** Close the AI panel after a successful mutating action. */
  shouldClose?: boolean;
}

function applyProfileAction(store: ReturnType<typeof useAiActionStore.getState>, action: AiCommandAction) {
  const profile: PendingProfileFill = {
    businessName: action.businessName,
    description: action.description,
    phone: action.phone,
    whatsappNumber: action.whatsappNumber,
    address: action.address,
    city: action.city,
    state: action.state,
    pincode: action.pincode,
    businessHours: action.businessHours,
    autoCreate: action.autoCreate,
  };
  store.setPendingProfile(profile);
  store.bumpProfileFill();
}

function actionNeedsFallback(action?: AiCommandAction | null): boolean {
  if (!action?.type || action.type === 'none' || action.type === 'help' || action.type === 'show_text') {
    return true;
  }
  if (action.type === 'add_product' && !normalizeProductName(action.name ?? '')) return true;
  if (action.type === 'add_products' && !(action.products ?? []).some((p) => normalizeProductName(p.name ?? ''))) {
    return true;
  }
  return false;
}

/** Client-side parse when the AI API returns an empty/weak action. */
export function parseLocalAiCommand(prompt: string): AiCommandAction | null {
  const text = prompt.trim().replace(/\s+/g, ' ');
  if (!text) return null;

  const multiMatch = text.match(
    /^(?:please\s+)?(?:add|create|make)\s+products?\s+(.+)$/i,
  );
  if (multiMatch) {
    const rest = multiMatch[1]
      .replace(/^(?:like|named|called)\s+/i, '')
      .trim();
    const parts = rest
      .split(/\s*,\s*|\s+and\s+|\s*&\s*/i)
      .map((p) => p.trim())
      .filter(Boolean);

    const products: AiProductItem[] = parts.map((part) => {
      const withPrice = part.match(/^(.+?)\s+[₹Rs.]*\s*(\d+(?:\.\d+)?)$/i);
      if (withPrice) {
        return {
          name: normalizeProductName(withPrice[1]),
          price: Number(withPrice[2]),
        };
      }
      return { name: normalizeProductName(part) };
    }).filter((p) => p.name);

    if (products.length > 1) return { type: 'add_products', products };
    if (products.length === 1) {
      return {
        type: 'add_product',
        name: products[0].name,
        price: products[0].price,
      };
    }
  }

  const singleMatch = text.match(
    /^(?:please\s+)?(?:add|create|make)\s+(?:a\s+)?product\s+(.+)$/i,
  );
  if (singleMatch) {
    const rest = singleMatch[1].replace(/^(?:named|called|like)\s+/i, '').trim();
    const withPrice = rest.match(/^(.+?)\s+[₹Rs.]*\s*(\d+(?:\.\d+)?)$/i);
    if (withPrice) {
      const name = normalizeProductName(withPrice[1]);
      if (name) return { type: 'add_product', name, price: Number(withPrice[2]) };
    }
    const name = normalizeProductName(rest);
    if (name) return { type: 'add_product', name };
  }

  const categoryMatch = text.match(
    /^(?:please\s+)?(?:add|create|make)\s+(?:a\s+)?categor(?:y|ies)\s+(.+)$/i,
  );
  if (categoryMatch) {
    const name = normalizeCategoryName(categoryMatch[1]);
    if (name) return { type: 'add_category', categoryName: name };
  }

  return null;
}

export async function executeAiCommand(
  result: AiCommandResult,
  { navigate, businessId, refreshBusiness, prompt }: ExecuteOptions,
): Promise<ExecuteOutcome> {
  let action = result.action;

  if (actionNeedsFallback(action) && prompt) {
    const local = parseLocalAiCommand(prompt);
    if (local) action = local;
  }

  if (!action?.type || action.type === 'none' || action.type === 'help') return {};

  const store = useAiActionStore.getState();

  switch (action.type) {
    case 'navigate': {
      if (action.path) navigate(action.path);
      return {};
    }

    case 'show_text':
      return {};

    case 'apply_bio': {
      if (action.description) {
        applyProfileAction(store, { ...action, type: 'apply_bio' });
        if (window.location.pathname !== '/dashboard/profile') {
          navigate('/dashboard/profile');
        }
      }
      return { shouldClose: true };
    }

    case 'setup_profile': {
      applyProfileAction(store, action);
      if (window.location.pathname !== '/dashboard/profile') {
        navigate('/dashboard/profile');
      }
      return { shouldClose: true };
    }

    case 'suggest_categories': {
      if (action.categories?.length) {
        store.setPendingCategories(action.categories);
        navigate('/dashboard/categories');
        toast.info('Category suggestions ready — tap to add');
        return { shouldClose: true };
      }
      return {};
    }

    case 'add_category': {
      let categoryName = normalizeCategoryName(action.categoryName?.trim() ?? '');
      if (!categoryName) {
        toast.error('Category name missing');
        return {};
      }
      if (!businessId) {
        navigate('/dashboard/profile');
        toast.info('Create your business profile first');
        return { shouldClose: true };
      }
      try {
        const existing = await getCategories(businessId);
        const duplicate = existing.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
        );
        if (duplicate) {
          toast.info(`Category "${categoryName}" already exists`);
        } else {
          await createCategory({ businessId, name: categoryName });
          toast.success(`Category "${categoryName}" created`);
        }
        store.bumpCategoryRefresh();
        navigate('/dashboard/categories');
        if (refreshBusiness) await refreshBusiness().catch(() => undefined);
        return { shouldClose: true };
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not create category'));
        return {};
      }
    }

    case 'add_product': {
      const productName = normalizeProductName(action.name?.trim() ?? '');
      if (!productName) {
        toast.error('Product name missing');
        return {};
      }
      if (!businessId) {
        store.setPendingProduct({
          name: productName,
          description: action.description,
          price: action.price,
          categoryName: action.categoryName,
          openModal: true,
        });
        navigate('/dashboard/profile');
        toast.info('Create your business profile first');
        return { shouldClose: true };
      }

      const created = await tryCreateProduct(businessId, {
        name: productName,
        description: action.description,
        price: action.price,
        categoryName: action.categoryName,
      });
      if (created) {
        toast.success(`Product "${productName}" added`);
        store.bumpProductRefresh();
        if (refreshBusiness) await refreshBusiness().catch(() => undefined);
        navigate('/dashboard/products');
        return { shouldClose: true };
      }

      store.setPendingProduct({
        name: productName,
        description: action.description,
        price: action.price,
        categoryName: action.categoryName,
        openModal: true,
      });
      store.bumpProductRefresh();
      navigate('/dashboard/products');
      toast.info('Product form opened — review and save');
      return { shouldClose: true };
    }

    case 'add_products': {
      const items = (action.products ?? [])
        .map((p) => ({ ...p, name: normalizeProductName(p.name) }))
        .filter((p) => p.name);
      if (!items.length) {
        toast.error('No valid product names found');
        return {};
      }
      if (!businessId) {
        navigate('/dashboard/profile');
        toast.info('Create your business profile first');
        return { shouldClose: true };
      }
      let added = 0;
      const failed: string[] = [];
      for (const item of items) {
        const ok = await tryCreateProduct(businessId, item);
        if (ok) added++;
        else failed.push(item.name!);
      }
      store.bumpProductRefresh();
      if (refreshBusiness) await refreshBusiness().catch(() => undefined);
      navigate('/dashboard/products');

      if (added > 0) {
        toast.success(`${added} product${added > 1 ? 's' : ''} added`);
        if (failed.length) {
          toast.warning(`Could not add: ${failed.join(', ')}`);
        }
        return { shouldClose: true };
      }

      toast.error('Could not add products — check plan limits or try again');
      return {};
    }

    default:
      return {};
  }
}

function normalizeCategoryName(name: string): string {
  let cleaned = name.trim();
  const patterns = [
    /^(?:please\s+)?(?:create|add|new|insert|make)\s+(?:a\s+)?categories?\s+(?:named|called|name is)?\s*/i,
    /^categories?\s+(?:named|called|name is)\s*/i,
  ];
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

function normalizeProductName(name: string): string {
  let cleaned = name.trim();
  const patterns = [
    /^(?:please\s+)?(?:create|add|new|insert|make|plant|plans)\s+(?:a\s+|some\s+)?products?\s+(?:like\s+)?(?:tiffins?\s+)?(?:like\s+)?/i,
    /^products?\s+(?:named|called|like)\s+/i,
    /^(?:like|plant|plans|a|an|the|some)\s+/i,
  ];
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

async function tryCreateProduct(businessId: string, action: AiProductItem): Promise<boolean> {
  try {
    const categories = await getCategories(businessId);
    let categoryId: string | undefined;
    const categoryName = action.categoryName ? normalizeCategoryName(action.categoryName) : undefined;

    if (categoryName) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
      );
      if (match) {
        categoryId = match.id;
      } else {
        const created = await createCategory({ businessId, name: categoryName });
        categoryId = created.id;
      }
    }

    await createProduct({
      businessId,
      name: action.name!,
      description: action.description,
      price: action.price ?? 199,
      categoryId,
      available: true,
    });
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, `Could not add "${action.name}"`));
    return false;
  }
}
