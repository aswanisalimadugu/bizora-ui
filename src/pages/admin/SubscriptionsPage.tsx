import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { createPlan, getAdminSubscriptions } from '../../api/adminApi';
import { BusinessFilter } from '../../components/admin/BusinessFilter';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { Input, Textarea } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge, statusTone } from '../../components/common/Badge';
import type { AdminSubscriptionRow, SubscriptionPlan } from '../../types';
import { formatDate, getErrorMessage } from '../../utils/format';

interface PlanForm {
  name: string;
  price: number;
  durationDays: number;
  features: string;
}

export default function SubscriptionsPage() {
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanForm>();

  const load = () => {
    setLoading(true);
    getAdminSubscriptions()
      .then(setRows)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () => (businessId ? rows.filter((r) => r.businessId === businessId) : rows),
    [rows, businessId],
  );

  const onSubmit = async (values: PlanForm) => {
    setSaving(true);
    try {
      const plan: SubscriptionPlan = {
        name: values.name,
        price: Number(values.price),
        durationDays: Number(values.durationDays),
        features: values.features,
        active: true,
      };
      await createPlan(plan);
      toast.success('Plan created');
      setModalOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<AdminSubscriptionRow>[] = [
    {
      header: 'Business',
      render: (r) => <span className="font-medium text-slate-900">{r.business}</span>,
    },
    { header: 'Plan', render: (r) => <Badge tone="indigo">{r.plan}</Badge> },
    { header: 'Start', render: (r) => formatDate(r.startDate) },
    { header: 'End', render: (r) => formatDate(r.endDate) },
    { header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BusinessFilter value={businessId} onChange={setBusinessId} className="min-w-[200px]" />
        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Create plan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(r) => r.id}
        pageSize={10}
        emptyTitle="No subscriptions yet"
        emptyDescription="Subscriptions from businesses will appear here."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create subscription plan"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              Create plan
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Plan name"
            placeholder="Growth"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              error={errors.price?.message}
              {...register('price', { required: 'Price is required', min: 0 })}
            />
            <Input
              label="Duration (days)"
              type="number"
              error={errors.durationDays?.message}
              {...register('durationDays', { required: 'Duration is required', min: 1 })}
            />
          </div>
          <Textarea
            label="Features (comma-separated)"
            rows={3}
            placeholder="Unlimited products, Order management, Priority support"
            {...register('features')}
          />
        </form>
      </Modal>
    </div>
  );
}
