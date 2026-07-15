import type { ReactNode } from 'react';
import { SearchBar } from '../common/SearchBar';

interface PageToolbarSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface PageToolbarProps {
  search?: PageToolbarSearch;
  leading?: ReactNode;
  actions?: ReactNode;
  primaryAction?: ReactNode;
  className?: string;
}

/** Consistent premium top bar: glass panel, search left, CTA right. */
export function PageToolbar({
  search,
  leading,
  actions,
  primaryAction,
  className = '',
}: PageToolbarProps) {
  return (
    <div className={`premium-panel ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {search ? (
            <SearchBar
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              className="w-full sm:max-w-sm"
            />
          ) : null}
          {leading ? <div className="min-w-0 flex-1">{leading}</div> : null}
        </div>
        {actions || primaryAction ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5">
            {actions}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}
