import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { PlanLimits } from '../../types';

interface PlanLimitBannerProps {
  limits: PlanLimits | null;
  label: string;
  nearLimitMessage?: string;
}

export function PlanLimitBanner({ limits, label, nearLimitMessage }: PlanLimitBannerProps) {
  if (!limits || limits.unlimited) return null;

  const pct = limits.max > 0 ? (limits.current / limits.max) * 100 : 0;
  const atLimit = limits.current >= limits.max;
  const nearLimit = pct >= 80;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        nearLimit
          ? 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
          : 'border-brand-100 bg-brand-50/80 dark:border-brand-500/20 dark:bg-brand-500/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {nearLimit && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {label}: {limits.current} / {limits.max}
            </p>
            {nearLimit && (
              <Link to="/dashboard/subscription" className="text-xs font-semibold text-brand-600 hover:underline">
                Upgrade
              </Link>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${nearLimit ? 'bg-amber-500' : 'bg-brand-600'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          {atLimit && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              {nearLimitMessage ?? `You've reached your plan limit. Upgrade to add more ${label.toLowerCase()}.`}
            </p>
          )}
          {nearLimit && !atLimit && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              You're near your plan limit. Upgrade to add more {label.toLowerCase()}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
