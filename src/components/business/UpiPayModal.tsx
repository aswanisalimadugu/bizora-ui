import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, Copy, Smartphone } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/format';

interface UpiPayModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  planName: string;
  payeeName: string;
  upiId: string;
  note?: string;
  onPaid: () => void;
  confirming?: boolean;
}

export function UpiPayModal({
  open,
  onClose,
  amount,
  planName,
  payeeName,
  upiId,
  note,
  onPaid,
  confirming,
}: UpiPayModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      am: String(amount),
      cu: 'INR',
      tn: note ?? `${planName} subscription`,
    });
    return `upi://pay?${params.toString()}`;
  }, [upiId, payeeName, amount, note, planName]);

  const copyId = () => {
    navigator.clipboard.writeText(upiId);
    toast.success('UPI ID copied');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pay via UPI"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onPaid}
            disabled={!confirmed}
            loading={confirming}
            leftIcon={<Check className="h-4 w-4" />}
          >
            I have paid
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-full rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-1">
          <div className="rounded-[15px] bg-white px-6 py-6">
            <p className="text-sm font-semibold text-slate-900">{planName}</p>
            <p className="mt-1 text-3xl font-extrabold text-brand-600">{formatCurrency(amount)}</p>
            <div className="mx-auto mt-4 flex w-fit items-center justify-center rounded-xl border border-slate-100 bg-white p-3">
              <QRCodeCanvas value={upiLink} size={210} level="H" includeMargin />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              Scan with any UPI app (GPay, PhonePe, Paytm)
            </p>
          </div>
        </div>

        {/* UPI ID copy */}
        <div className="mt-4 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Pay to</span>
          <code className="flex-1 truncate text-left text-sm font-semibold text-slate-800">
            {upiId}
          </code>
          <button
            onClick={copyId}
            className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
            title="Copy UPI ID"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Open UPI app (mobile) */}
        <a href={upiLink} className="mt-3 w-full sm:hidden">
          <Button fullWidth leftIcon={<Smartphone className="h-4 w-4" />}>
            Open UPI app
          </Button>
        </a>

        {/* Confirm checkbox */}
        <label className="mt-4 flex w-full cursor-pointer items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I have completed the UPI payment. Activate my subscription.
        </label>
      </div>
    </Modal>
  );
}
