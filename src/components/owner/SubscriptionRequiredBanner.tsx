import { Link, useLocation } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';

/** Soft upgrade nudge when on free trial (no paid ACTIVE plan). */
export function SubscriptionRequiredBanner() {
  const { pathname } = useLocation();
  const { activeBusiness } = useBusinessStore();
  const { loaded, isFree, planName } = useEntitlements();

  if (!activeBusiness || !loaded || !isFree || pathname.startsWith('/dashboard/subscription')) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-slate-900 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-100 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Crown className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold">You&apos;re on {planName}</p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-brand-200/90">
            Limits: 5 products / 3 categories. Paid (from ₹499): AI, CSV export, QR print &amp; full
            reports — each page shows what&apos;s included vs locked.
          </p>
        </div>
      </div>
      <Link
        to="/dashboard/subscription"
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
      >
        Upgrade
      </Link>
    </div>
  );
}
