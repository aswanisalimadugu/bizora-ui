import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Card } from '../common/Card';
import type { Order, Product } from '../../types';
import { formatCurrency } from '../../utils/format';

interface OwnerAnalyticsProps {
  orders: Order[];
  products: Product[];
  /** Paid plans see top products + full depth. */
  fullAnalytics?: boolean;
}

export function OwnerAnalytics({ orders, products, fullAnalytics = true }: OwnerAnalyticsProps) {
  const statusCounts = ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((s) => ({
    status: s,
    count: orders.filter((o) => o.status?.toUpperCase() === s).length,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const count = orders.filter((o) => o.createdAt?.slice(0, 10) === key).length;
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), count };
  });
  const maxDay = Math.max(1, ...last7.map((d) => d.count));

  const productSales: Record<string, number> = {};
  for (const o of orders) {
    for (const item of o.items ?? []) {
      productSales[item.productId] = (productSales[item.productId] ?? 0) + item.quantity;
    }
  }
  const topProducts = Object.entries(productSales)
    .map(([id, qty]) => ({
      name: products.find((p) => p.id === id)?.name ?? 'Unknown',
      qty,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxTop = Math.max(1, ...topProducts.map((p) => p.qty));

  const colors: Record<string, string> = {
    PENDING: 'bg-amber-500',
    ACCEPTED: 'bg-brand-600',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-rose-400',
    REJECTED: 'bg-rose-500',
  };

  const paidRevenue = orders
    .filter((o) => (o.paymentStatus ?? '').toUpperCase() === 'PAID')
    .reduce((s, o) => s + Number(o.totalAmount), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Orders by status</h3>
        <div className="mt-5 space-y-3">
          {statusCounts.map((s, i) => (
            <motion.div
              key={s.status}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize text-slate-600 dark:text-slate-300">{s.status.toLowerCase()}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{s.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${colors[s.status]}`}
                  style={{ width: `${(s.count / maxStatus) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Last 7 days</h3>
        <div className="mt-5 flex h-36 items-end justify-between gap-2">
          {last7.map((d, i) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{d.count}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(12, (d.count / maxDay) * 100)}%` }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="w-full min-h-[12px] max-h-24 flex-1 rounded-t-lg bg-gradient-to-t from-brand-600 to-accent-500"
              />
              <span className="text-[10px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Top products</h3>
          {!fullAnalytics ? (
            <Link
              to="/dashboard/subscription"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
            >
              <Lock className="h-3.5 w-3.5" />
              Paid plan
            </Link>
          ) : null}
        </div>
        {!fullAnalytics ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Product ranking unlocks on paid plans.
            </p>
            <Link
              to="/dashboard/subscription"
              className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline"
            >
              Upgrade to see top sellers
            </Link>
          </div>
        ) : topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No order data yet</p>
        ) : (
          <div className="mt-4 space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/15">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${(p.qty / maxTop) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{p.qty} sold</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400">
          Revenue from paid orders:{' '}
          <strong className="text-emerald-600">{formatCurrency(paidRevenue)}</strong>
          {' · '}
          <Link className="text-brand-600 hover:underline dark:text-brand-400" to="/dashboard/reports">
            Daily reports
          </Link>
        </p>
      </Card>
    </div>
  );
}
