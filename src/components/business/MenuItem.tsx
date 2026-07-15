import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, Minus, Plus } from 'lucide-react';
import type { Product } from '../../types';
import { cartLineKey, useCartStore } from '../../store/cartStore';
import { formatCurrency, imageUrl } from '../../utils/format';
import { parseProductOptions } from '../../utils/productOptions';

interface MenuItemProps {
  product: Product;
  onAddToCart?: (product: Product, selectedOption?: string) => void;
  detailUrl?: string;
}

/** Premium restaurant-style horizontal menu row. */
export function MenuItem({ product, onAddToCart, detailUrl }: MenuItemProps) {
  const img = imageUrl(product.imageUrl);
  const options = parseProductOptions(product.options);
  const [selectedOption, setSelectedOption] = useState(options[0] ?? '');

  useEffect(() => {
    const opts = parseProductOptions(product.options);
    setSelectedOption((prev) => {
      if (prev && opts.some((o) => o.toLowerCase() === prev.toLowerCase())) return prev;
      return opts[0] ?? '';
    });
  }, [product.id, product.options]);

  const lineKey = cartLineKey(product.id, selectedOption || undefined);
  const qty = useCartStore((s) => s.items.find((i) => i.lineKey === lineKey)?.quantity ?? 0);
  const productQty = useCartStore((s) =>
    s.items.filter((i) => i.productId === product.id).reduce((sum, i) => sum + i.quantity, 0),
  );
  const updateQty = useCartStore((s) => s.updateQty);

  const handleAdd = () => {
    if (options.length && !selectedOption) return;
    onAddToCart?.(product, selectedOption || undefined);
  };

  const thumb = (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 sm:h-32 sm:w-32">
      {img ? (
        <img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
          <ImageIcon className="h-8 w-8" />
        </div>
      )}
      {!product.available && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] dark:bg-slate-950/70">
          <span className="rounded-xl bg-rose-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Sold out
          </span>
        </div>
      )}
      {productQty > 0 && product.available && (
        <span className="absolute left-2 top-2 rounded-xl bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          ×{productQty}
        </span>
      )}
    </div>
  );

  return (
    <div className="group flex items-stretch gap-3 rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-600/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800 sm:gap-4 sm:p-3">
      <div className="flex min-w-0 flex-1 flex-col py-0.5 sm:py-1">
        {detailUrl ? (
          <Link
            to={detailUrl}
            className="text-[15px] font-bold leading-snug text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400 sm:text-base"
          >
            {product.name}
          </Link>
        ) : (
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 sm:text-base">
            {product.name}
          </h3>
        )}
        <p className="mt-0.5 text-sm font-bold text-brand-600 dark:text-brand-400">
          {formatCurrency(product.price)}
        </p>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {product.description}
          </p>
        )}
        {options.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.map((opt) => {
              const active = selectedOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  disabled={!product.available}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition sm:px-2.5 sm:text-[11px] ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-auto flex gap-2 pt-2.5 sm:pt-3">
          {onAddToCart && qty > 0 ? (
            <div className="inline-flex h-9 items-center rounded-xl border border-brand-200 bg-brand-50 p-0.5 dark:border-brand-800 dark:bg-brand-500/10">
              <button
                type="button"
                onClick={() => updateQty(lineKey, qty - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 transition hover:bg-white dark:text-brand-300 dark:hover:bg-brand-500/20"
                aria-label="Decrease"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[1.5rem] text-center text-xs font-bold tabular-nums text-brand-800 dark:text-brand-200">
                {qty}
              </span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!product.available}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 transition hover:bg-white disabled:opacity-40 dark:text-brand-300 dark:hover:bg-brand-500/20"
                aria-label="Increase"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!product.available || !onAddToCart}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:from-brand-700 hover:to-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:from-slate-800 dark:disabled:to-slate-800 sm:px-4"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </div>
      {detailUrl ? <Link to={detailUrl}>{thumb}</Link> : thumb}
    </div>
  );
}
