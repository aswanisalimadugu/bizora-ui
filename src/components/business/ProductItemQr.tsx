import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Download, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../common/Button';
import type { Product } from '../../types';
import { formatCurrency, itemPageUrl } from '../../utils/format';

interface ProductItemQrProps {
  product: Product;
  businessName: string;
  slug: string;
}

export function ProductItemQr({ product, businessName, slug }: ProductItemQrProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const scanUrl = itemPageUrl(slug, product.id);

  const getCanvas = () => canvasRef.current?.querySelector('canvas');

  const download = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${slug}-${product.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    a.click();
    toast.success('QR downloaded');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(scanUrl);
    toast.success('Link copied');
  };

  const print = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '_blank', 'width=420,height=600');
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>${product.name} - QR</title>
        <style>
          body{font-family:system-ui,sans-serif;text-align:center;padding:32px;margin:0}
          .card{border:2px solid #4f46e5;border-radius:20px;padding:24px;display:inline-block}
          h1{font-size:18px;margin:0 0 2px;color:#0f172a}
          h2{font-size:14px;color:#6366f1;margin:0 0 16px;font-weight:600}
          .price{font-size:20px;font-weight:800;color:#4f46e5;margin-top:12px}
          img{width:220px;height:220px}
          .scan{margin-top:12px;font-size:16px;font-weight:800;color:#4f46e5}
          .sub{color:#64748b;font-size:12px;margin-top:4px}
        </style></head>
        <body>
          <div class="card">
            <h1>${businessName}</h1>
            <h2>${product.name}</h2>
            <img src="${dataUrl}" />
            <div class="price">${formatCurrency(product.price)}</div>
            <div class="scan">SCAN ME</div>
            <div class="sub">View item &amp; pay online</div>
          </div>
          <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
        </body>
      </html>`);
    w.document.close();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-full rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-1">
        <div className="rounded-[15px] bg-white px-5 py-6">
          <p className="text-xs font-bold tracking-[0.15em] text-brand-600">{businessName}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{product.name}</h3>
          <p className="text-lg font-extrabold text-brand-600">{formatCurrency(product.price)}</p>
          <div
            ref={canvasRef}
            className="mx-auto mt-3 flex items-center justify-center rounded-xl border border-slate-100 bg-white p-3"
          >
            <QRCodeCanvas value={scanUrl} size={200} level="H" includeMargin />
          </div>
          <p className="mt-3 text-sm font-extrabold text-brand-600">SCAN ME</p>
          <p className="text-xs text-slate-500">View this item &amp; pay online</p>
        </div>
      </div>

      <code className="mt-4 w-full truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {scanUrl}
      </code>

      <div className="mt-4 grid w-full grid-cols-3 gap-2">
        <Button size="sm" onClick={download} leftIcon={<Download className="h-3.5 w-3.5" />}>
          Download
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={print}
          leftIcon={<Printer className="h-3.5 w-3.5" />}
        >
          Print
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={copyLink}
          leftIcon={<Copy className="h-3.5 w-3.5" />}
        >
          Copy
        </Button>
      </div>
    </div>
  );
}
