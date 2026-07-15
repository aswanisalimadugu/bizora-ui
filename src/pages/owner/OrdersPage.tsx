import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, Download, MessageCircle, Minus, Pencil, Plus, Store, Trash2 } from 'lucide-react';
import {
  getCustomers,
  getOrders,
  updateOrderItems,
  updateOrderStatus,
} from '../../api/orderApi';
import { getProducts } from '../../api/productApi';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { IconButton } from '../../components/common/IconButton';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Badge, statusTone } from '../../components/common/Badge';
import { PageToolbar } from '../../components/layout/PageToolbar';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import { cartLineKey } from '../../store/cartStore';
import type { Customer, Order, Product } from '../../types';
import { formatCurrency, formatDateTime, getErrorMessage } from '../../utils/format';
import { exportToCsv } from '../../utils/csv';
import {
  buildOrderStatusMessage,
  buildWhatsAppUrl,
  openWhatsApp,
} from '../../utils/whatsapp';

type NotifyStatus = 'ACCEPTED' | 'COMPLETED' | 'RECEIVED' | 'REJECTED' | 'CANCELLED' | 'UPDATED';

interface EditLine {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  selectedOption?: string;
  lineKey: string;
}

const nextActions: Record<string, { label: string; status: string; tone: string }[]> = {
  PENDING: [
    { label: 'Accept', status: 'ACCEPTED', tone: 'text-emerald-600 hover:bg-emerald-50' },
    { label: 'Cancel', status: 'CANCELLED', tone: 'text-rose-600 hover:bg-rose-50' },
  ],
  ACCEPTED: [
    { label: 'Complete', status: 'COMPLETED', tone: 'text-brand-600 hover:bg-brand-50' },
    { label: 'Cancel', status: 'CANCELLED', tone: 'text-rose-600 hover:bg-rose-50' },
  ],
  COMPLETED: [
    { label: 'Mark received', status: 'RECEIVED', tone: 'text-violet-600 hover:bg-violet-50' },
  ],
};

const STATUS_TABS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'RECEIVED', 'CANCELLED', 'REJECTED'];
const EDITABLE = new Set(['PENDING', 'ACCEPTED']);

