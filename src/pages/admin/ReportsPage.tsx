import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Download, TrendingUp, Wallet } from 'lucide-react';
import { getRevenueReport } from '../../api/adminApi';
import { BusinessFilter } from '../../components/admin/BusinessFilter';
import { BarChart } from '../../components/common/BarChart';
import { Button } from '../../components/common/Button';
import { Card, StatCard } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { Loader } from '../../components/common/Loader';
import type { RevenueReport } from '../../types';
import { exportToCsv } from '../../utils/csv';
import { formatCurrency, getErrorMessage } from '../../utils/format';

type MonthlyRow = { month: string; revenue: number };

export default function ReportsPage() {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    setLoading(true);
    getRevenueReport(businessId || undefined)
      .then(setReport)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) return <Loader />;
  if (!report) return null;

  const monthly = report.monthlyRevenue ?? [];
  const chartData = monthly.map((m) => ({ label: m.month, value: m.revenue }));

  const columns: Column<MonthlyRow>[] = [
    { header: 'Month', accessor: 'month' },
    { header: 'Revenue', render: (r) => formatCurrency(r.revenue), className: 'text-right' },
  ];

  const exportCsv = () => {
    if (!monthly.length) {
      toast.info('No revenue data to export');
      return;
    }
    exportToCsv<MonthlyRow>(
      `revenue-report-${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'month', header: 'Month' },
        { key: 'revenue', header: 'Revenue' },
      ],
      monthly,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <BusinessFilter value={businessId} onChange={setBusinessId} className="min-w-[220px]" />
        <Button variant="outline" onClick={exportCsv} leftIcon={<Download className="h-4 w-4" />}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(report.totalRevenue)}
          icon={Wallet}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Subscription Revenue"
          value={formatCurrency(report.subscriptionRevenue)}
          icon={TrendingUp}
          accent="bg-brand-50 text-brand-600"
        />
      </div>

      <Card>
        <h3 className="text-base font-semibold text-slate-900">Monthly revenue</h3>
        <p className="mb-4 text-sm text-slate-500">
          {businessId ? 'Revenue for selected business' : 'Revenue collected each month (all businesses)'}
        </p>
        <BarChart data={chartData} valueFormatter={formatCurrency} />
      </Card>

      <DataTable
        columns={columns}
        data={monthly}
        rowKey={(r) => r.month}
        emptyTitle="No revenue data"
      />
    </div>
  );
}
