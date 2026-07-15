import axios from 'axios';

export function formatCurrency(value: number | string): string {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}


export function imageUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `https://bizora-backend-ko42.onrender.com${path}`;
}

export function businessPageUrl(slug: string): string {
  const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin;
  return `${publicBase.replace(/\/$/, '')}/business/${slug}`;
}

export function itemPageUrl(slug: string, productId: string): string {
  const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin;
  return `${publicBase.replace(/\/$/, '')}/business/${slug}/item/${productId}`;
}

export function slugToTitle(slug?: string): string {
  if (!slug) return 'Business';
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
