import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Download } from 'lucide-react';
import { getAdminPayments } from '../../api/adminApi';
import { BusinessFilter } from '../../components/admin/BusinessFilter';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { SearchBar } from '../../components/common/SearchBar';
import { Badge, statusTone } from '../../components/common/Badge';
import type { AdminPaymentRow } from '../../types';
import { exportToCsv } from '../../utils/csv';
import { formatCurrency, formatDateTime, getErrorMessage } from '../../utils/format';

export default function PaymentsPage() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [businessId, setBusinessId] = useState('');

  const load = () => {
    setLoading(true);
    getAdminPayments(businessId || undefined)
      .then(setRows)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [businessId]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.transactionId?.toLowerCase().includes(query.toLowerCase()) ||
          r.business?.toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query],
  );

  const exportCsv = () => {
    if (!filtered.length) {
      toast.info('No payments to export');
      return;
    }
    exportToCsv<AdminPaymentRow>(
      `payments-${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'transactionId', header: 'Transaction ID' },
        { key: 'business', header: 'Business' },
        { key: 'amount', header: 'Amount' },
        { key: 'gateway', header: 'Gateway' },
        { key: 'status', header: 'Status' },
        { key: 'date', header: 'Date' },
      ],
      filtered,
    );
  };

  const columns: Column<AdminPaymentRow>[] = [
    {
      header: 'Transaction ID',
      render: (r) => <span className="font-mono text-xs text-slate-600">{r.transactionId}</span>,
    },
    {
      header: 'Business',
      render: (r) => <span className="font-medium text-slate-900">{r.business}</span>,
    },
    { header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { header: 'Gateway', render: (r) => <Badge tone="blue">{r.gateway}</Badge> },
    { header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { header: 'Date', render: (r) => formatDateTime(r.date) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={query} onChange={setQuery} placeholder="Search payments..." />
          <BusinessFilter value={businessId} onChange={setBusinessId} className="min-w-[200px]" />
        </div>
        <Button variant="outline" onClick={exportCsv} leftIcon={<Download className="h-4 w-4" />}>
          Export CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(r) => r.id}
        pageSize={10}
        emptyTitle="No payments yet"
        emptyDescription="Transactions will appear here once payments are made."
      />
    </div>
  );
}
