import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Download, Receipt, Store } from 'lucide-react';
import { getBusinessPayments, type OwnerPayment } from '../../api/paymentApi';
import { Badge, statusTone } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { PageStat, PageStats } from '../../components/layout/PageStats';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import { exportToCsv } from '../../utils/csv';
import { formatCurrency, formatDateTime, getErrorMessage } from '../../utils/format';

type Filter = 'ALL' | 'ORDER' | 'SUBSCRIPTION';

export default function OwnerPaymentsPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { canExport } = useEntitlements();
  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');

  useEffect(() => {
    if (!activeBusiness) return;
    setLoading(true);
    getBusinessPayments(activeBusiness.id)
      .then(setPayments)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [activeBusiness]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return payments;
    return payments.filter((p) => (p.type ?? '').toUpperCase() === filter);
  }, [payments, filter]);

  const successOrderTotal = useMemo(
    () =>
      payments
        .filter((p) => p.type === 'ORDER' && p.status?.toUpperCase() === 'SUCCESS')
        .reduce((sum, p) => sum + Number(p.amount), 0),
    [payments],
  );

  if (!loaded) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Store}
        title="No business profile yet"
        description="Create your business profile to view payment history."
      />
    );
  }

  const exportCsv = () => {
    if (!canExport) {
      toast.info('Upgrade your plan to export payments');
      return;
    }
    exportToCsv(
      'payments.csv',
      [
        { key: 'type', header: 'Type' },
        { key: 'orderNumber', header: 'Order' },
        { key: 'transactionId', header: 'Transaction' },
        { key: 'gatewayPaymentId', header: 'Gateway payment ID' },
        { key: 'amount', header: 'Amount' },
        { key: 'gateway', header: 'Gateway' },
        { key: 'status', header: 'Status' },
        { key: 'createdAt', header: 'Date' },
      ],
      filtered,
    );
  };

  const columns: Column<OwnerPayment>[] = [
    {
      header: 'Type',
      render: (p) => {
        const type = (p.type ?? 'OTHER').toUpperCase();
        const tone = type === 'ORDER' ? 'green' : type === 'SUBSCRIPTION' ? 'indigo' : 'gray';
        return <Badge tone={tone}>{type === 'ORDER' ? 'Order' : type === 'SUBSCRIPTION' ? 'Plan' : type}</Badge>;
      },
    },
    {
      header: 'Reference',
      render: (p) => {
        if (p.type === 'ORDER' && p.orderNumber) {
          return (
            <Link
              to="/dashboard/orders"
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              {p.orderNumber}
            </Link>
          );
        }
        if (p.type === 'SUBSCRIPTION') {
          return <span className="text-sm text-slate-600 dark:text-slate-300">Subscription</span>;
        }
        return <span className="text-slate-400">—</span>;
      },
    },
    {
      header: 'Transaction',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Receipt className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">
              {p.gatewayPaymentId || p.transactionId || p.id}
            </p>
            {p.gatewayPaymentId && p.transactionId ? (
              <p className="truncate text-[11px] text-slate-400">Order: {p.transactionId}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    { header: 'Amount', render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span> },
    { header: 'Gateway', render: (p) => p.gateway ?? '—' },
    { header: 'Status', render: (p) => <Badge tone={statusTone(p.status)}>{p.status}</Badge> },
    { header: 'Date', render: (p) => formatDateTime(p.createdAt) },
  ];

  const filters: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'ORDER', label: 'Orders' },
    { id: 'SUBSCRIPTION', label: 'Plans' },
  ];

  return (
    <div className="space-y-4">
      <PagePlanScope page="payments" />
      <PageStats>
        <PageStat label="All payments" value={payments.length} icon={Receipt} />
        <PageStat
          label="Order income (paid)"
          value={formatCurrency(successOrderTotal)}
          icon={Receipt}
          accent="from-emerald-500 to-teal-600"
        />
      </PageStats>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={canExport ? !filtered.length : false}
          leftIcon={<Download className="h-4 w-4" />}
        >
          {canExport ? 'Export CSV' : 'Export · Upgrade'}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(p) => p.id}
        pageSize={10}
        emptyTitle="No payments yet"
        emptyDescription="Customer order payments and plan renewals will appear here after checkout."
      />
    </div>
  );
}