export default function OrdersPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { canExport } = useEntitlements();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [customerMap, setCustomerMap] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [addProductId, setAddProductId] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [savingItems, setSavingItems] = useState(false);

  const businessName = activeBusiness?.businessName?.trim() || 'your store';

  const load = () => {
    if (!activeBusiness) return;
    setLoading(true);
    Promise.all([
      getOrders(activeBusiness.id),
      getProducts(activeBusiness.id),
      getCustomers(activeBusiness.id),
    ])
      .then(([o, prods, customers]) => {
        setOrders(o);
        setProducts(prods.filter((p) => p.available));
        setProductMap(Object.fromEntries(prods.map((p) => [p.id, p])));
        setCustomerMap(Object.fromEntries(customers.map((c) => [c.id, c])));
      })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeBusiness]);

  const notifyCustomer = (
    order: Order,
    status: NotifyStatus,
    extras?: { totalAmount?: number; itemsSummary?: string },
  ) => {
    const customer = customerMap[order.customerId];
    if (!customer?.mobile) {
      toast.info('Customer mobile not found — updated without WhatsApp');
      return;
    }
    const wa = buildWhatsAppUrl(customer.mobile);
    if (!wa) {
      toast.info('Invalid customer mobile — updated without WhatsApp');
      return;
    }
    const text = buildOrderStatusMessage({
      status,
      orderNumber: order.orderNumber,
      businessName,
      customerName: customer.name,
      totalAmount: extras?.totalAmount ?? Number(order.totalAmount),
      itemsSummary: extras?.itemsSummary,
    });
    openWhatsApp(wa, text);
    toast.success(`WhatsApp opened for ${customer.mobile}`);
  };

  const changeStatus = async (order: Order, status: string) => {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Order ${status.toLowerCase()}`);
      setViewOrder(null);
      load();

      if (
        status === 'ACCEPTED' ||
        status === 'COMPLETED' ||
        status === 'RECEIVED' ||
        status === 'REJECTED' ||
        status === 'CANCELLED'
      ) {
        notifyCustomer(order, status as NotifyStatus);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const openEdit = (order: Order) => {
    const lines: EditLine[] = (order.items ?? []).map((item) => {
      const product = productMap[item.productId];
      const selectedOption = item.selectedOption?.trim() || undefined;
      return {
        productId: item.productId,
        quantity: item.quantity,
        name: product?.name ?? 'Item',
        price: Number(item.price ?? product?.price ?? 0),
        selectedOption,
        lineKey: cartLineKey(item.productId, selectedOption),
      };
    });
    setEditLines(lines);
    setAddProductId('');
    setEditOrder(order);
  };

  const editTotal = editLines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const setLineQty = (lineKey: string, quantity: number) => {
    setEditLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.lineKey !== lineKey);
      return prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity } : l));
    });
  };

  const addProductToEdit = () => {
    if (!addProductId) return;
    const product = productMap[addProductId] ?? products.find((p) => p.id === addProductId);
    if (!product) return;
    const lineKey = cartLineKey(product.id);
    setEditLines((prev) => {
      const existing = prev.find((l) => l.lineKey === lineKey);
      if (existing) {
        return prev.map((l) =>
          l.lineKey === lineKey ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          quantity: 1,
          name: product.name,
          price: Number(product.price),
          lineKey,
        },
      ];
    });
    setAddProductId('');
  };

  const saveEditedItems = async () => {
    if (!editOrder) return;
    if (!editLines.length) {
      toast.error('Add at least one item, or cancel the order');
      return;
    }
    setSavingItems(true);
    try {
      const updated = await updateOrderItems(
        editOrder.id,
        editLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          selectedOption: l.selectedOption,
        })),
      );
      toast.success('Order items updated');
      const summary = editLines
        .map((l) => {
          const opt = l.selectedOption ? ` (${l.selectedOption})` : '';
          return `• ${l.name}${opt} × ${l.quantity} = ${formatCurrency(l.price * l.quantity)}`;
        })
        .join('\n');
      notifyCustomer(
        { ...editOrder, totalAmount: updated.totalAmount },
        'UPDATED',
        { totalAmount: Number(updated.totalAmount), itemsSummary: summary },
      );
      setEditOrder(null);
      setViewOrder(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update items'));
    } finally {
      setSavingItems(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    for (const o of orders) {
      const s = o.status?.toUpperCase() ?? '';
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [orders]);

  const filtered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? orders
        : orders.filter((o) => o.status?.toUpperCase() === statusFilter),
    [orders, statusFilter],
  );

  const availableToAdd = products.filter(
    (p) => !editLines.some((l) => l.productId === p.id && !l.selectedOption),
  );

  if (!loaded) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Store}
        title="No business profile yet"
        description="Create your business profile to start receiving orders."
      />
    );
  }

  const columns: Column<Order>[] = [
    {
      header: 'Order #',
      render: (o) => (
        <span className="font-medium text-slate-900 dark:text-white">{o.orderNumber}</span>
      ),
    },
    {
      header: 'Customer',
      render: (o) => {
        const c = customerMap[o.customerId];
        return c ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{c.name}</p>
            <p className="text-xs text-slate-400">{c.mobile}</p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        );
      },
    },
    { header: 'Items', render: (o) => `${o.items?.length ?? 0} item(s)` },
    { header: 'Amount', render: (o) => formatCurrency(o.totalAmount) },
    {
      header: 'Payment',
      render: (o) => (
        <Badge tone={statusTone(o.paymentStatus ?? 'UNPAID')}>
          {o.paymentStatus ?? 'UNPAID'}
        </Badge>
      ),
    },
    { header: 'Status', render: (o) => <Badge tone={statusTone(o.status)}>{o.status}</Badge> },
    { header: 'Date', render: (o) => formatDateTime(o.createdAt) },
    {
      header: 'Actions',
      className: 'text-right',
      render: (o) => {
        const actions = nextActions[o.status?.toUpperCase()] ?? [];
        const busy = updatingId === o.id;
        const canEdit = EDITABLE.has(o.status?.toUpperCase() ?? '');
        const unpaid = (o.paymentStatus ?? 'UNPAID').toUpperCase() !== 'PAID';
        return (
          <div className="flex items-center justify-end gap-1">
            <IconButton icon={Eye} label="View" onClick={() => setViewOrder(o)} />
            {canEdit && (
              <IconButton icon={Pencil} label="Edit items" tone="indigo" onClick={() => openEdit(o)} />
            )}
            {actions.map((a) => {
              const blockAccept = a.status === 'ACCEPTED' && unpaid;
              return (
                <button
                  key={a.status}
                  type="button"
                  disabled={busy || blockAccept}
                  title={blockAccept ? 'Waiting for customer payment' : undefined}
                  onClick={() => changeStatus(o, a.status)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${a.tone}`}
                >
                  {blockAccept ? 'Awaiting pay' : a.label}
                </button>
              );
            })}
          </div>
        );
      },
    },
  ];

  const viewActions = viewOrder ? nextActions[viewOrder.status?.toUpperCase()] ?? [] : [];
  const viewCustomer = viewOrder ? customerMap[viewOrder.customerId] : undefined;
  const viewEditable = viewOrder ? EDITABLE.has(viewOrder.status?.toUpperCase() ?? '') : false;

  return (
    <div className="space-y-4">
      <PagePlanScope page="orders" />
      <PageToolbar
        leading={
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                <span
                  className={`ml-1.5 text-xs ${statusFilter === s ? 'text-brand-100' : 'text-slate-400'}`}
                >
                  {counts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>
        }
        actions={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              if (!canExport) {
                toast.info('Upgrade your plan to export orders');
                return;
              }
              exportToCsv(
                'orders-export',
                [
                  { key: 'orderNumber', header: 'Order #' },
                  { key: 'customer', header: 'Customer' },
                  { key: 'mobile', header: 'Mobile' },
                  { key: 'status', header: 'Status' },
                  { key: 'payment', header: 'Payment' },
                  { key: 'total', header: 'Total' },
                  { key: 'date', header: 'Date' },
                ],
                filtered.map((o) => ({
                  orderNumber: o.orderNumber,
                  customer: customerMap[o.customerId]?.name ?? '',
                  mobile: customerMap[o.customerId]?.mobile ?? '',
                  status: o.status,
                  payment: o.paymentStatus ?? 'UNPAID',
                  total: o.totalAmount,
                  date: formatDateTime(o.createdAt),
                })),
              );
            }}
            disabled={!filtered.length && canExport}
          >
            {canExport ? 'Export CSV' : 'Export · Upgrade'}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(o) => o.id}
        pageSize={10}
        emptyTitle="No orders"
        emptyDescription="Paid customer orders appear here as PENDING until you accept them."
      />

      {/* View modal */}
      <Modal
        open={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title="Order details"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setViewOrder(null)}>
              Close
            </Button>
            {viewEditable && viewOrder && (
              <Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(viewOrder)}>
                Edit items
              </Button>
            )}
            {viewCustomer?.mobile &&
              viewOrder &&
              ['ACCEPTED', 'COMPLETED', 'RECEIVED', 'REJECTED', 'CANCELLED'].includes(
                viewOrder.status?.toUpperCase() ?? '',
              ) && (
                <Button
                  variant="outline"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                  onClick={() =>
                    notifyCustomer(
                      viewOrder,
                      viewOrder.status.toUpperCase() as NotifyStatus,
                    )
                  }
                >
                  Resend WhatsApp
                </Button>
              )}
            {viewActions.map((a) => {
              const unpaid =
                (viewOrder?.paymentStatus ?? 'UNPAID').toUpperCase() !== 'PAID';
              const blockAccept = a.status === 'ACCEPTED' && unpaid;
              return (
                <Button
                  key={a.status}
                  disabled={updatingId === viewOrder?.id || blockAccept}
                  title={blockAccept ? 'Customer has not paid yet' : undefined}
                  onClick={() => changeStatus(viewOrder!, a.status)}
                >
                  {a.label}
                </Button>
              );
            })}
          </>
        }
      >
        {viewOrder && (
          <div className="space-y-4">
            {(viewOrder.paymentStatus ?? 'UNPAID').toUpperCase() !== 'PAID' &&
              viewOrder.status?.toUpperCase() === 'PENDING' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  Waiting for payment — Accept unlocks after the customer pays.
                </div>
              )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Order number</p>
                <p className="font-semibold text-slate-900 dark:text-white">{viewOrder.orderNumber}</p>
              </div>
              <div className="flex gap-2">
                <Badge tone={statusTone(viewOrder.paymentStatus ?? 'UNPAID')}>
                  {viewOrder.paymentStatus ?? 'UNPAID'}
                </Badge>
                <Badge tone={statusTone(viewOrder.status)}>{viewOrder.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-500">{formatDateTime(viewOrder.createdAt)}</p>

            {viewCustomer && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{viewCustomer.name}</p>
                <p className="text-sm text-slate-500">{viewCustomer.mobile}</p>
              </div>
            )}

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {(viewOrder.items ?? []).map((item, i) => {
                const product = item.productId ? productMap[item.productId] : undefined;
                const price = item.price ?? product?.price ?? 0;
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {product?.name ?? 'Item'}
                        {item.selectedOption ? (
                          <span className="ml-1.5 text-xs font-semibold text-brand-600">
                            · {item.selectedOption}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(Number(price) * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <span className="font-medium text-slate-600 dark:text-slate-300">Total</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(viewOrder.totalAmount)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit items modal */}
      <Modal
        open={!!editOrder}
        onClose={() => setEditOrder(null)}
        title={`Edit items · ${editOrder?.orderNumber ?? ''}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOrder(null)}>
              Close
            </Button>
            {editOrder && (
              <Button
                variant="danger"
                onClick={() => {
                  setEditOrder(null);
                  changeStatus(editOrder, 'CANCELLED');
                }}
              >
                Cancel order
              </Button>
            )}
            <Button onClick={saveEditedItems} loading={savingItems} disabled={!editLines.length}>
              Save changes · {formatCurrency(editTotal)}
            </Button>
          </>
        }
      >
        {editOrder && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Change quantities, remove items, or add more products. Customer will get a status update.
            </p>

            <ul className="space-y-2">
              {editLines.map((line) => (
                <li
                  key={line.lineKey}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-nowrap"
                >
                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {line.name}
                      {line.selectedOption ? (
                        <span className="ml-1.5 text-xs font-semibold text-brand-600">
                          · {line.selectedOption}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-400">{formatCurrency(line.price)} each</p>
                  </div>
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setLineQty(line.lineKey, line.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLineQty(line.lineKey, line.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="w-16 text-right text-sm font-bold tabular-nums text-brand-600">
                    {formatCurrency(line.price * line.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setLineQty(line.lineKey, 0)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {!editLines.length && (
                <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  No items — add products below or cancel the order
                </li>
              )}
            </ul>

            <div className="flex gap-2">
              <select
                value={addProductId}
                onChange={(e) => setAddProductId(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Add a product…</option>
                {availableToAdd.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatCurrency(p.price)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={addProductToEdit}
                disabled={!addProductId}
              >
                Add
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
              <span className="font-medium text-brand-800 dark:text-brand-200">New total</span>
              <span className="text-lg font-bold text-brand-700 dark:text-brand-300">
                {formatCurrency(editTotal)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
