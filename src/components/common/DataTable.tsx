import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { TableSkeleton } from './Skeleton';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyIcon?: LucideIcon;
  rowKey: (row: T) => string;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  emptyIcon = Inbox,
  rowKey,
  pageSize,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);

  const totalPages = pageSize ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [data.length, totalPages, page]);

  const pageData = useMemo(() => {
    if (!pageSize) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  if (loading) return <TableSkeleton rows={pageSize ?? 5} cols={columns.length} />;

  if (!data.length) {
    return (
      <div className="premium-table overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50/90 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex gap-8">
            {columns.map((col) => (
              <span
                key={col.header}
                className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {col.header}
              </span>
            ))}
          </div>
        </div>
        <EmptyState
          variant="table"
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="premium-table overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-slate-50/50 dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900/40">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={`whitespace-nowrap px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
            {pageData.map((row) => (
              <tr
                key={rowKey(row)}
                className="transition-colors hover:bg-brand-50/30 dark:hover:bg-brand-500/5"
              >
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`px-5 py-4 text-slate-700 dark:text-slate-300 ${col.className ?? ''}`}
                  >
                    {col.render ? col.render(row) : String(row[col.accessor as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageSize && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
