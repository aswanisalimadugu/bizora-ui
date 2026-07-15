import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCode({ value, size = 160, label }: QRCodeProps) {
  const handleDownload = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#bizora-qr canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'bizora-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div id="bizora-qr" className="rounded-2xl border border-slate-200 bg-white p-3">
        <QRCodeCanvas value={value} size={size} level="H" includeMargin />
      </div>
      {label && <p className="text-xs text-slate-500">{label}</p>}
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <Download className="h-4 w-4" /> Download QR
      </button>
    </div>
  );
}
