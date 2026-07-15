import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  Package,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';
import { getProducts } from '../../api/productApi';
import { getDashboardStats, getOrders } from '../../api/orderApi';
import { Button } from '../../components/common/Button';
import { Card, StatCard } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Badge, statusTone } from '../../components/common/Badge';
import { QRCode } from '../../components/business/QRCode';
import { OwnerAnalytics } from '../../components/owner/OwnerAnalytics';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import type { Order, Product } from '../../types';
import { businessPageUrl, formatCurrency, getErrorMessage } from '../../utils/format';

export default function OwnerDashboardPage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { canFullAnalytics, isFree, dataRetentionDays } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, orders: 0, pending: 0, revenue: 0 });
  const [subStatus, setSubStatus] = useState<string>('NONE');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!activeBusiness) {
      if (loaded) setLoading(false);
      return;
    }
    setLoading(true);
    const id = activeBusiness.id;
    Promise.all([
      getDashboardStats(id),
      getOrders(id).catch(() => [] as Order[]),
      canFullAnalytics ? getProducts(id).catch(() => [] as Product[]) : Promise.resolve([] as Product[]),
    ])
      .then(([dash, ords, prods]) => {
        // Chart only needs recent rows; full lists stay on Orders/Payments pages.
        setOrders(ords.slice(0, 120));
        setProducts(prods);
        setStats({
          products: dash.productCount,
          orders: dash.orderCount,
          pending: dash.pendingOrders,
          revenue: Number(dash.paidRevenue) || 0,
        });
        setSubStatus(dash.subscriptionStatus || 'NONE');
      })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [activeBusiness, loaded, canFullAnalytics]);

  if (!loaded) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        centered
        icon={Store}
        title="Set up your business profile"
        description="Create your business page to start adding products and receiving orders."
        action={
          <Link to="/dashboard/profile">
            <Button>Create business profile</Button>
          </Link>
        }
      />
    );
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PagePlanScope page="dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value={stats.products} icon={Package} />
        <StatCard
          label={isFree && dataRetentionDays ? `Orders (${dataRetentionDays}d)` : 'Total Orders'}
          value={stats.orders}
          icon={ShoppingCart}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Pending Orders"
          value={stats.pending}
          icon={Users}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label={isFree && dataRetentionDays ? `Paid revenue (${dataRetentionDays}d)` : 'Paid revenue'}
          value={formatCurrency(stats.revenue)}
          icon={ArrowUpRight}
          accent="bg-emerald-50 text-emerald-600"
        />
      </div>

      <OwnerAnalytics orders={orders} products={products} fullAnalytics={canFullAnalytics} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Your public page</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Share this link or QR code with your customers.
          </p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="shrink-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
              <QRCode value={businessPageUrl(activeBusiness.slug)} size={130} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <code className="block truncate rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {businessPageUrl(activeBusiness.slug)}
              </code>
              <div className="flex flex-wrap gap-3">
                <a href={businessPageUrl(activeBusiness.slug)} target="_blank" rel="noreferrer">
                  <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />}>
                    View page
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  leftIcon={<Copy className="h-4 w-4" />}
                  onClick={() => {
                    navigator.clipboard.writeText(businessPageUrl(activeBusiness.slug));
                    toast.success('Link copied');
                  }}
                >
                  Copy link
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Subscription</h3>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
            <Badge tone={subStatus === 'NONE' ? 'gray' : statusTone(subStatus)}>
              {subStatus === 'NONE' ? 'No plan' : subStatus}
            </Badge>
          </div>
          <Link to="/dashboard/subscription" className="mt-4 block">
            <Button variant="outline" fullWidth>
              Manage plan
            </Button>
          </Link>
          <Link to="/dashboard/reports" className="mt-2 block">
            <Button variant="ghost" fullWidth>
              Daily income reports
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
