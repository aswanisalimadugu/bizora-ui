import type { ComponentType } from 'react';

type Tone = 'slate' | 'indigo' | 'rose' | 'emerald' | 'amber';

const tones: Record<Tone, string> = {
  slate: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  indigo: 'text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/15',
  rose: 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/15',
  emerald: 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/15',
  amber: 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/15',
};

interface IconButtonProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone?: Tone;
}

export function IconButton({ icon: Icon, label, onClick, tone = 'slate' }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
