import { ChevronDown, Store } from 'lucide-react';
import { useBusinessStore } from '../../store/businessStore';

export function BusinessSwitcher() {
  const { businesses, activeBusiness, setActive } = useBusinessStore();

  if (businesses.length <= 1) return null;

  return (
    <div className="relative hidden max-w-[180px] sm:block">
      <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        value={activeBusiness?.id ?? ''}
        onChange={(e) => {
          const b = businesses.find((x) => x.id === e.target.value);
          if (b) setActive(b);
        }}
        className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        aria-label="Switch business"
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.businessName}
          </option>
        ))}
      </select>
    </div>
  );
}
