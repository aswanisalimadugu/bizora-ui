import { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  getAdminBusinesses,
  getAdminPayments,
  getDashboard,
  getRevenueReport,
} from '../../api/adminApi';
import { BarChart } from '../../components/common/BarChart';
import { Card, StatCard } from '../../components/common/Card';
import { Badge, statusTone } from '../../components/common/Badge';
import { StatGridSkeleton } from '../../components/common/Skeleton';
import type {
  AdminBusinessRow,
  AdminPaymentRow,
  DashboardStats,
  RevenueReport,
} from '../../types';
import { formatCurrency, formatDate, getErrorMessage, initials } from '../../utils/format';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getRevenueReport().catch(() => null),
      getAdminPayments().catch(() => []),
      getAdminBusinesses().catch(() => []),
    ])
      .then(([s, r, p, b]) => {
        setStats(s);
        setReport(r);
        setPayments(p);
        setBusinesses(b);
      })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatGridSkeleton count={4} />
        <StatGridSkeleton count={3} />
      </div>
    );
  }
  if (!stats) return null;

  const revenueData =
    report?.monthlyRevenue?.map((m) => ({ label: m.month, value: m.revenue })) ?? [];
  const recentPayments = payments.slice(0, 5);
  const recentBusinesses = businesses.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Platform overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} />
          <StatCard
            label="Total Businesses"
            value={stats.totalBusinesses}
            icon={Building2}
            accent="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
          />
          <StatCard label="Total Customers" value={stats.totalCustomers} icon={Users} />
          <StatCard
            label="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={Wallet}
            accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Health & subscriptions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active Businesses"
            value={stats.activeBusinesses}
            icon={CheckCircle2}
            accent="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
          />
          <StatCard
            label="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={CreditCard}
            accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          />
          <StatCard
            label="Expired Subscriptions"
            value={stats.expiredSubscriptions}
            icon={TrendingUp}
            accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
          />
        </div>
      </section>

      <Card>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Revenue growth</h3>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Monthly revenue trend</p>
        <BarChart data={revenueData} valueFormatter={formatCurrency} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent payments</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Latest transactions</p>
          {recentPayments.length ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{p.business}</p>
                    <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No payments yet</p>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent businesses</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Newly onboarded businesses</p>
          {recentBusinesses.length ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentBusinesses.map((b) => (
                <div key={b.businessId} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                    {initials(b.businessName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{b.businessName}</p>
                    <p className="truncate text-xs text-slate-400">
                      {b.ownerName} · {b.city || '—'}
                    </p>
                  </div>
                  <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No businesses yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
