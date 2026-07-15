import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Copy,
  Download,
  ExternalLink,
  Printer,
  QrCode as QrIcon,
  RefreshCw,
  Share2,
  Store,
} from 'lucide-react';
import { getBusinessQr, regenerateBusinessQr } from '../../api/qrApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useBusinessStore } from '../../store/businessStore';
import { useEntitlements } from '../../store/subscriptionEntitlementsStore';
import type { BusinessQr } from '../../types';
import { getErrorMessage, imageUrl } from '../../utils/format';

export default function QrCodePage() {
  const { activeBusiness, loaded } = useBusinessStore();
  const { canQrPrintDownload, canRegenerateQr } = useEntitlements();
  const [qr, setQr] = useState<BusinessQr | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeBusiness) {
      if (loaded) setLoading(false);
      return;
    }
    setLoading(true);
    getBusinessQr(activeBusiness.id)
      .then(setQr)
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [activeBusiness, loaded]);

  const qrImage = qr ? imageUrl(qr.qrImagePath) : undefined;
  const businessName = activeBusiness?.businessName ?? 'Your Business';

  const download = async () => {
    if (!canQrPrintDownload) {
      toast.info('Upgrade your plan to download QR');
      return;
    }
    if (!qrImage) return;
    try {
      const res = await fetch(qrImage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeBusiness?.slug ?? 'Bizora App'}-qr.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download QR');
    }
  };

  const copyLink = () => {
    if (!qr) return;
    navigator.clipboard.writeText(qr.scanUrl);
    toast.success('Link copied');
  };

  const share = async () => {
    if (!qr) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `Check out ${businessName} on Bizora App`,
          url: qr.scanUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  };

  const print = () => {
    if (!canQrPrintDownload) {
      toast.info('Upgrade your plan to print QR');
      return;
    }
    if (!qrImage) return;
    const w = window.open('', '_blank', 'width=480,height=680');
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>${businessName} - QR</title>
        <style>
          body{font-family:system-ui,sans-serif;text-align:center;padding:40px;margin:0}
          .card{border:2px solid #4f46e5;border-radius:24px;padding:32px;display:inline-block}
          h1{font-size:22px;margin:0 0 4px;color:#0f172a}
          .tag{color:#6366f1;font-weight:700;letter-spacing:2px;font-size:12px;margin-bottom:20px}
          img{width:300px;height:300px}
          .scan{margin-top:16px;font-size:20px;font-weight:800;color:#4f46e5}
          .sub{color:#64748b;font-size:13px;margin-top:4px}
        </style></head>
        <body>
          <div class="card">
            <h1>${businessName}</h1>
            <div class="tag">Bizora App</div>
            <img src="${qrImage}" />
            <div class="scan">SCAN ME</div>
            <div class="sub">View Menu & Order on WhatsApp</div>
          </div>
          <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
        </body>
      </html>`);
    w.document.close();
  };

  const regenerate = async () => {
    if (!canRegenerateQr) {
      toast.info('Upgrade your plan to regenerate QR');
      return;
    }
    if (!activeBusiness) return;
    setBusy(true);
    try {
      const fresh = await regenerateBusinessQr(activeBusiness.id);
      setQr(fresh);
      toast.success('QR regenerated');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!loaded || loading) return <Loader />;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Store}
        title="No business profile yet"
        description="Create your business profile to generate a QR code."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PagePlanScope page="qr" />
      <div className="grid gap-6 lg:grid-cols-5">
      {/* QR card */}
      <Card className="lg:col-span-2">
        <div className="flex flex-col items-center text-center">
          <div className="w-full rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-1">
            <div className="rounded-[15px] bg-white px-6 py-7">
              <h3 className="text-lg font-bold text-slate-900">{businessName}</h3>
              <p className="mt-0.5 text-[11px] font-bold tracking-[0.2em] text-brand-600">
                Bizora
              </p>
              <div className="mx-auto mt-4 flex aspect-square w-full max-w-[240px] items-center justify-center overflow-hidden rounded-xl border border-slate-100">
                {qrImage ? (
                  <img src={qrImage} alt="Business QR" className="h-full w-full object-contain" />
                ) : (
                  <QrIcon className="h-16 w-16 text-slate-300" />
                )}
              </div>
              <p className="mt-4 text-xl font-extrabold text-brand-600">SCAN ME</p>
              <p className="text-xs text-slate-500">View Menu &amp; Order on WhatsApp</p>
            </div>
          </div>

          <div className="mt-5 grid w-full grid-cols-2 gap-2">
            <Button onClick={download} leftIcon={<Download className="h-4 w-4" />}>
              {canQrPrintDownload ? 'Download' : 'Upgrade'}
            </Button>
            <Button variant="outline" onClick={print} leftIcon={<Printer className="h-4 w-4" />}>
              {canQrPrintDownload ? 'Print' : 'Upgrade'}
            </Button>
            <Button variant="outline" onClick={share} leftIcon={<Share2 className="h-4 w-4" />}>
              Share
            </Button>
            <Button
              variant="ghost"
              onClick={regenerate}
              loading={busy}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              {canRegenerateQr ? 'Regenerate' : 'Upgrade'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Your public page link</h3>
          <p className="mt-1 text-sm text-slate-500">
            This is where the QR code takes your customers.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
              {qr?.scanUrl}
            </code>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyLink} leftIcon={<Copy className="h-4 w-4" />}>
                Copy
              </Button>
              {qr && (
                <a href={qr.scanUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />}>
                    Open
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">How to use your QR code</h3>
          <ol className="mt-4 space-y-3">
            {[
              'Download or print the QR code above.',
              'Place it on your shop counter, tables, menu cards or posters.',
              'Customers scan it with any phone camera - no app needed.',
              'Your digital menu opens instantly with WhatsApp ordering.',
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
    </div>
  );
}
