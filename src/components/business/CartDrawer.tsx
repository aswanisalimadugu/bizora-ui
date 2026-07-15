import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ImageIcon,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createCustomer,
  createOrder,
  createOrderPayment,
  verifyOrderPayment,
} from '../../api/orderApi';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency, getErrorMessage, imageUrl } from '../../utils/format';
import { normalizeMobile } from '../../utils/whatsapp';
import { loadRazorpay, openRazorpayCheckout } from '../../utils/razorpay';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}

export function CartDrawer({ open, onClose, businessId, businessName }: CartDrawerProps) {
  const { items, updateQty, removeItem, total, count, clear, startFreshOrder } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [pendingPay, setPendingPay] = useState<{
    orderId: string;
    orderNumber: string;
    mobile: string;
  } | null>(null);
  const [placed, setPlaced] = useState<{
    orderNumber: string;
    trackUrl: string;
  } | null>(null);

  const itemCount = count();
  const orderTotal = total();
  const uniqueCount = items.length;
  const cartLocked = !!pendingPay || submitting;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const resetCustomerForm = () => {
    setCustomerName('');
    setCustomerMobile('');
    setNameError('');
    setMobileError('');
  };

  /** Shared device / next customer: never leave previous identity or unpaid session. */
  const handleClose = () => {
    if (submitting) return;
    if (placed) {
      setPlaced(null);
      resetCustomerForm();
      setPendingPay(null);
    } else if (pendingPay) {
      // Abandon unpaid session so the next person doesn't see this order.
      setPendingPay(null);
      resetCustomerForm();
      setSubmitting(false);
    } else {
      // Keep menu items for same shopper; clear personal details for privacy.
      resetCustomerForm();
    }
    onClose();
  };

  const beginNewOrder = () => {
    startFreshOrder();
    resetCustomerForm();
    setPendingPay(null);
    setPlaced(null);
    setSubmitting(false);
    onClose();
  };

  const validate = () => {
    let ok = true;
    const name = customerName.trim();
    const mobile = normalizeMobile(customerMobile);

    if (name.length < 2) {
      setNameError('Enter your name');
      ok = false;
    } else {
      setNameError('');
    }

    if (mobile.length !== 10) {
      setMobileError('Enter a valid 10-digit mobile');
      ok = false;
    } else {
      setMobileError('');
    }

    return ok ? { name, mobile } : null;
  };

  const finishPlaced = (orderNumber: string) => {
    const trackUrl = `${window.location.origin}/track/${encodeURIComponent(orderNumber)}`;
    clear();
    resetCustomerForm();
    setPendingPay(null);
    setPlaced({ orderNumber, trackUrl });
    setSubmitting(false);
    toast.success(`Order ${orderNumber} placed & paid`);
  };

  const startRazorpayCheckout = async (
    order: { id: string; orderNumber: string; totalAmount?: number },
    payment: Awaited<ReturnType<typeof createOrderPayment>>,
    customer: { name: string; mobile: string },
  ) => {
    const rzpOrderId = payment.razorpayOrderId ?? '';
    const isMock = !payment.keyId || rzpOrderId.startsWith('order_mock_');

    if (isMock) {
      await verifyOrderPayment({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: `pay_mock_${order.id}`,
        razorpaySignature: '',
      });
      finishPlaced(order.orderNumber);
      return;
    }

    const ok = await loadRazorpay();
    if (!ok) {
      toast.error('Could not load payment gateway — tap Pay again to retry');
      setSubmitting(false);
      return;
    }

    openRazorpayCheckout({
      keyId: payment.keyId!,
      orderId: rzpOrderId,
      amount: Number(payment.amount ?? order.totalAmount ?? orderTotal),
      businessName,
      description: `Order ${order.orderNumber}`,
      customerName: customer.name,
      customerContact: customer.mobile,
      onSuccess: async (res) => {
        try {
          await verifyOrderPayment({
            razorpayOrderId: res.razorpay_order_id,
            razorpayPaymentId: res.razorpay_payment_id,
            razorpaySignature: res.razorpay_signature,
          });
          finishPlaced(order.orderNumber);
        } catch (err) {
          toast.error(
            getErrorMessage(err, 'Payment received but confirmation failed — tap Pay to retry'),
          );
          setSubmitting(false);
        }
      },
      onDismiss: () => {
        setSubmitting(false);
        toast.info('Payment incomplete — tap Complete payment to finish');
      },
    });
  };

  const placeOrderAndPay = async () => {
    if (submitting) return;

    if (!items.length && !pendingPay) {
      toast.error('Cart is empty');
      return;
    }

    const customer = validate();
    if (!customer) return;

    // If resuming, mobile must match the pending order's customer.
    if (pendingPay && pendingPay.mobile !== customer.mobile) {
      toast.error('This pending payment belongs to another mobile. Start a new order.');
      return;
    }

    setSubmitting(true);
    try {
      if (pendingPay) {
        const payment = await createOrderPayment(pendingPay.orderId);
        await startRazorpayCheckout(
          { id: pendingPay.orderId, orderNumber: pendingPay.orderNumber },
          payment,
          customer,
        );
        return;
      }

      const createdCustomer = await createCustomer({
        businessId,
        name: customer.name,
        mobile: customer.mobile,
      });

      const order = await createOrder({
        businessId,
        customerId: createdCustomer.id,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          selectedOption: i.selectedOption,
        })),
      });

      setPendingPay({
        orderId: order.id,
        orderNumber: order.orderNumber,
        mobile: customer.mobile,
      });

      const payment = await createOrderPayment(order.id);
      await startRazorpayCheckout(order, payment, customer);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not place order'));
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/40"
            onClick={handleClose}
          />
          <motion.aside
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl shadow-slate-950/20 dark:bg-slate-950"
          >
            <div className="relative isolate overflow-hidden border-b border-slate-100 dark:border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.28),transparent_42%)]" />
              <div className="absolute -bottom-8 left-1/2 h-24 w-[120%] -translate-x-1/2 rounded-[100%] bg-white dark:bg-slate-950" />

              <div className="relative px-5 pb-8 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      Your order
                    </p>
                    <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-white">
                      {businessName}
                    </h2>
                    <p className="mt-1 text-sm text-white/80">
                      {placed
                        ? 'Payment successful'
                        : itemCount === 0
                          ? 'Cart is empty'
                          : `${uniqueCount} ${uniqueCount === 1 ? 'item' : 'items'} · ${itemCount} qty`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-2xl border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20"
                    aria-label="Close cart"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1">
              {placed ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                    Payment successful
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-brand-600">
                    {placed.orderNumber}
                  </p>
                  <p className="mt-2 max-w-[260px] text-sm text-slate-500">
                    Your order is <strong>PENDING</strong>. Track it below — next customer can tap
                    New order for a fresh cart.
                  </p>
                  <a
                    href={placed.trackUrl}
                    className="mt-5 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white"
                  >
                    Track order <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={beginNewOrder}
                    className="mt-3 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <RotateCcw className="h-4 w-4" /> New order
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-50 to-accent-50 ring-1 ring-brand-100 dark:from-brand-500/10 dark:to-accent-500/10 dark:ring-brand-500/20">
                    <ShoppingBag className="h-9 w-9 text-brand-500" />
                  </div>
                  <p className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    Nothing here yet
                  </p>
                  <p className="mt-1.5 max-w-[220px] text-sm leading-relaxed text-slate-500">
                    Browse the menu and add items — then pay securely to place your order.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Continue browsing <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item, index) => (
                      <motion.li
                        key={item.lineKey}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ delay: index * 0.04, duration: 0.28 }}
                        className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-3.5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80"
                      >
                        <div className="flex gap-3.5">
                          <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
                            {item.imageUrl ? (
                              <img
                                src={imageUrl(item.imageUrl)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <ImageIcon className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
                                  {item.name}
                                </p>
                                {item.selectedOption && (
                                  <span className="mt-1 inline-flex rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                                    {item.selectedOption}
                                  </span>
                                )}
                                {item.description && (
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.lineKey)}
                                disabled={cartLocked}
                                className="shrink-0 rounded-xl p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40 dark:hover:bg-rose-500/10"
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <p className="mt-1.5 text-xs text-slate-400">
                              {formatCurrency(item.price)} each
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.lineKey, item.quantity - 1)}
                                  disabled={cartLocked}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.lineKey, item.quantity + 1)}
                                  disabled={cartLocked}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-base font-extrabold tabular-nums text-brand-600 dark:text-brand-400">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>

                  {!cartLocked && (
                    <button
                      type="button"
                      onClick={() => {
                        clear();
                        resetCustomerForm();
                        setPendingPay(null);
                      }}
                      className="flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 transition hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear cart
                    </button>
                  )}
                </ul>
              )}
            </div>

            {(items.length > 0 || pendingPay) && !placed && (
              <div className="relative border-t border-slate-100 bg-white/95 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-5 dark:border-slate-800 dark:bg-slate-950/95">
                {pendingPay && (
                  <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                    Payment pending for{' '}
                    <span className="font-mono font-semibold">{pendingPay.orderNumber}</span>. Use the
                    same mobile to complete — or close &amp; start fresh for another customer.
                  </div>
                )}
                <div className="mb-3 space-y-2.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Your name
                    </label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name"
                      autoComplete="name"
                      disabled={cartLocked}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    {nameError && <p className="mt-1 text-xs text-rose-500">{nameError}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Mobile number
                    </label>
                    <input
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder="10-digit mobile"
                      inputMode="numeric"
                      autoComplete="tel"
                      disabled={cartLocked}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    {mobileError ? (
                      <p className="mt-1 text-xs text-rose-500">{mobileError}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">
                        Only this number gets order updates — not shared with other customers
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4 space-y-2 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Items</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {itemCount} qty · {uniqueCount} line{uniqueCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="my-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total
                      </p>
                      <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {formatCurrency(orderTotal)}
                      </p>
                    </div>
                    <p className="inline-flex max-w-[140px] items-center justify-end gap-1 text-right text-[11px] leading-snug text-slate-400">
                      <Lock className="h-3 w-3 shrink-0" /> Secure online payment
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={placeOrderAndPay}
                  disabled={submitting || (!items.length && !pendingPay)}
                  className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-brand-600 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none sm:py-4"
                >
                  <CreditCard className="relative h-5 w-5" />
                  <span className="relative">
                    {submitting
                      ? 'Processing…'
                      : pendingPay
                        ? `Complete payment · ${formatCurrency(orderTotal)}`
                        : `Pay ${formatCurrency(orderTotal)}`}
                  </span>
                  {!submitting && (
                    <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-0.5" />
                  )}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
