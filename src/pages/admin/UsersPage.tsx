import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Ban, CheckCircle2, Eye, Pencil, Plus } from 'lucide-react';
import { createUser, getUsers, updateUser, updateUserStatus } from '../../api/adminApi';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { IconButton } from '../../components/common/IconButton';
import { Input, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SearchBar } from '../../components/common/SearchBar';
import { Avatar } from '../../components/common/Avatar';
import { Badge, statusTone } from '../../components/common/Badge';
import type { User } from '../../types';
import { formatDateTime, getErrorMessage } from '../../utils/format';

interface CreateForm {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
}

interface EditForm {
  name: string;
  mobile: string;
  password: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const createForm = useForm<CreateForm>({ defaultValues: { role: 'OWNER' } });
  const editForm = useForm<EditForm>();

  const load = () => {
    setLoading(true);
    getUsers()
      .then(setUsers)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeStatus = async (user: User, status: string) => {
    setStatusSaving(true);
    try {
      await updateUserStatus(user.id, status);
      toast.success(`User ${status.toLowerCase()}`);
      setBlockTarget(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setStatusSaving(false);
    }
  };

  const onCreate = async (values: CreateForm) => {
    setSaving(true);
    try {
      await createUser(values);
      toast.success('User created');
      setCreateOpen(false);
      createForm.reset({ name: '', email: '', mobile: '', password: '', role: 'OWNER' });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create user'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    editForm.reset({ name: user.name, mobile: user.mobile, password: '' });
  };

  const onEdit = async (values: EditForm) => {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateUser(editUser.id, {
        name: values.name,
        mobile: values.mobile,
        password: values.password || undefined,
      });
      toast.success('User updated');
      setEditUser(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update user'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (!roleFilter || u.role === roleFilter) &&
          (u.name?.toLowerCase().includes(query.toLowerCase()) ||
            u.email?.toLowerCase().includes(query.toLowerCase()) ||
            u.mobile?.includes(query)),
      ),
    [users, query, roleFilter],
  );

  const columns: Column<User>[] = [
    {
      header: 'Name',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
            <p className="truncate text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Mobile', accessor: 'mobile' },
    { header: 'Role', render: (u) => <Badge tone={u.role === 'ADMIN' ? 'indigo' : 'blue'}>{u.role}</Badge> },
    { header: 'Status', render: (u) => <Badge tone={statusTone(u.status)}>{u.status}</Badge> },
    {
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton icon={Eye} label="View" tone="slate" onClick={() => setViewUser(u)} />
          {u.role !== 'ADMIN' && (
            <IconButton icon={Pencil} label="Edit" tone="indigo" onClick={() => openEdit(u)} />
          )}
          {u.role !== 'ADMIN' &&
            (u.status?.toUpperCase() === 'ACTIVE' ? (
              <IconButton
                icon={Ban}
                label="Block"
                tone="rose"
                onClick={() => setBlockTarget(u)}
              />
            ) : (
              <IconButton
                icon={CheckCircle2}
                label="Activate"
                tone="emerald"
                onClick={() => changeStatus(u, 'ACTIVE')}
              />
            ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={query} onChange={setQuery} placeholder="Search users..." />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            <option value="">All roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Create user
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(u) => u.id}
        pageSize={10}
        emptyTitle="No users found"
      />

      {/* Create */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create user"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createForm.handleSubmit(onCreate)} loading={saving}>
              Create user
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
          <Input
            label="Full name"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email"
            type="email"
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email', { required: 'Email is required' })}
          />
          <Input
            label="Mobile"
            error={createForm.formState.errors.mobile?.message}
            {...createForm.register('mobile', { required: 'Mobile is required' })}
          />
          <Input
            label="Password"
            type="password"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Min 6 characters' },
            })}
          />
          <Select label="Role" {...createForm.register('role')}>
            <option value="OWNER">Owner (Business)</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </form>
      </Modal>

      {/* View */}
      <Modal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        title="User details"
        footer={
          <Button variant="outline" onClick={() => setViewUser(null)}>
            Close
          </Button>
        }
      >
        {viewUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={viewUser.name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{viewUser.name}</p>
                <div className="mt-1 flex gap-2">
                  <Badge tone={viewUser.role === 'ADMIN' ? 'indigo' : 'blue'}>{viewUser.role}</Badge>
                  <Badge tone={statusTone(viewUser.status)}>{viewUser.status}</Badge>
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="font-medium text-slate-800">{viewUser.email}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Mobile</dt>
                <dd className="font-medium text-slate-800">{viewUser.mobile}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Joined</dt>
                <dd className="font-medium text-slate-800">{formatDateTime(viewUser.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Last login</dt>
                <dd className="font-medium text-slate-800">{formatDateTime(viewUser.lastLogin)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit user"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button onClick={editForm.handleSubmit(onEdit)} loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        {editUser && (
          <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
            <Input label="Email (read-only)" value={editUser.email} disabled readOnly />
            <Input
              label="Full name"
              error={editForm.formState.errors.name?.message}
              {...editForm.register('name', { required: 'Name is required' })}
            />
            <Input
              label="Mobile"
              error={editForm.formState.errors.mobile?.message}
              {...editForm.register('mobile', { required: 'Mobile is required' })}
            />
            <Input
              label="New password"
              type="password"
              hint="Leave blank to keep current password"
              error={editForm.formState.errors.password?.message}
              {...editForm.register('password', {
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!blockTarget}
        title="Block user"
        message={`Block "${blockTarget?.name}"? They won't be able to sign in until reactivated.`}
        confirmLabel="Block user"
        loading={statusSaving}
        onConfirm={() => blockTarget && changeStatus(blockTarget, 'BLOCKED')}
        onCancel={() => setBlockTarget(null)}
      />
    </div>
  );
}
