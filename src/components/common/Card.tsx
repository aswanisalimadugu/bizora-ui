import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-100/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 ${
        hover ? 'transition-all duration-300 hover:shadow-md hover:shadow-brand-500/5 dark:hover:shadow-brand-500/10' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  trend?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
  trend,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-500/5 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:shadow-brand-500/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          {trend && <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
