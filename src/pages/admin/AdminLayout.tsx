import { useLocation } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LineChart,
  Package,
  Users,
  Wallet,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../components/layout/Sidebar';

const items: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Businesses', to: '/admin/businesses', icon: Building2 },
  { label: 'Plans', to: '/admin/plans', icon: Package },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard },
  { label: 'Payments', to: '/admin/payments', icon: Wallet },
  { label: 'Reports', to: '/admin/reports', icon: LineChart },
];

const titles: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'Platform overview' },
  '/admin/users': { title: 'Users', subtitle: 'Manage platform users' },
  '/admin/businesses': { title: 'Businesses', subtitle: 'Manage & verify businesses' },
  '/admin/plans': { title: 'Plans', subtitle: 'Subscription plan management' },
  '/admin/subscriptions': { title: 'Subscriptions', subtitle: 'Active subscribers' },
  '/admin/payments': { title: 'Payments', subtitle: 'All transactions' },
  '/admin/reports': { title: 'Reports', subtitle: 'Revenue analytics' },
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const meta = titles[pathname] ?? { title: 'Admin', subtitle: '' };

  return (
    <DashboardLayout
      items={items}
      brandTitle="Bizora App"
      brandSubtitle="Super Admin"
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
      showAi={false}
    />
  );
}
