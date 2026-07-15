import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CreditCard,
  Download,
  IndianRupee,
  Lock,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
} from 'lucide-react';
import { getOrders } from '../../api/orderApi';
import {
  getBusinessPayments,
  getSubscriptionReport,
  type OwnerPayment,
  type SubscriptionHistoryItem,
  type SubscriptionReport,
} from '../../api/paymentApi';
import { Badge, statusTone } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, StatCard } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import type { Order, ProductLimits } from '../../types';
import { exportToCsv } from '../../utils/csv';
import { formatCurrency, formatDate, formatDateTime, getErrorMessage } from '../../utils/format';

type Tab = 'income' | 'subscription';

type DayRow = {
  date: string;
  label: string;
  orderCount: number;
  amount: number;
};

function isPaid(order: Order): boolean {
  return (order.paymentStatus ?? '').toUpperCase() === 'PAID';
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function orderDayKey(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return localDayKey(d);
}

function limitLabel(limits?: ProductLimits | null): string {
  if (!limits) return '—';
  if (limits.unlimited) return `${limits.current} / ∞`;
  return `${limits.current} / ${limits.max}`;
}

function UsageBar({ label, limits }: { label: string; limits?: ProductLimits | null }) {
  if (!limits) return null;
  const pct = limits.unlimited
    ? Math.min(100, limits.current > 0 ? 12 : 0)
    : Math.min(100, limits.max > 0 ? (limits.current / limits.max) * 100 : 0);
  const nearLimit = !limits.unlimited && limits.max > 0 && limits.current >= limits.max;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className={`font-semibold ${nearLimit ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
          {limitLabel(limits)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${nearLimit ? 'bg-amber-500' : 'bg-brand-600'}`}
          style={{ width: `${Math.max(pct, limits.current > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export default function OwnerReportsPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const entitlements = useEntitlements();
  const [fullReport, setFullReport] = useState<SubscriptionReport | null>(null);
  const subReport = fullReport ?? entitlements.report;
  const [tab, setTab] = useState<Tab>('income');
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (!activeBusiness) {
      if (loaded) setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getOrders(activeBusiness.id),
      getBusinessPayments(activeBusiness.id).catch(() => [] as OwnerPayment[]),
      getSubscriptionReport(activeBusiness.id).catch(() => null),
    ])
      .then(([ords, pays, report]) => {
        setOrders(ords);
        setPayments(pays);
        setFullReport(report);
      })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [activeBusiness, loaded]);
  useEffect(() => {
    setDays((prev) => Math.min(prev, entitlements.maxIncomeDays ?? 7));
  }, [entitlements.maxIncomeDays]);

  const maxIncomeDays = entitlements.maxIncomeDays ?? 7;
  const advanced = entitlements.canAdvancedReports;
  const dayOptions = advanced
    ? [7, 14, 30, 90].filter((n) => n <= maxIncomeDays)
    : [7];

  const paidOrders = useMemo(() => orders.filter(isPaid), [orders]);

  const rows = useMemo(() => {
    const map = new Map<string, DayRow>();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      const key = localDayKey(d);
      map.set(key, {
        date: key,
        label: d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        orderCount: 0,
        amount: 0,
      });
    }
    for (const o of paidOrders) {
      const key = orderDayKey(o.createdAt);
      const row = map.get(key);
      if (!row) continue;
      row.orderCount += 1;
      row.amount += Number(o.totalAmount) || 0;
    }
    return Array.from(map.values()).reverse();
  }, [paidOrders, days]);

  const todayKey = localDayKey(new Date());
  const todayIncome = rows.find((r) => r.date === todayKey)?.amount ?? 0;
  const periodIncome = rows.reduce((s, r) => s + r.amount, 0);
  const periodOrders = rows.reduce((s, r) => s + r.orderCount, 0);
  const maxAmount = Math.max(1, ...rows.map((r) => r.amount));

  const planPayments = useMemo(
    () => payments.filter((p) => (p.type ?? '').toUpperCase() === 'SUBSCRIPTION'),
    [payments],
  );
  const planPaidTotal = useMemo(
    () =>
      planPayments
        .filter((p) => p.status?.toUpperCase() === 'SUCCESS')
        .reduce((s, p) => s + Number(p.amount), 0),
    [planPayments],
  );

  if (!loaded) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Store}
        title="No business profile yet"
        description="Create your business profile to see income reports."
      />
    );
  }

  if (loading) return <Loader />;

  const columns: Column<DayRow>[] = [
    { header: 'Date', accessor: 'label' },
    { header: 'Paid orders', render: (r) => r.orderCount, className: 'text-right' },
    {
      header: 'Income',
      render: (r) => (
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          {formatCurrency(r.amount)}
        </span>
      ),
      className: 'text-right',
    },
  ];

  const historyColumns: Column<SubscriptionHistoryItem>[] = [
    { header: 'Plan', accessor: 'planName' },
    {
      header: 'Price',
      render: (r) => (r.planPrice != null ? formatCurrency(r.planPrice) : '—'),
    },
    {
      header: 'Period',
      render: (r) =>
        r.startDate || r.endDate ? `${formatDate(r.startDate)} → ${formatDate(r.endDate)}` : '—',
    },
    { header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { header: 'Created', render: (r) => formatDateTime(r.createdAt) },
  ];

  const billingColumns: Column<OwnerPayment>[] = [
    {
      header: 'Transaction',
      render: (p) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {p.gatewayPaymentId || p.transactionId || p.id}
        </span>
      ),
    },
    { header: 'Amount', render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span> },
    { header: 'Status', render: (p) => <Badge tone={statusTone(p.status)}>{p.status}</Badge> },
    { header: 'Date', render: (p) => formatDateTime(p.createdAt) },
  ];

  const exportCsv = () => {
    if (!advanced) {
      toast.info('Upgrade your plan to export reports');
      return;
    }
    exportToCsv(
      `daily-income-${days}d.csv`,
      [
        { key: 'date', header: 'Date' },
        { key: 'orderCount', header: 'Paid orders' },
        { key: 'amount', header: 'Income' },
      ],
      rows,
    );
  };

  const chartDays = [...rows].reverse().slice(-14);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'income', label: 'Daily income' },
    { id: 'subscription', label: 'Plan & billing' },
  ];

  return (
    <div className="space-y-6">
      <PagePlanScope
        page="reports"
        freeLimitOverride={
          advanced ? `Up to ${maxIncomeDays} days` : 'Last 7 days income'
        }
      />
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'income' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {dayOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDays(n)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    days === n
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Last {n} days
                </button>
              ))}
              {!advanced ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                  14–90 day ranges on paid plans
                </span>
              ) : null}
            </div>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={!advanced || !rows.length}
              leftIcon={advanced ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            >
              Export CSV
            </Button>
          </div>

          {!advanced ? (
            <Card className="border border-amber-200/80 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Free plan: last 7 days income
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                    Upgrade to unlock 14 / 30 / 90 day reports and CSV export.
                  </p>
                </div>
                <Link to="/dashboard/subscription">
                  <Button>Upgrade plan</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Today's income"
              value={formatCurrency(todayIncome)}
              icon={IndianRupee}
              accent="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label={`Income (${days}d)`}
              value={formatCurrency(periodIncome)}
              icon={TrendingUp}
              accent="bg-brand-50 text-brand-600"
            />
            <StatCard
              label={`Paid orders (${days}d)`}
              value={periodOrders}
              icon={ShoppingCart}
              accent="bg-violet-50 text-violet-600"
            />
          </div>

          <Card>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Daily income (last {Math.min(14, days)} days)
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Based on paid customer orders (not subscription plan payments).
            </p>
            <div className="mt-5 flex h-40 items-end justify-between gap-1.5 sm:gap-2">
              {chartDays.map((d) => (
                <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                    {d.amount > 0 ? formatCurrency(d.amount) : '—'}
                  </span>
                  <div
                    className="w-full max-w-[2.5rem] rounded-t-md bg-emerald-500/90 dark:bg-emerald-400"
                    style={{ height: `${Math.max(4, (d.amount / maxAmount) * 100)}%` }}
                    title={`${d.label}: ${formatCurrency(d.amount)}`}
                  />
                  <span className="truncate text-[10px] text-slate-400">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <DataTable
            columns={columns}
            data={rows}
            rowKey={(r) => r.date}
            pageSize={10}
            emptyTitle="No paid orders in this period"
            emptyDescription="Income appears here after customers complete online payment."
          />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Current plan"
              value={subReport?.planName ?? 'Free plan'}
              icon={CreditCard}
              accent="bg-brand-50 text-brand-600"
            />
            <StatCard
              label="Days remaining"
              value={
                subReport?.daysRemaining != null
                  ? String(subReport.daysRemaining)
                  : subReport?.planTier === 'FREE'
                    ? '∞'
                    : '—'
              }
              icon={TrendingUp}
              accent="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Plan billing paid"
              value={formatCurrency(planPaidTotal)}
              icon={IndianRupee}
              accent="bg-violet-50 text-violet-600"
            />
            <StatCard
              label="Products used"
              value={limitLabel(subReport?.productLimits)}
              icon={Package}
              accent="bg-amber-50 text-amber-600"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Plan overview
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Usage and renewal for this business.
                  </p>
                </div>
                <Badge tone={statusTone(subReport?.status === 'FREE' ? 'ACTIVE' : subReport?.status)}>
                  {subReport?.planTier === 'PAID' ? subReport?.status : 'Free'}
                </Badge>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Plan</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">
                    {subReport?.planName}
                    {subReport?.planPrice != null && Number(subReport.planPrice) > 0
                      ? ` · ${formatCurrency(subReport.planPrice)}`
                      : ''}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Period</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">
                    {subReport?.startDate || subReport?.endDate
                      ? `${formatDate(subReport?.startDate ?? undefined)} → ${formatDate(subReport?.endDate ?? undefined)}`
                      : 'No paid cycle'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Reports access</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">
                    {advanced ? `Up to ${maxIncomeDays} days + CSV` : 'Last 7 days only'}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 space-y-4">
                <UsageBar label="Products" limits={subReport?.productLimits} />
                <UsageBar label="Categories" limits={subReport?.categoryLimits} />
              </div>

              <Link to="/dashboard/subscription" className="mt-6 block">
                <Button variant="outline" fullWidth>
                  {advanced ? 'Manage / renew plan' : 'Upgrade plan'}
                </Button>
              </Link>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Plan payments
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Subscription renewals and upgrades (not customer order payments).
              </p>
              <div className="mt-4">
                <DataTable
                  columns={billingColumns}
                  data={planPayments}
                  rowKey={(p) => p.id}
                  pageSize={5}
                  emptyTitle="No plan payments yet"
                  emptyDescription="When you pay for a subscription, it shows here."
                />
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Subscription history
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              All plan checkouts and activations for this business.
            </p>
            <div className="mt-4">
              <DataTable
                columns={historyColumns}
                data={subReport?.history ?? []}
                rowKey={(r) => r.id}
                pageSize={8}
                emptyTitle="No subscription history"
                emptyDescription="Plan changes will appear here after you subscribe."
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
