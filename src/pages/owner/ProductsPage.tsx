import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ImagePlus, Package, Pencil, Plus, QrCode, Store, Trash2 } from 'lucide-react';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from '../../api/productApi';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { IconButton } from '../../components/common/IconButton';
import { PageToolbar } from '../../components/layout/PageToolbar';
import { PageStat, PageStats } from '../../components/layout/PageStats';
import { AiGenerateButton } from '../../components/common/AiGenerateButton';
import { AiProductFillButton } from '../../components/common/AiProductFillButton';
import { VoiceInputButton } from '../../components/common/VoiceInputButton';
import { Input, Select, Textarea } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ProductItemQr } from '../../components/business/ProductItemQr';
import { ProductLimitBanner } from '../../components/owner/ProductLimitBanner';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { getProductLimits } from '../../api/paymentApi';
import { useBusinessStore } from '../../store/businessStore';
import { useAiActionStore } from '../../store/aiActionStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import type { Category, Product, ProductLimits } from '../../types';
import { formatCurrency, getErrorMessage, imageUrl } from '../../utils/format';

interface ProductForm {
  name: string;
  description: string;
  options: string;
  price: number;
  categoryId: string;
  available: boolean;
}

export default function ProductsPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { report } = useEntitlements();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [limits, setLimits] = useState<ProductLimits | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({ defaultValues: { available: true } });

  const productName = watch('name');
  const categoryId = watch('categoryId');

  const matchCategory = (name: string) =>
    categories.find((c) => c.name.toLowerCase() === name.toLowerCase());

  const handleAiFill = (data: { description: string; price: number; categoryName: string }) => {
    setValue('description', data.description);
    setValue('price', data.price);
    const match = matchCategory(data.categoryName);
    if (match) {
      setValue('categoryId', match.id);
    } else if (data.categoryName) {
      toast.info(`Suggested category "${data.categoryName}" — create it in Categories if needed`);
    }
  };

  const productRefreshTick = useAiActionStore((s) => s.productRefreshTick);

  const load = () => {
    if (!activeBusiness) return;
    setLoading(true);
    Promise.all([getProducts(activeBusiness.id), getCategories(activeBusiness.id), getProductLimits(activeBusiness.id)])
      .then(([p, c, lim]) => {
        setProducts(p);
        setCategories(c);
        setLimits(lim);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeBusiness, productRefreshTick]);

  useEffect(() => {
    const pending = useAiActionStore.getState().pendingProduct;
    if (!pending || !activeBusiness) return;
    // Wait until categories are loaded so we can match categoryName
    if (pending.categoryName && categories.length === 0) return;

    const data = useAiActionStore.getState().consumePendingProduct();
    if (!data) return;

    setEditing(null);
    reset({
      name: data.name,
      description: data.description ?? '',
      options: '',
      price: data.price,
      categoryId: '',
      available: true,
    });
    if (data.categoryName) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === data.categoryName!.toLowerCase(),
      );
      if (match) setValue('categoryId', match.id);
    }
    setImage(undefined);
    setPreview(undefined);
    if (data.openModal !== false) setModalOpen(true);
  }, [activeBusiness, categories, reset, setValue, productRefreshTick]);

  const atLimit = limits != null && !limits.unlimited && limits.current >= limits.max;

  const openCreate = () => {
    if (atLimit) {
      toast.error('Product limit reached — upgrade your plan to add more');
      return;
    }
    setEditing(null);
    reset({ name: '', description: '', options: '', price: undefined, categoryId: '', available: true });
    setImage(undefined);
    setPreview(undefined);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    reset({
      name: product.name,
      description: product.description ?? '',
      options: product.options ?? '',
      price: product.price,
      categoryId: product.categoryId ?? '',
      available: product.available,
    });
    setImage(undefined);
    setPreview(imageUrl(product.imageUrl));
    setModalOpen(true);
  };

  const onSubmit = async (values: ProductForm) => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      const payload = {
        businessId: activeBusiness.id,
        name: values.name,
        description: values.description,
        options: values.options?.trim() || undefined,
        price: Number(values.price),
        categoryId: values.categoryId || undefined,
        available: Boolean(values.available),
      };
      if (editing) {
        await updateProduct(editing.id, payload, image);
        toast.success('Product updated');
      } else {
        await createProduct(payload, image);
        toast.success('Product added');
      }
      setModalOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save product'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const toggleStock = async (product: Product) => {
    if (!activeBusiness) return;
    const next = !product.available;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, available: next } : p)));
    try {
      await updateProduct(product.id, {
        businessId: activeBusiness.id,
        available: next,
      });
      toast.success(next ? 'Marked available' : 'Marked out of stock');
    } catch (error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, available: product.available } : p)),
      );
      toast.error(getErrorMessage(error, 'Could not update stock'));
    }
  };

  const categoryName = (product: Product) =>
    categories.find((c) => c.id === product.categoryId)?.name;

  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const cat = categoryName(p)?.toLowerCase() ?? '';
    return p.name.toLowerCase().includes(q) || cat.includes(q);
  });

  if (!loaded) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Store}
        title="No business profile yet"
        description="Create your business profile before adding products."
      />
    );
  }

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
            {imageUrl(p.imageUrl) ? (
              <img src={imageUrl(p.imageUrl)} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <span className="max-w-[14rem] truncate font-medium text-slate-900 dark:text-slate-100" title={p.name}>
            {p.name}
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (p) => {
        const name = categoryName(p);
        return name ? (
          <span className="inline-flex max-w-[10rem] truncate rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {name}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Uncategorized</span>
        );
      },
    },
    { header: 'Price', render: (p) => formatCurrency(p.price) },
    {
      header: 'Stock',
      render: (p) => (
        <button
          type="button"
          onClick={() => toggleStock(p)}
          className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold ring-1 ring-inset transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            p.available
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-400'
          }`}
          title={p.available ? 'Click → Out of stock' : 'Click → Available'}
          aria-pressed={p.available}
        >
          <span
            className={`relative h-4 w-7 shrink-0 rounded-full transition ${
              p.available ? 'bg-emerald-500' : 'bg-rose-400'
            }`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${
                p.available ? 'left-3.5' : 'left-0.5'
              }`}
            />
          </span>
          {p.available ? 'Available' : 'Out of stock'}
        </button>
      ),
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={QrCode} label="Item QR code" tone="indigo" onClick={() => setQrProduct(p)} />
          <IconButton icon={Pencil} label="Edit" tone="indigo" onClick={() => openEdit(p)} />
          <IconButton icon={Trash2} label="Delete" tone="rose" onClick={() => setDeleteTarget(p)} />
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-5">
      <PagePlanScope
        page="products"
        freeLimitOverride={
          report?.productLimits
            ? report.productLimits.unlimited
              ? `${report.productLimits.current} / ∞ products`
              : `${report.productLimits.current} / ${report.productLimits.max} products`
            : limits
              ? limits.unlimited
                ? `${limits.current} / ∞ products`
                : `${limits.current} / ${limits.max} products`
              : undefined
        }
      />
      <ProductLimitBanner limits={limits} />
      <PageStats>
        <PageStat label="Total products" value={products.length} icon={Package} />
        {limits ? (
          <PageStat
            label="Plan limit"
            value={limits.unlimited ? `${limits.current} / ∞` : `${limits.current} / ${limits.max}`}
            icon={Package}
            accent="from-accent-500 to-brand-600"
          />
        ) : null}
      </PageStats>
      <PageToolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Search products or category…' }}
        primaryAction={
          <Button onClick={openCreate} disabled={atLimit} leftIcon={<Plus className="h-4 w-4" />}>
            Add product
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(p) => p.id}
        pageSize={10}
        emptyIcon={Package}
        emptyTitle="No products yet"
        emptyDescription="Add your first product to start selling through your Bizora App store."
        emptyAction={
          <Button onClick={openCreate} disabled={atLimit} leftIcon={<Plus className="h-4 w-4" />}>
            Add product
          </Button>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit product' : 'Add product'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              {editing ? 'Save changes' : 'Save product'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
            {preview ? (
              <img src={preview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <span className="flex items-center text-sm text-slate-400">
                <ImagePlus className="mr-2 h-5 w-5" /> Product image
              </span>
            )}
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImage(file);
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <div className="flex gap-2">
              <Input
                error={errors.name?.message}
                className="flex-1"
                {...register('name', { required: 'Name is required' })}
              />
              <VoiceInputButton onResult={(text) => setValue('name', text)} size="md" />
            </div>
          </div>

          {!editing && (
            <AiProductFillButton
              productName={productName}
              businessName={activeBusiness?.businessName}
              existingCategories={categories.map((c) => c.name)}
              onFill={handleAiFill}
            />
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <AiGenerateButton
                type="product_description"
                params={{ name: productName, category: categories.find((c) => c.id === categoryId)?.name }}
                disabled={!productName}
                onResult={(text) => setValue('description', text)}
                label="Rewrite"
              />
            </div>
            <Textarea rows={2} {...register('description')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Options
            </label>
            <Input
              placeholder="Spicy, Double masala"
              {...register('options')}
            />
            <p className="mt-1 text-xs text-slate-400">
              Comma-separated choices customers can pick (optional)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              step="0.01"
              error={errors.price?.message}
              {...register('price', {
                required: 'Price is required',
                min: { value: 0, message: 'Must be positive' },
              })}
            />
            <Select label="Category" {...register('categoryId')}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded" {...register('available')} />
            Available for sale
          </label>
        </form>
      </Modal>

      <Modal
        open={!!qrProduct}
        onClose={() => setQrProduct(null)}
        title="Item QR code"
        footer={
          <Button variant="outline" onClick={() => setQrProduct(null)}>
            Close
          </Button>
        }
      >
        {qrProduct && activeBusiness && (
          <ProductItemQr
            product={qrProduct}
            businessName={activeBusiness.businessName}
            slug={activeBusiness.slug}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
