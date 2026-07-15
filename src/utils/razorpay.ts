let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpay(): Promise<boolean> {
  if (typeof window !== 'undefined' && (window as unknown as { Razorpay?: unknown }).Razorpay) {
    return Promise.resolve(true);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number;
  businessName: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  onSuccess: (res: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
}

interface RazorpayCtor {
  new (options: Record<string, unknown>): { open: () => void };
}

export function openRazorpayCheckout(opts: RazorpayCheckoutOptions): void {
  const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
  if (!Razorpay) return;

  const rzp = new Razorpay({
    key: opts.keyId,
    amount: Math.round(opts.amount * 100),
    currency: 'INR',
    name: opts.businessName,
    description: opts.description ?? 'Bizora App payment',
    order_id: opts.orderId,
    prefill: {
      name: opts.customerName,
      email: opts.customerEmail,
      contact: opts.customerContact,
    },
    theme: { color: '#4f46e5' },
    config: {
      display: {
        blocks: {
          upi: {
            name: 'Pay via UPI',
            instruments: [{ method: 'upi' }],
          },
        },
        sequence: ['block.upi', 'card', 'netbanking', 'wallet'],
        preferences: { show_default_blocks: true },
      },
    },
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss },
  });
  rzp.open();
}
