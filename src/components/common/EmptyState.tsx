import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
  variant?: 'card' | 'table';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  centered = false,
  variant = 'card',
}: EmptyStateProps) {
  if (variant === 'table') {
    return (
      <div className="premium-table-empty">
        <div className="premium-table-empty-glow" aria-hidden />
        <div className="relative flex flex-col items-center px-6 py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 scale-150 rounded-full bg-brand-400/20 blur-2xl dark:bg-brand-500/15" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50 via-white to-accent-50 shadow-lg shadow-brand-500/10 dark:border-brand-500/20 dark:from-brand-500/20 dark:via-slate-900 dark:to-accent-500/10">
              <Icon className="h-9 w-9 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
          {description && (
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
          {action && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{action}</div>}
        </div>
      </div>
    );
  }

  const card = (
    <div className="premium-empty-card w-full max-w-lg px-8 py-12 text-center">
      <div className="relative mx-auto mb-6 w-fit">
        <div className="absolute inset-0 scale-125 rounded-full bg-brand-400/15 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 shadow-md dark:border-brand-500/20 dark:from-brand-500/20 dark:to-accent-500/10 dark:text-brand-400">
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );

  if (centered) {
    return (
      <div className="flex min-h-[min(520px,calc(100vh-12rem))] items-center justify-center py-8">
        {card}
      </div>
    );
  }

  return card;
}
