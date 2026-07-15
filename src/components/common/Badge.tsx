type Tone = 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'indigo';

const tones: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-400',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300',
  indigo: 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/15 dark:text-brand-400',
};

export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status?: string): Tone {
  const s = (status ?? '').toUpperCase();
  if (['ACTIVE', 'COMPLETED', 'SUCCESS', 'PAID', 'VERIFIED', 'ACCEPTED', 'RECEIVED'].includes(s)) return 'green';
  if (['BLOCKED', 'REJECTED', 'FAILED', 'EXPIRED', 'CANCELLED', 'INACTIVE'].includes(s)) return 'red';
  if (['PENDING', 'PROCESSING', 'UNPAID'].includes(s)) return 'amber';
  return 'gray';
}
