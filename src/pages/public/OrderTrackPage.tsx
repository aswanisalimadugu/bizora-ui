import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Search,
  Store,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cancelPublicOrder, trackOrder } from '../../api/orderApi';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { usePageMeta } from '../../hooks/usePageMeta';
import type { OrderTrack } from '../../types';
import { formatCurrency, formatDateTime, getErrorMessage } from '../../utils/format';
import { normalizeMobile } from '../../utils/whatsapp';

const STEPS = [
  { key: 'PENDING', label: 'Order received', desc: 'Waiting for confirmation' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Being prepared' },
  { key: 'COMPLETED', label: 'Ready', desc: 'Ready to collect' },
  { key: 'RECEIVED', label: 'Collected', desc: 'Taken by customer' },
];

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  COMPLETED: 2,
  RECEIVED: 3,
  REJECTED: -1,
  CANCELLED: -1,
};

export default function OrderTrackPage() {
  const { orderNumber: paramNumber = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(paramNumber || searchParams.get('id') || '');
  const [order, setOrder] = useState<OrderTrack | null>(null);
  const [loading, setLoading] = useState(!!paramNumber);
  const [error, setError] = useState('');
  const [cancelMobile, setCancelMobile] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  usePageMeta(
    order ? `Track ${order.orderNumber}` : 'Track order',
    order ? `Track your order at ${order.businessName}` : 'Track your Bizora App order status',
  );

  const fetchOrder = useCallback(async (num: string, silent = false) => {
    if (!num.trim()) {
      if (!silent) setError('Enter your order number');
      return;
    }
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await trackOrder(num.trim());
      setOrder(data);
      if (!silent) setError('');
    } catch (e) {
      if (!silent) {
        setOrder(null);
        setError(getErrorMessage(e, 'Order not found'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paramNumber) fetchOrder(paramNumber);
  }, [paramNumber, fetchOrder]);

  // Auto-refresh while order is in progress
  useEffect(() => {
    if (!order) return;
    const status = order.status.toUpperCase();
    if (status !== 'PENDING' && status !== 'ACCEPTED' && status !== 'COMPLETED') return;
    const timer = setInterval(() => fetchOrder(order.orderNumber, true), 12000);
    return () => clearInterval(timer);
  }, [order, fetchOrder]);

  const handleCancel = async () => {
    if (!order) return;
    const mobile = normalizeMobile(cancelMobile);
    if (mobile.length !== 10) {
      toast.error('Enter the 10-digit mobile used for this order');
      return;
    }
    setCancelling(true);
    try {
      const updated = await cancelPublicOrder(order.orderNumber, mobile);
      setOrder(updated);
      setShowCancel(false);
      toast.success('Order cancelled');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not cancel order'));
    } finally {
      setCancelling(false);
    }
  };

  const currentStep = order ? STATUS_INDEX[order.status.toUpperCase()] ?? 0 : 0;
  const rejected =
    order?.status.toUpperCase() === 'REJECTED' || order?.status.toUpperCase() === 'CANCELLED';
  const canCancel =
    order?.status.toUpperCase() === 'PENDING' &&
    (order.paymentStatus ?? 'UNPAID').toUpperCase() !== 'PAID';

  return (
    <div className="min-h-screen bg-mesh bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-lg">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Track your order</h1>
          <p className="mt-2 text-sm text-slate-500">Enter the order number from your confirmation</p>
        </div>

        <div className="mt-8 flex gap-2">
          <Input
            placeholder="ORD-20260711..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => {
              setSearchParams({});
              fetchOrder(query);
            }}
            leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            disabled={loading}
          >
            Track
          </Button>
        </div>

        {error && !loading && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-sm text-rose-600">
            {error}
          </motion.p>
        )}

        {loading && (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        )}

        {order && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="auth-gradient px-6 py-5 text-white">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-100">Order</p>
              <p className="mt-1 font-mono text-sm font-bold">{order.orderNumber}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-brand-100">
                  <Store className="h-4 w-4" /> {order.businessName}
                </span>
                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                  {order.status}
                </span>
                <span
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    (order.paymentStatus ?? 'UNPAID').toUpperCase() === 'PAID'
                      ? 'bg-emerald-400/25 text-emerald-50'
                      : 'bg-amber-400/25 text-amber-50'
                  }`}
                >
                  {(order.paymentStatus ?? 'UNPAID').toUpperCase() === 'PAID' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>

            <div className="p-6">
              {rejected ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <XCircle className="h-12 w-12 text-rose-500" />
                  <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                    Order {order.status.toUpperCase() === 'CANCELLED' ? 'cancelled' : 'rejected'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Contact the business for details</p>
                </div>
              ) : (
                <ol className="space-y-0">
                  {STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                        {i < STEPS.length - 1 && (
                          <span
                            className={`absolute left-[15px] top-8 h-full w-0.5 ${done && i < currentStep ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`}
                          />
                        )}
                        <span
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            done
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                              : 'border-2 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                          } ${active ? 'ring-4 ring-emerald-500/20' : ''}`}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4 text-slate-400" />}
                        </span>
                        <div className="pt-0.5">
                          <p className={`font-semibold ${done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-sm text-slate-500">{step.desc}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Items</p>
                <ul className="mt-2 space-y-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-200">
                        {item.productName}
                        {item.selectedOption ? ` (${item.selectedOption})` : ''} × {item.quantity}
                      </span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-400">Placed {formatDateTime(order.createdAt)}</p>
              </div>

              {canCancel && (
                <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-500/10">
                  {!showCancel ? (
                    <button
                      type="button"
                      onClick={() => setShowCancel(true)}
                      className="w-full text-sm font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Cancel this order
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Enter the mobile number used when placing the order.
                      </p>
                      <Input
                        placeholder="10-digit mobile"
                        value={cancelMobile}
                        onChange={(e) => setCancelMobile(e.target.value)}
                        inputMode="numeric"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" fullWidth onClick={() => setShowCancel(false)}>
                          Back
                        </Button>
                        <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancel}>
                          Confirm cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {order.businessSlug && (
                <Link
                  to={`/business/${order.businessSlug}`}
                  className="mt-6 block text-center text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Back to {order.businessName}
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {!order && !loading && !paramNumber && (
          <div className="mt-12">
            <EmptyState
              icon={Package}
              title="Look up an order"
              description="Use the order number from your payment confirmation."
            />
          </div>
        )}
      </div>
    </div>
  );
}
