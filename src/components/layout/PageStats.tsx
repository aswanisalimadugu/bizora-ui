import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageStatProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
}

export function PageStat({ label, value, icon: Icon, accent = 'from-brand-500 to-accent-500' }: PageStatProps) {
  return (
    <div className="premium-stat flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md shadow-brand-500/20`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

interface PageStatsProps {
  children: ReactNode;
}

export function PageStats({ children }: PageStatsProps) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
