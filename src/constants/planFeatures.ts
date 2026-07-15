/** Page-wise Free limits vs paid (money) unlocks — shown on owner pages. */

export const PAID_FROM_PRICE = 499;

export type PagePlanKey =
  | 'dashboard'
  | 'profile'
  | 'categories'
  | 'products'
  | 'qr'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'payments'
  | 'settings'
  | 'subscription';

export interface PagePlanCopy {
  /** Short limit line for Free, e.g. "5 products" */
  freeLimit?: string;
  freeIncludes: string[];
  /** Money / paid unlocks for this page */
  paidExtras: string[];
}

export const PAGE_PLAN_COPY: Record<PagePlanKey, PagePlanCopy> = {
  orders: {
    freeLimit: 'Last 7 days of orders',
    freeIncludes: [
      'Accept / complete / WhatsApp',
      'Edit unpaid items',
      'Last 7 days only — older orders auto-delete',
    ],
    paidExtras: ['Keep full order history', 'CSV export of all orders'],
  },
  customers: {
    freeLimit: 'Customers tied to last 7 days',
    freeIncludes: ['View & add customers', 'Search', 'Orphans cleaned with old orders'],
    paidExtras: ['Keep full customer history', 'CSV customer export'],
  },
  reports: {
    freeLimit: 'Last 7 days income',
    freeIncludes: [
      'Today’s income',
      'Plan usage bars',
      'Older sales data auto-deleted on Free',
    ],
    paidExtras: ['14 / 30 / 90 day reports', 'Full history kept', 'CSV export'],
  },
  payments: {
    freeLimit: 'Last 7 days order payments',
    freeIncludes: [
      'View order & plan payments',
      'Filter by type',
      'Plan/billing payments always kept',
    ],
    paidExtras: ['Keep all order payment history', 'CSV payment export'],
  },
  dashboard: {
    freeLimit: 'Stats from last 7 days',
    freeIncludes: [
      'Order counts (7 days)',
      'Today’s income',
      'Public link & QR preview',
    ],
    paidExtras: ['Full history stats', 'Top product ranking', 'Deeper sales analytics'],
  },
  profile: {
    freeIncludes: ['Edit business profile', 'Public page basics'],
    paidExtras: ['AI description write', 'Priority branding tools'],
  },
  categories: {
    freeLimit: '3 categories',
    freeIncludes: ['Create / rename / delete within limit'],
    paidExtras: ['More categories (10+)', 'Higher plan caps'],
  },
  products: {
    freeLimit: '5 products',
    freeIncludes: ['Add / edit / stock toggle', 'Item QR view'],
    paidExtras: ['More products (20+)', 'AI auto-fill', 'Unlimited on higher plans'],
  },
  qr: {
    freeIncludes: ['View QR', 'Copy link', 'Share'],
    paidExtras: ['Download PNG', 'Print poster', 'Regenerate QR'],
  },
  settings: {
    freeIncludes: ['Account & theme', 'See current plan', 'Connect Razorpay'],
    paidExtras: ['Paid plan renewals & higher limits'],
  },
  subscription: {
    freeIncludes: [
      'Stay on Free with catalog limits',
      '1 week order data retention',
    ],
    paidExtras: ['Starter / Growth / Pro — keep history & premium tools'],
  },
};
