import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Ban, BadgeCheck, CheckCircle2, ExternalLink, Plus, ShieldCheck } from 'lucide-react';
import {
  createBusiness,
  getAdminBusinesses,
  getUsers,
  updateBusinessStatus,
  verifyBusiness,
} from '../../api/adminApi';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { IconButton } from '../../components/common/IconButton';
import { Input, Select, Textarea } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SearchBar } from '../../components/common/SearchBar';
import { Badge, statusTone } from '../../components/common/Badge';
import type { AdminBusinessRow, User } from '../../types';
import { getErrorMessage } from '../../utils/format';

interface BusinessForm {
  ownerId: string;
  businessName: string;
  description: string;
  phone: string;
  whatsappNumber: string;
  city: string;
  state: string;
  pincode: string;
}

export default function BusinessesPage() {
  const [rows, setRows] = useState<AdminBusinessRow[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blockTarget, setBlockTarget] = useState<AdminBusinessRow | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessForm>();

  const load = () => {
    setLoading(true);
    Promise.all([getAdminBusinesses(), getUsers()])
      .then(([biz, users]) => {
        setRows(biz);
        setOwners(users.filter((u) => u.role === 'OWNER'));
      })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const verify = async (row: AdminBusinessRow) => {
    try {
      await verifyBusiness(row.businessId);
      toast.success('Business verified');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const setStatus = async (row: AdminBusinessRow, status: string) => {
    setStatusSaving(true);
    try {
      await updateBusinessStatus(row.businessId, status);
      toast.success(`Business ${status.toLowerCase()}`);
      setBlockTarget(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setStatusSaving(false);
    }
  };

  const onSubmit = async (values: BusinessForm) => {
    setSaving(true);
    try {
      await createBusiness({
        ownerId: values.ownerId,
        businessName: values.businessName,
        description: values.description || undefined,
        phone: values.phone || undefined,
        whatsappNumber: values.whatsappNumber || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        pincode: values.pincode || undefined,
      });
      toast.success('Business created');
      setModalOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create business'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.businessName?.toLowerCase().includes(query.toLowerCase()) ||
          r.ownerName?.toLowerCase().includes(query.toLowerCase()) ||
          r.city?.toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query],
  );

  const columns: Column<AdminBusinessRow>[] = [
    {
      header: 'Business',
      render: (r) => <span className="font-medium text-slate-900">{r.businessName}</span>,
    },
    { header: 'Owner', accessor: 'ownerName' },
    { header: 'Mobile', accessor: 'mobile' },
    { header: 'City', accessor: 'city' },
    { header: 'Plan', render: (r) => <Badge tone="blue">{r.subscriptionPlan}</Badge> },
    { header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      header: 'Verified',
      render: (r) =>
        r.verified ? (
          <Badge tone="green">
            <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
          </Badge>
        ) : (
          <Badge tone="gray">Unverified</Badge>
        ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <a
            href={`/business/${r.slug}`}
            target="_blank"
            rel="noreferrer"
            title="View public page"
            aria-label="View public page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          {!r.verified && (
            <IconButton icon={ShieldCheck} label="Verify" tone="indigo" onClick={() => verify(r)} />
          )}
          {r.status?.toUpperCase() === 'ACTIVE' ? (
            <IconButton
              icon={Ban}
              label="Block"
              tone="rose"
              onClick={() => setBlockTarget(r)}
            />
          ) : (
            <IconButton
              icon={CheckCircle2}
              label="Activate"
              tone="emerald"
              onClick={() => setStatus(r, 'ACTIVE')}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search businesses..." />
        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Create business
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(r) => r.businessId}
        pageSize={10}
        emptyTitle="No businesses found"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create business"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              Create business
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Select
            label="Owner"
            error={errors.ownerId?.message}
            {...register('ownerId', { required: 'Select an owner' })}
          >
            <option value="">Select owner...</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.email})
              </option>
            ))}
          </Select>
          <Input
            label="Business name"
            error={errors.businessName?.message}
            {...register('businessName', { required: 'Business name is required' })}
          />
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" {...register('phone')} />
            <Input label="WhatsApp" {...register('whatsappNumber')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" {...register('city')} />
            <Input label="State" {...register('state')} />
            <Input label="Pincode" {...register('pincode')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!blockTarget}
        title="Block business"
        message={`Block "${blockTarget?.businessName}"? Its public page will be disabled until reactivated.`}
        confirmLabel="Block business"
        loading={statusSaving}
        onConfirm={() => blockTarget && setStatus(blockTarget, 'BLOCKED')}
        onCancel={() => setBlockTarget(null)}
      />
    </div>
  );
}
