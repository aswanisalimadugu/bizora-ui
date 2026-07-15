import { Link } from 'react-router-dom';
import { Check, Crown, Lock } from 'lucide-react';
import {
  PAID_FROM_PRICE,
  PAGE_PLAN_COPY,
  type PagePlanKey,
} from '../../constants/planFeatures';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import { formatCurrency } from '../../utils/format';

interface PagePlanScopeProps {
  page: PagePlanKey;
  /** Override free limit text, e.g. "5 / 5 products" from live usage */
  freeLimitOverride?: string;
  className?: string;
}

/**
 * Shows Free plan page limits + paid (money) features unlockable on this page.
 */
export function PagePlanScope({ page, freeLimitOverride, className = '' }: PagePlanScopeProps) {
  const { loaded, isPaid, isFree, planName, report, dataRetentionDays } = useEntitlements();
  const copy = PAGE_PLAN_COPY[page];
  if (!loaded || !copy) return null;

  const limitText = freeLimitOverride ?? copy.freeLimit;
  const paidPrice =
    report?.planPrice != null && Number(report.planPrice) > 0
      ? Number(report.planPrice)
      : PAID_FROM_PRICE;

  const showRetention =
    isFree && dataRetentionDays != null && dataRetentionDays > 0
    && (page === 'orders' || page === 'payments' || page === 'customers'
      || page === 'reports' || page === 'dashboard');

  if (isPaid) {
    return (
      <div
        className={`rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {planName} · paid features unlocked
            </p>
          </div>
          {limitText ? (
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Limit: {limitText}
            </span>
          ) : null}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {copy.paidExtras.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!isFree) return null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 ${className}`}
    >
      {showRetention ? (
        <div className="border-b border-amber-100 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          Free keeps only the last {dataRetentionDays} days of order data. Older orders and related
          order payments are deleted automatically. Upgrade to keep full history.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Free plan · this page
          </p>
          {limitText ? (
            <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              Limit: {limitText}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">Core tools included · premium locked</p>
          )}
        </div>
        <Link
          to="/dashboard/subscription"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700"
        >
          Unlock from {formatCurrency(PAID_FROM_PRICE)}
        </Link>
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:border-b-0 sm:border-r">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Included now
          </p>
          <ul className="space-y-1.5">
            {copy.freeIncludes.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50/50 px-4 py-3 dark:bg-amber-500/5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Lock className="h-3.5 w-3.5" />
            Paid · from {formatCurrency(paidPrice)}
          </p>
          <ul className="space-y-1.5">
            {copy.paidExtras.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
