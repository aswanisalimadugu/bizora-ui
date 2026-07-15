import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Mail, Phone, Plus, Store, Trash2, UserRound, Download } from 'lucide-react';
import { createCustomer, deleteCustomer, getCustomers } from '../../api/orderApi';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { IconButton } from '../../components/common/IconButton';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { PageToolbar } from '../../components/layout/PageToolbar';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import type { Customer } from '../../types';
import { formatDate, getErrorMessage } from '../../utils/format';
import { exportToCsv } from '../../utils/csv';

interface CustomerForm {
  name: string;
  mobile: string;
  email: string;
}

export default function CustomersPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { canExport } = useEntitlements();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [viewTarget, setViewTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>();

  const load = () => {
    if (!activeBusiness) return;
    setLoading(true);
    getCustomers(activeBusiness.id)
      .then(setCustomers)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeBusiness]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    );
  }, [customers, search]);

  const onSubmit = async (values: CustomerForm) => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      await createCustomer({
        businessId: activeBusiness.id,
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        email: values.email?.trim() || undefined,
      });
      toast.success('Customer saved');
      reset();
      setAddOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      toast.success('Customer removed');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (!loaded) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Store}
        title="No business profile yet"
        description="Create your business profile before managing customers."
      />
    );
  }

  const columns: Column<Customer>[] = [
    {
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
            <p className="text-xs text-slate-400">{c.mobile}</p>
          </div>
        </div>
      ),
    },
    { header: 'Email', render: (c) => c.email || '—' },
    { header: 'Joined', render: (c) => formatDate(c.createdAt) },
    {
      header: 'Actions',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={UserRound} label="View" tone="indigo" onClick={() => setViewTarget(c)} />
          <IconButton icon={Trash2} label="Delete" tone="rose" onClick={() => setDeleteTarget(c)} />
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <PagePlanScope page="customers" />
      <PageToolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Search customers…' }}
        actions={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              if (!canExport) {
                toast.info('Upgrade your plan to export customers');
                return;
              }
              exportToCsv(
                'customers-export',
                [
                  { key: 'name', header: 'Name' },
                  { key: 'mobile', header: 'Mobile' },
                  { key: 'email', header: 'Email' },
                  { key: 'joined', header: 'Joined' },
                ],
                filtered.map((c) => ({
                  name: c.name,
                  mobile: c.mobile,
                  email: c.email ?? '',
                  joined: formatDate(c.createdAt),
                })),
              );
            }}
            disabled={!filtered.length && canExport}
          >
            {canExport ? 'Export CSV' : 'Export · Upgrade'}
          </Button>
        }
        primaryAction={
          <Button onClick={() => setAddOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Add customer
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(c) => c.id}
        pageSize={10}
        emptyTitle="No customers yet"
        emptyDescription="Customers appear when they place orders or you add them manually."
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add customer"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              Save customer
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Full name"
            leftIcon={<UserRound className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Mobile"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.mobile?.message}
            {...register('mobile', {
              required: 'Mobile is required',
              pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile' },
            })}
          />
          <Input
            label="Email (optional)"
            type="email"
            leftIcon={<Mail className="h-4 w-4" />}
            {...register('email')}
          />
        </form>
      </Modal>

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Customer details"
        footer={
          <Button variant="outline" onClick={() => setViewTarget(null)}>
            Close
          </Button>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={viewTarget.name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{viewTarget.name}</p>
                <p className="text-sm text-slate-500">Customer since {formatDate(viewTarget.createdAt)}</p>
              </div>
            </div>
            <Card className="!p-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Mobile</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{viewTarget.mobile}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{viewTarget.email || '—'}</dd>
                </div>
              </dl>
            </Card>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove customer"
        message={`Remove "${deleteTarget?.name}" from your customer list?`}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
