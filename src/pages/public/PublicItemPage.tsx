import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  ImageIcon,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getPublicBusiness } from '../../api/businessApi';
import { CartDrawer } from '../../components/business/CartDrawer';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { cartLineKey, useCartStore } from '../../store/cartStore';
import type { Business, Product } from '../../types';
import { formatCurrency, imageUrl, slugToTitle } from '../../utils/format';
import { parseProductOptions } from '../../utils/productOptions';

export default function PublicItemPage() {
  const { slug = '', productId = '' } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { setBusiness: setCartBusiness, addItem, count, total, items, updateQty } = useCartStore();

  useEffect(() => {
    let mounted = true;
    getPublicBusiness(slug)
      .then((b) => {
        if (mounted) {
          setBusiness(b);
          setCartBusiness(b.id);
          setUnavailable(false);
          setNotFound(false);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        if (axios.isAxiosError(err) && err.response?.status === 402) {
          setUnavailable(true);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [slug, setCartBusiness]);

  const displayName = business?.businessName?.trim() || slugToTitle(slug);

  const product: Product | undefined = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const categoryName = useMemo(
    () => business?.categories?.find((c) => c.id === product?.categoryId)?.name,
    [business, product],
  );

  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    const opts = parseProductOptions(product?.options);
    setSelectedOption((prev) => {
      if (prev && opts.some((o) => o.toLowerCase() === prev.toLowerCase())) return prev;
      return opts[0] ?? '';
    });
  }, [product?.id, product?.options]);

  const options = parseProductOptions(product?.options);
  const lineKey = product ? cartLineKey(product.id, selectedOption || undefined) : '';
  const cartQty = items.find((i) => i.lineKey === lineKey)?.quantity ?? 0;

  const addToCart = () => {
    if (!product?.available) return;
    if (options.length && !selectedOption) {
      toast.error('Select an option');
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      available: product.available,
      selectedOption: selectedOption || undefined,
    });
    const optLabel = selectedOption ? ` (${selectedOption})` : '';
    toast.success(`${product.name}${optLabel} added to cart`);
  };

  if (loading) return <Loader fullScreen label="Loading item..." />;

  if (unavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <EmptyState
          icon={Store}
          title="Shop temporarily unavailable"
          description="This business needs an active Bizora App subscription to take online orders."
        />
      </div>
    );
  }

  if (notFound || !business || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <EmptyState
          icon={Store}
          title="Item not found"
          description="This item may have been removed. Try the full menu."
        />
      </div>
    );
  }

  const img = imageUrl(product.imageUrl);
  const location = [business.address, business.city, business.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-mesh bg-slate-50 pb-32 dark:bg-slate-950 sm:pb-12">
      <div className="sticky top-0 z-10 border-b border-white/60 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to={`/business/${slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900"
            title="Back to menu"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{categoryName ?? 'Menu item'}</p>
          </div>
          {count() > 0 && (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/25"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {count()} · {formatCurrency(total())}
            </button>
          )}
          {business.verified && (
            <span className="hidden items-center gap-1 rounded-xl bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 sm:inline-flex dark:bg-brand-500/10 dark:text-brand-300">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:grid sm:grid-cols-2"
        >
          <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-slate-100 to-slate-200 sm:aspect-auto sm:min-h-[420px]">
            {img ? (
              <img src={img} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-16 w-16" />
              </div>
            )}
            {!product.available && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px]">
                <span className="rounded-2xl bg-rose-500 px-5 py-2 text-sm font-bold text-white shadow-lg">
                  Sold out
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/35 to-transparent sm:hidden" />
          </div>

          <div className="flex flex-col p-6 sm:p-8 lg:p-10">
            {categoryName && (
              <span className="mb-3 inline-flex w-fit rounded-xl bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                {categoryName}
              </span>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[15px]">
                {product.description}
              </p>
            )}
            <p className="mt-5 text-4xl font-extrabold tracking-tight text-gradient">
              {formatCurrency(product.price)}
            </p>

            {options.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Choose option
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const active = selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        disabled={!product.available}
                        className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
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
              </div>
            )}

            <div className="mt-8 hidden space-y-3 sm:block">
              {cartQty > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 flex-1 items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-2 dark:border-brand-800 dark:bg-brand-500/10">
                    <button
                      type="button"
                      onClick={() => updateQty(lineKey, cartQty - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold tabular-nums text-brand-800 dark:text-brand-200">
                      {cartQty} in cart
                    </span>
                    <button
                      type="button"
                      onClick={addToCart}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
                  >
                    <ShoppingBag className="h-4 w-4" /> Cart
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!product.available}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Plus className="h-5 w-5" /> Add to cart
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!product.available) return;
                  if (cartQty === 0) {
                    if (options.length && !selectedOption) {
                      toast.error('Select an option');
                      return;
                    }
                    addToCart();
                  }
                  setCartOpen(true);
                }}
                disabled={!product.available}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
              >
                <ShoppingBag className="h-5 w-5" /> Add & pay
              </button>
            </div>

            <div className="mt-8 space-y-2.5 border-t border-slate-100 pt-6 text-sm text-slate-500 dark:border-slate-800">
              {location && (
                <p className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </span>
                  {location}
                </p>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2.5 hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </span>
                  {business.phone}
                </a>
              )}
            </div>

            <Link
              to={`/business/${slug}`}
              className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
            >
              View full menu →
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/90 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur-xl">
          {cartQty > 0 ? (
            <div className="inline-flex h-12 flex-1 items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-1.5">
              <button
                type="button"
                onClick={() => updateQty(lineKey, cartQty - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm"
              >
                −
              </button>
              <span className="text-xs font-bold tabular-nums text-brand-800">{cartQty} in cart</span>
              <button
                type="button"
                onClick={addToCart}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              disabled={!product.available}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 text-sm font-bold text-white disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400"
            >
              <Plus className="h-4 w-4" /> Add to cart
            </button>
          )}
          {count() > 0 && (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-brand-600 px-4 text-sm font-bold text-white"
            >
              Pay · {formatCurrency(total())}
            </button>
          )}
        </div>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        businessId={business.id}
        businessName={displayName}
      />
    </div>
  );
}
