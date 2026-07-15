import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Package,
  QrCode,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import { BusinessSwitcher } from '../../components/layout/BusinessSwitcher';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../components/layout/Sidebar';
import { SubscriptionRequiredBanner } from '../../components/owner/SubscriptionRequiredBanner';
import { useBusinessStore } from '../../store/businessStore';
import {
  useEntitlements,
  useSubscriptionEntitlementsStore,
} from '../../store/subscriptionEntitlementsStore';

const baseItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Business Profile', to: '/dashboard/profile', icon: Store },
  { label: 'Categories', to: '/dashboard/categories', icon: FolderTree },
  { label: 'Products', to: '/dashboard/products', icon: Package },
  { label: 'QR Code', to: '/dashboard/qr', icon: QrCode },
  { label: 'Orders', to: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Customers', to: '/dashboard/customers', icon: Users },
  { label: 'Reports', to: '/dashboard/reports', icon: BarChart3 },
  { label: 'Subscription', to: '/dashboard/subscription', icon: CreditCard },
  { label: 'Payments', to: '/dashboard/payments', icon: Wallet },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

const FREE_NAV_BADGES: Record<string, string> = {
  '/dashboard/categories': '3 max',
  '/dashboard/products': '5 max',
  '/dashboard/qr': 'Print ₹',
  '/dashboard/orders': '7 days',
  '/dashboard/customers': '7 days',
  '/dashboard/reports': '7 days',
  '/dashboard/payments': '7 days',
};

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your business' },
  '/dashboard/profile': { title: 'Business Profile', subtitle: 'Manage your public page' },
  '/dashboard/categories': { title: 'Categories', subtitle: 'Organize your catalog' },
  '/dashboard/products': { title: 'Products', subtitle: 'Manage your products' },
  '/dashboard/qr': { title: 'QR Code', subtitle: 'Print & share your business QR' },
  '/dashboard/orders': { title: 'Orders', subtitle: 'Track and fulfil orders' },
  '/dashboard/customers': { title: 'Customers', subtitle: 'Manage your customer base' },
  '/dashboard/reports': { title: 'Reports', subtitle: 'Daily income, plan usage & billing' },
  '/dashboard/subscription': { title: 'Subscription', subtitle: 'Your plan & billing' },
  '/dashboard/payments': { title: 'Payments', subtitle: 'Order & plan transactions' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'Account & preferences' },
};

export default function OwnerLayout() {
  const { pathname } = useLocation();
  const { loaded, refresh, activeBusiness } = useBusinessStore();
  const refreshEntitlements = useSubscriptionEntitlementsStore((s) => s.refresh);
  const clearEntitlements = useSubscriptionEntitlementsStore((s) => s.clear);
  const { canUseAi, planName, isPaid, isFree } = useEntitlements();
  const meta = titles[pathname] ?? { title: 'Dashboard', subtitle: '' };

  const items = baseItems.map((item) => ({
    ...item,
    badge: isFree ? FREE_NAV_BADGES[item.to] : undefined,
  }));

  useEffect(() => {
    if (!loaded) refresh().catch(() => undefined);
  }, [loaded, refresh]);

  useEffect(() => {
    if (!activeBusiness?.id) {
      clearEntitlements();
      return;
    }
    refreshEntitlements(activeBusiness.id).catch(() => undefined);
  }, [activeBusiness?.id, refreshEntitlements, clearEntitlements]);

  return (
    <DashboardLayout
      items={items}
      brandTitle="Bizora App"
      brandSubtitle={isPaid ? `Owner · ${planName}` : 'Owner · Free plan'}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
      actions={<BusinessSwitcher />}
      showAi={canUseAi}
      topContent={<SubscriptionRequiredBanner />}
    />
  );
}
