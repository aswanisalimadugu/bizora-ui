import { Link } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';

interface UpgradeHintProps {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

/** Soft upgrade nudge for free-plan locked features. */
export function UpgradeHint({
  title = 'Paid plan feature',
  description = 'Upgrade to unlock this on your current subscription.',
  compact = false,
  className = '',
}: UpgradeHintProps) {
  if (compact) {
    return (
      <Link
        to="/dashboard/subscription"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30 ${className}`}
      >
        <Lock className="h-3.5 w-3.5" />
        Upgrade
      </Link>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <Link
        to="/dashboard/subscription"
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
      >
        Upgrade plan
      </Link>
    </div>
  );
}
