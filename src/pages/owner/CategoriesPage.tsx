import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderTree, Pencil, Plus, Sparkles, Store, Trash2, Wand2 } from 'lucide-react';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../api/productApi';
import { generateCategorySuggestions } from '../../api/aiApi';
import { getCategoryLimits } from '../../api/paymentApi';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { IconButton } from '../../components/common/IconButton';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { PlanLimitBanner } from '../../components/owner/PlanLimitBanner';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { PageToolbar } from '../../components/layout/PageToolbar';
import { PageStat, PageStats } from '../../components/layout/PageStats';
import { VoiceInputButton } from '../../components/common/VoiceInputButton';
import { useAiActionStore } from '../../store/aiActionStore';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import type { Category, CategoryLimits } from '../../types';
import { formatDate, getErrorMessage } from '../../utils/format';

export default function CategoriesPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { report, canUseAi } = useEntitlements();
  const [categories, setCategories] = useState<Category[]>([]);
  const [limits, setLimits] = useState<CategoryLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<{ name: string }>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<{ name: string }>();

  const load = () => {
    if (!activeBusiness) return;
    setLoading(true);
    Promise.all([getCategories(activeBusiness.id), getCategoryLimits(activeBusiness.id)])
      .then(([cats, lim]) => {
        setCategories(cats);
        setLimits(lim);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeBusiness]);

  const categoryRefreshTick = useAiActionStore((s) => s.categoryRefreshTick);
  useEffect(() => {
    if (categoryRefreshTick > 0) load();
  }, [categoryRefreshTick, activeBusiness]);

  useEffect(() => {
    const pending = useAiActionStore.getState().consumePendingCategories();
    if (pending?.length) {
      setSuggestions(pending);
      toast.info('AI category suggestions ready');
    }
  }, [activeBusiness]);

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search],
  );

  const atLimit = limits != null && !limits.unlimited && limits.current >= limits.max;

  const openAdd = () => {
    if (atLimit) {
      toast.error(`Category limit reached (${limits?.max}). Upgrade your plan to add more.`);
      return;
    }
    reset({ name: '' });
    setAddOpen(true);
  };

  const loadSuggestions = async () => {
    if (!activeBusiness) return;
    if (!canUseAi) {
      toast.info('Upgrade your plan to use AI suggestions');
      return;
    }
    setLoadingSuggestions(true);
    try {
      const list = await generateCategorySuggestions({
        businessId: activeBusiness.id,
        businessName: activeBusiness.businessName,
        businessDescription: activeBusiness.description,
        existingCategories: categories.map((c) => c.name).join(', '),
      });
      setSuggestions(list);
      toast.success('AI suggestions ready — tap to add');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not get suggestions'));
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addFromSuggestion = async (name: string) => {
    if (!activeBusiness) return;
    if (atLimit) {
      toast.error(`Category limit reached (${limits?.max}). Upgrade your plan to add more.`);
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.info(`"${name}" already exists`);
      return;
    }
    setSaving(true);
    try {
      await createCategory({ businessId: activeBusiness.id, name });
      toast.success(`"${name}" added`);
      load();
      setSuggestions((s) => s.filter((x) => x !== name));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async ({ name }: { name: string }) => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      await createCategory({ businessId: activeBusiness.id, name });
      toast.success('Category added');
      reset({ name: '' });
      setAddOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add category'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (category: Category) => {
    setEditTarget(category);
    resetEdit({ name: category.name });
  };

  const onEdit = async ({ name }: { name: string }) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateCategory(editTarget.id, name);
      toast.success('Category updated');
      setEditTarget(null);
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
      await deleteCategory(deleteTarget.id);
      toast.success('Category deleted');
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
        description="Create your business profile before adding categories."
      />
    );
  }

  const columns: Column<Category>[] = [
    {
      header: 'Category',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <FolderTree className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
        </div>
      ),
    },
    { header: 'Created', render: (c) => formatDate(c.createdAt) },
    {
      header: 'Actions',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Edit" tone="indigo" onClick={() => openEdit(c)} />
          <IconButton icon={Trash2} label="Delete" tone="rose" onClick={() => setDeleteTarget(c)} />
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-5">
      <PagePlanScope
        page="categories"
        freeLimitOverride={
          report?.categoryLimits
            ? report.categoryLimits.unlimited
              ? `${report.categoryLimits.current} / ∞ categories`
              : `${report.categoryLimits.current} / ${report.categoryLimits.max} categories`
            : limits
              ? limits.unlimited
                ? `${limits.current} / ∞ categories`
                : `${limits.current} / ${limits.max} categories`
              : undefined
        }
      />
      <PlanLimitBanner
        limits={limits}
        label="Categories"
        nearLimitMessage="You've reached your category limit. Upgrade to add more categories."
      />
      <PageStats>
        <PageStat label="Total categories" value={categories.length} icon={FolderTree} />
        {limits ? (
          <PageStat
            label="Plan limit"
            value={limits.unlimited ? `${limits.current} / ∞` : `${limits.current} / ${limits.max}`}
            icon={FolderTree}
          />
        ) : null}
      </PageStats>

      <PageToolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Search categories…' }}
        actions={
          <Button
            variant="outline"
            onClick={loadSuggestions}
            loading={loadingSuggestions}
            leftIcon={loadingSuggestions ? <Sparkles className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          >
            {canUseAi ? 'Suggest with AI' : 'AI · Upgrade'}
          </Button>
        }
        primaryAction={
          <Button onClick={openAdd} disabled={atLimit} leftIcon={<Plus className="h-4 w-4" />}>
            Add category
          </Button>
        }
      />

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/5"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              AI suggestions — tap to add
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addFromSuggestion(s)}
                  disabled={saving}
                  className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50 dark:border-brand-500/30 dark:bg-slate-900 dark:text-brand-300 dark:hover:bg-brand-500/15"
                >
                  + {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(c) => c.id}
        pageSize={10}
        emptyIcon={FolderTree}
        emptyTitle="No categories yet"
        emptyDescription="Organize your catalog with categories like Tiffins, Beverages, or Biryani."
        emptyAction={
          <>
            <Button onClick={openAdd} disabled={atLimit} leftIcon={<Plus className="h-4 w-4" />}>
              Add category
            </Button>
            <Button
              variant="outline"
              onClick={loadSuggestions}
              loading={loadingSuggestions}
              leftIcon={<Wand2 className="h-4 w-4" />}
            >
              {canUseAi ? 'Suggest with AI' : 'AI · Upgrade'}
            </Button>
          </>
        }
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add category"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving} leftIcon={<Plus className="h-4 w-4" />}>
              Add category
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Category name
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Beverages, Tiffins, Biryani"
                error={errors.name?.message}
                className="flex-1"
                {...register('name', {
                  required: 'Category name is required',
                  maxLength: { value: 100, message: 'Name must be 100 characters or less' },
                  validate: (value) =>
                    !categories.some((c) => c.name.toLowerCase() === value.trim().toLowerCase()) ||
                    'This category already exists',
                })}
              />
              <VoiceInputButton onResult={(text) => setValue('name', text)} size="md" />
            </div>
          </div>
          <button
            type="button"
            onClick={loadSuggestions}
            disabled={loadingSuggestions}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/5 dark:text-brand-300"
          >
            {loadingSuggestions ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Get AI category ideas
          </button>
        </form>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit category"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit(onEdit)} loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <Input
          label="Category name"
          error={editErrors.name?.message}
          {...registerEdit('name', {
            required: 'Name is required',
            maxLength: { value: 100, message: 'Name must be 100 characters or less' },
            validate: (value) =>
              !categories.some(
                (c) => c.id !== editTarget?.id && c.name.toLowerCase() === value.trim().toLowerCase(),
              ) || 'This category already exists',
          })}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"? Products in this category won't be deleted.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
