import { useEffect, useState } from 'react';
import { getAdminBusinesses } from '../../api/adminApi';
import type { AdminBusinessRow } from '../../types';

interface BusinessFilterProps {
  value: string;
  onChange: (businessId: string) => void;
  className?: string;
}

export function BusinessFilter({ value, onChange, className = '' }: BusinessFilterProps) {
  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);

  useEffect(() => {
    getAdminBusinesses().then(setBusinesses).catch(() => {});
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${className}`}
    >
      <option value="">All businesses</option>
      {businesses.map((b) => (
        <option key={b.businessId} value={b.businessId}>
          {b.businessName}
        </option>
      ))}
    </select>
  );
}
