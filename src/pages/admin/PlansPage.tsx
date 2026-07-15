import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { createPlan, deletePlan, getPlans, updatePlan } from '../../api/adminApi';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { IconButton } from '../../components/common/IconButton';
import { Input, Textarea } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { SearchBar } from '../../components/common/SearchBar';
import type { SubscriptionPlan } from '../../types';
import { formatCurrency, getErrorMessage } from '../../utils/format';

interface PlanForm {
  name: string;
  price: number;
  durationDays: number;
  features: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanForm>();

  const load = () => {
    setLoading(true);
    getPlans()
      .then(setPlans)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () => plans.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [plans, search],
  );

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', price: undefined, durationDays: 30, features: '' });
    setModalOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    reset({
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      features: plan.features,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: PlanForm) => {
    setSaving(true);
    try {
      const payload: SubscriptionPlan = {
        name: values.name,
        price: Number(values.price),
        durationDays: Number(values.durationDays),
        features: values.features,
        active: true,
      };
      if (editing?.id) {
        await updatePlan(editing.id, payload);
        toast.success('Plan updated');
      } else {
        await createPlan(payload);
        toast.success('Plan created');
      }
      setModalOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deletePlan(deleteTarget.id);
      toast.success('Plan deactivated');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<SubscriptionPlan>[] = [
    {
      header: 'Plan',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{p.name}</span>
        </div>
      ),
    },
    { header: 'Price', render: (p) => formatCurrency(p.price) },
    { header: 'Duration', render: (p) => `${p.durationDays} days` },
    {
      header: 'Status',
      render: (p) => <Badge tone={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Edit" tone="indigo" onClick={() => openEdit(p)} />
          {p.active && (
            <IconButton icon={Trash2} label="Deactivate" tone="rose" onClick={() => setDeleteTarget(p)} />
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search plans…" className="sm:max-w-xs" />
        <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
          Create plan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(p) => p.id ?? p.name}
        pageSize={10}
        emptyTitle="No plans yet"
        emptyDescription="Create subscription plans for businesses to choose from."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit plan' : 'Create plan'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              {editing ? 'Save changes' : 'Create plan'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Plan name"
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
            placeholder="Unlimited products, Priority support, Analytics"
            error={errors.features?.message}
            {...register('features', { required: 'Features are required' })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate plan"
        message={`Deactivate "${deleteTarget?.name}"? Existing subscribers won't be affected.`}
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
