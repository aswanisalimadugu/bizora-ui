import { useEffect, useState } from 'react';
import { Bell, CreditCard, Moon, Shield, User, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  connectRazorpay,
  disconnectRazorpay,
  getRazorpayStatus,
  type RazorpayStatus,
} from '../../api/businessApi';
import { Avatar } from '../../components/common/Avatar';
import { Badge, statusTone } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import { useThemeStore } from '../../store/themeStore';
import { formatDate, getErrorMessage } from '../../utils/format';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const { activeBusiness } = useBusinessStore();
  const { planName, isPaid, status, isFree } = useEntitlements();
  const [rzp, setRzp] = useState<RazorpayStatus | null>(null);
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [savingRzp, setSavingRzp] = useState(false);

  useEffect(() => {
    if (!activeBusiness?.id) return;
    getRazorpayStatus(activeBusiness.id)
      .then(setRzp)
      .catch(() => setRzp(null));
  }, [activeBusiness?.id]);

  const saveRazorpay = async () => {
    if (!activeBusiness) return;
    setSavingRzp(true);
    try {
      const next = await connectRazorpay(activeBusiness.id, {
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
        webhookSecret: webhookSecret.trim() || undefined,
      });
      setRzp(next);
      setKeySecret('');
      setWebhookSecret('');
      toast.success('Razorpay connected — customer payments go to your account');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not save Razorpay keys'));
    } finally {
      setSavingRzp(false);
    }
  };

  const removeRazorpay = async () => {
    if (!activeBusiness) return;
    setSavingRzp(true);
    try {
      const next = await disconnectRazorpay(activeBusiness.id);
      setRzp(next);
      setKeyId('');
      toast.success('Razorpay disconnected');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSavingRzp(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PagePlanScope page="settings" />
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="lg" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Member since {formatDate(user?.createdAt)}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <Wallet className="h-5 w-5 text-brand-600" />
            Razorpay (customer orders)
          </h3>
          <Badge tone={rzp?.configured ? 'green' : 'amber'}>
            {rzp?.configured ? 'Connected' : 'Not set'}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Connect your Razorpay Key ID + Secret so order payments settle to your merchant account.
          Bizora App subscription billing still uses the platform account. Secret is encrypted and never
          shown again.
        </p>
        {rzp?.configured ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Key ID: <code className="font-mono text-xs">{rzp.keyId}</code>
            </p>
            <p className="text-xs text-slate-500">Mode: {rzp.paymentMode}</p>
            <Button variant="outline" loading={savingRzp} onClick={removeRazorpay}>
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!rzp?.platformOrderPaymentsAllowed ? (
              <p className="text-xs font-medium text-amber-700">
                Platform fallback is off — connect keys before accepting online orders.
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Until you connect, orders may use platform Razorpay (if configured on server).
              </p>
            )}
            <Input
              label="Key ID"
              placeholder="rzp_live_…"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
            />
            <Input
              label="Key Secret"
              type="password"
              placeholder="••••••••"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
            />
            <Input
              label="Webhook secret (optional)"
              type="password"
              placeholder="whsec_…"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
            <Button
              loading={savingRzp}
              disabled={!keyId.trim() || !keySecret.trim()}
              onClick={saveRazorpay}
            >
              Save &amp; connect
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <CreditCard className="h-5 w-5 text-brand-600" />
            Subscription
          </h3>
          <Badge tone={statusTone(isPaid ? status : 'ACTIVE')}>{isPaid ? status : 'Free'}</Badge>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 py-3 dark:border-slate-800">
            <dt className="text-slate-500">Current plan</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{planName}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {isFree ? 'Free · limited features' : status}
            </dd>
          </div>
        </dl>
        <Link to="/dashboard/subscription" className="mt-2 block">
          <Button variant="outline" fullWidth>
            {isPaid ? 'Manage plan' : 'Upgrade plan'}
          </Button>
        </Link>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          <User className="h-5 w-5 text-brand-600" />
          Account
        </h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 py-3 dark:border-slate-800">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{user?.name}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-3 dark:border-slate-800">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-3 dark:border-slate-800">
            <dt className="text-slate-500">Mobile</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{user?.mobile}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium capitalize text-slate-900 dark:text-slate-100">
              {user?.role?.toLowerCase()}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          <Moon className="h-5 w-5 text-brand-600" />
          Appearance
        </h3>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/30">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Theme</p>
            <p className="text-xs text-slate-500">
              Currently using {theme === 'dark' ? 'dark' : 'light'} mode
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          <Bell className="h-5 w-5 text-brand-600" />
          Notifications
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Email and push notifications for new orders will be available in a future update.
        </p>
      </Card>

      <Card className="border-rose-100 dark:border-rose-900/30">
        <h3 className="flex items-center gap-2 text-base font-semibold text-rose-600">
          <Shield className="h-5 w-5" />
          Danger zone
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Account deletion requires contacting support. Your business data will be permanently
          removed.
        </p>
      </Card>
    </div>
  );
}
