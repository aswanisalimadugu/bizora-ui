import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Check, Crown, Store } from 'lucide-react';
import {
  createPayment,
  createSubscription,
  getActiveSubscription,
  getPlans,
  verifyPayment,
} from '../../api/paymentApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Badge, statusTone } from '../../components/common/Badge';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { useSubscriptionEntitlementsStore } from '../../store/subscriptionEntitlementsStore';
import type { SubscriptionPlan, TenantSubscription } from '../../types';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/format';
import { loadRazorpay, openRazorpayCheckout } from '../../utils/razorpay';
import { UpiPayModal } from '../../components/business/UpiPayModal';
import { PAID_FROM_PRICE } from '../../constants/planFeatures';

const UPI_ID = import.meta.env.VITE_UPI_ID ?? '';
const UPI_NAME = import.meta.env.VITE_UPI_NAME ?? 'Bizora App';

export default function SubscriptionPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { user } = useAuthStore();
  const refreshEntitlements = useSubscriptionEntitlementsStore((s) => s.refresh);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [active, setActive] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [upiPay, setUpiPay] = useState<{
    plan: SubscriptionPlan;
    orderId: string;
    subId: string;
  } | null>(null);
  const [confirmingUpi, setConfirmingUpi] = useState(false);

  const load = () => {
    if (!activeBusiness) return;
    setLoading(true);
    Promise.all([
      getPlans(),
      getActiveSubscription(activeBusiness.id).catch(() => null),
    ])
      .then(([p, a]) => {
        setPlans(p);
        setActive(a);
        refreshEntitlements(activeBusiness.id).catch(() => undefined);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeBusiness]);

  const subscribe = async (plan: SubscriptionPlan) => {
    if (!activeBusiness || !plan.id) return;
    setSubscribing(plan.id);
    try {
      const sub = await createSubscription(activeBusiness.id, plan.id);
      const order = await createPayment(activeBusiness.id, sub.id);

      const orderId = order.razorpayOrderId ?? '';
      const isMock = !order.keyId || orderId.startsWith('order_mock_');

      if (isMock) {
        if (UPI_ID) {
          setUpiPay({ plan, orderId, subId: sub.id });
          return;
        }
        await verifyPayment({
          razorpayOrderId: orderId,
          razorpayPaymentId: `pay_mock_${sub.id}`,
          razorpaySignature: '',
        });
        toast.success(`${plan.name} activated`);
        load();
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) {
        toast.error('Could not load payment gateway');
        return;
      }
      openRazorpayCheckout({
        keyId: order.keyId!,
        orderId,
        amount: order.amount ?? plan.price,
        businessName: activeBusiness.businessName,
        description: `${plan.name} subscription`,
        customerName: user?.name,
        customerEmail: user?.email,
        customerContact: user?.mobile,
        onSuccess: async (res) => {
          try {
            await verifyPayment({
              razorpayOrderId: res.razorpay_order_id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            });
            toast.success(`${plan.name} activated - your shop is live`);
            load();
          } catch (err) {
            toast.error(getErrorMessage(err, 'Payment verification failed'));
          } finally {
            setSubscribing(null);
          }
        },
        onDismiss: () => setSubscribing(null),
      });
      return;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not subscribe'));
    } finally {
      setSubscribing((cur) => (cur === plan.id ? null : cur));
    }
  };

  const confirmUpiPaid = async () => {
    if (!upiPay) return;
    setConfirmingUpi(true);
    try {
      await verifyPayment({
        razorpayOrderId: upiPay.orderId,
        razorpayPaymentId: `pay_upi_${upiPay.subId}`,
        razorpaySignature: '',
      });
      toast.success(`${upiPay.plan.name} activated - your shop is live`);
      setUpiPay(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not activate subscription'));
    } finally {
      setConfirmingUpi(false);
    }
  };

  if (!loaded) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Store}
        title="No business profile yet"
        description="Create your business profile to manage subscriptions."
      />
    );
  }

  if (loading) return <Loader />;

  const hasActivePlan = active?.status?.toUpperCase() === 'ACTIVE';
  const activePlan = hasActivePlan ? plans.find((p) => p.id === active?.planId) : null;
  const daysLeft =
    hasActivePlan && active?.endDate
      ? Math.ceil((new Date(active.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
  const nearExpiry = daysLeft != null && daysLeft <= 7;

  return (
    <div className="space-y-6">
      <PagePlanScope page="subscription" freeLimitOverride="5 products * 3 categories" />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Current subscription</h3>
              {hasActivePlan ? (
                <>
                  <p className="text-sm font-medium text-brand-600">
                    {activePlan?.name ?? 'Active plan'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Valid until {formatDate(active!.endDate)}
                    {daysLeft != null ? ` Ã‚Â· ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Free plan - 5 products / 3 categories. Paid plans from {formatCurrency(PAID_FROM_PRICE)}.
                </p>
              )}
            </div>
          </div>
          <Badge tone={hasActivePlan ? statusTone(active!.status) : 'green'}>
            {hasActivePlan ? active!.status : 'Free'}
          </Badge>
        </div>
      </Card>

      {hasActivePlan && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">You&apos;re all set!</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your <strong>{activePlan?.name}</strong> plan is active. Public menu and online
                payments are live until {formatDate(active!.endDate)}.
              </p>
              {nearExpiry && (
                <p className="mt-2 text-sm font-medium text-amber-700">
                  Expiring soon - renew below so your shop stays online.
                </p>
              )}
              {activePlan?.features && (
                <ul className="mt-4 space-y-1.5">
                  {activePlan.features
                    .split(',')
                    .filter(Boolean)
                    .map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-emerald-500" /> {f.trim()}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <div>
        <h3 className="mb-1 text-base font-semibold text-slate-900">
          {hasActivePlan ? 'Renew or change plan' : 'Choose a plan'}
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          {hasActivePlan
            ? 'Paying a new plan activates immediately and replaces your current plan.'
            : `Free stays limited. Paid plans from ${formatCurrency(PAID_FROM_PRICE)} unlock AI, exports, print QR & higher catalog limits.`}
        </p>
        {!hasActivePlan ? (
          <div className="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Free * Rs0</p>
            <p className="mt-1 text-xs text-slate-500">
              5 products * 3 categories * 7-day income * no CSV / AI / QR print
            </p>
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = hasActivePlan && plan.id === active?.planId;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${
                  isCurrent ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
                  {isCurrent && (
                    <Badge tone="green">Current</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="mb-1 text-sm text-slate-400">/{plan.durationDays}d</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {plan.features
                    ?.split(',')
                    .filter(Boolean)
                    .map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-emerald-500" /> {f.trim()}
                      </li>
                    ))}
                </ul>
                <Button
                  className="mt-6"
                  fullWidth
                  loading={subscribing === plan.id}
                  onClick={() => subscribe(plan)}
                >
                  {hasActivePlan ? (isCurrent ? 'Renew' : 'Switch plan') : 'Subscribe'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {upiPay && (
        <UpiPayModal
          open={!!upiPay}
          onClose={() => setUpiPay(null)}
          amount={upiPay.plan.price}
          planName={upiPay.plan.name}
          payeeName={UPI_NAME}
          upiId={UPI_ID}
          onPaid={confirmUpiPaid}
          confirming={confirmingUpi}
        />
      )}
    </div>
  );
}
