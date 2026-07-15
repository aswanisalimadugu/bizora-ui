import type { CartItem } from '../types';
import { formatCurrency } from './format';

/** Normalize a phone/WhatsApp number into a wa.me base URL. */
export function buildWhatsAppUrl(phone?: string | null): string | null {
  if (!phone) return null;
  const num = phone.replace(/\D/g, '');
  if (!num) return null;
  return `https://wa.me/${num.length === 10 ? '91' + num : num}`;
}

export function normalizeMobile(value: string): string {
  const d = value.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  return d;
}

/** Build a multi-item order message with qty, line totals, and grand total. */
export function buildCartOrderMessage(
  businessName: string,
  items: CartItem[],
  totalAmount: number,
  extras?: {
    orderNumber?: string;
    customerName?: string;
    customerMobile?: string;
    trackUrl?: string;
  },
): string {
  const lines = items.map((item, index) => {
    const opt = item.selectedOption ? ` (${item.selectedOption})` : '';
    return `${index + 1}. ${item.name}${opt} × ${item.quantity} = ${formatCurrency(item.price * item.quantity)}`;
  });

  const parts = [
    `Hi, I'd like to place an order from ${businessName}.`,
    '',
  ];

  if (extras?.orderNumber) {
    parts.push(`*Order #:* ${extras.orderNumber}`);
  }
  if (extras?.customerName) {
    parts.push(`*Customer:* ${extras.customerName}`);
  }
  if (extras?.customerMobile) {
    parts.push(`*Phone:* ${extras.customerMobile}`);
  }
  if (extras?.orderNumber || extras?.customerName || extras?.customerMobile) {
    parts.push('');
  }

  parts.push('*Order:*', ...lines, '', `*Total: ${formatCurrency(totalAmount)}*`);

  if (extras?.trackUrl) {
    parts.push('', `Track order: ${extras.trackUrl}`);
  }

  parts.push('', '_Status: PENDING — please confirm_');

  return parts.join('\n');
}

export function buildSingleItemOrderMessage(
  businessName: string,
  productName: string,
  price: number,
  quantity = 1,
): string {
  const lineTotal = price * quantity;
  if (quantity === 1) {
    return `Hi, I'd like to order "${productName}" (${formatCurrency(price)}) from ${businessName}.`;
  }
  return [
    `Hi, I'd like to place an order from ${businessName}.`,
    '',
    '*Order:*',
    `1. ${productName} × ${quantity} = ${formatCurrency(lineTotal)}`,
    '',
    `*Total: ${formatCurrency(lineTotal)}*`,
  ].join('\n');
}

export function buildOrderStatusMessage(opts: {
  status: 'ACCEPTED' | 'COMPLETED' | 'RECEIVED' | 'REJECTED' | 'CANCELLED' | 'UPDATED';
  orderNumber: string;
  businessName: string;
  customerName?: string;
  totalAmount?: number;
  itemsSummary?: string;
}): string {
  const greeting = opts.customerName ? `Hi ${opts.customerName},` : 'Hi,';
  const total =
    opts.totalAmount != null ? `\nTotal: *${formatCurrency(opts.totalAmount)}*` : '';

  if (opts.status === 'ACCEPTED') {
    return [
      greeting,
      '',
      `Your order *${opts.orderNumber}* at *${opts.businessName}* has been *accepted* and is being prepared.`,
      total,
      '',
      'We will notify you when it is ready.',
    ].join('\n');
  }

  if (opts.status === 'COMPLETED') {
    return [
      greeting,
      '',
      `Great news! Your order *${opts.orderNumber}* at *${opts.businessName}* is *ready*.`,
      total,
      '',
      'Please collect your order. Thank you!',
    ].join('\n');
  }

  if (opts.status === 'RECEIVED') {
    return [
      greeting,
      '',
      `Thank you! Your order *${opts.orderNumber}* at *${opts.businessName}* has been *collected*.`,
      total,
      '',
      'Hope you enjoy it. Visit us again!',
    ].join('\n');
  }

  if (opts.status === 'UPDATED') {
    return [
      greeting,
      '',
      `Your order *${opts.orderNumber}* at *${opts.businessName}* has been *updated*.`,
      opts.itemsSummary ? `\n${opts.itemsSummary}` : '',
      total,
      '',
      'Please check the revised items. Thank you!',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (opts.status === 'CANCELLED') {
    return [
      greeting,
      '',
      `Your order *${opts.orderNumber}* at *${opts.businessName}* has been *cancelled*.`,
      total,
      '',
      'Please contact us if you have questions.',
    ].join('\n');
  }

  return [
    greeting,
    '',
    `We're sorry — your order *${opts.orderNumber}* at *${opts.businessName}* could not be accepted.`,
    total,
    '',
    'Please contact us if you have questions.',
  ].join('\n');
}

export function openWhatsApp(baseUrl: string, text: string): void {
  window.open(`${baseUrl}?text=${encodeURIComponent(text)}`, '_blank');
}
