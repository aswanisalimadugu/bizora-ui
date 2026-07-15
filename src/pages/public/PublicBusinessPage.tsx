import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Clock,
  LayoutGrid,
  MapPin,
  Navigation,
  Phone,
  Search,
  Share2,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getPublicBusiness } from '../../api/businessApi';
import { MenuItem } from '../../components/business/MenuItem';
import { CartDrawer } from '../../components/business/CartDrawer';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useCartStore } from '../../store/cartStore';
import type { Business, Category, Product } from '../../types';
import { formatCurrency, imageUrl, slugToTitle } from '../../utils/format';

const UNCATEGORIZED = 'uncategorized';

export default function PublicBusinessPage() {
  const { slug = '' } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('');
  const [cartOpen, setCartOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { setBusiness: setCartBusiness, addItem, count, total } = useCartStore();

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
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 402) {
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
  usePageMeta(displayName, business?.description?.slice(0, 160));

  const products = business?.products ?? [];
  const categories = business?.categories ?? [];

  // Default to first category so only one category's items show.
  useEffect(() => {
    if (!business) return;
    const cats = business.categories ?? [];
    const known = new Set(cats.map((c) => c.id));
    const hasOrphans = (business.products ?? []).some(
      (p) => !p.categoryId || !known.has(p.categoryId),
    );

    setActiveCat((prev) => {
      if (prev && cats.some((c) => c.id === prev)) return prev;
      if (prev === UNCATEGORIZED && hasOrphans) return prev;
      if (cats.length > 0) return cats[0].id;
      if (hasOrphans) return UNCATEGORIZED;
      return '';
    });
  }, [business]);

  const addToCart = (product: Product, selectedOption?: string) => {
    if (!product.available) return;
    addItem({
      productId: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      available: product.available,
      selectedOption,
    });
    const optLabel = selectedOption ? ` (${selectedOption})` : '';
    toast.success(`${product.name}${optLabel} added to cart`);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (p: Product) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q);

    const buckets: { id: string; name: string; items: Product[] }[] = [];
    for (const c of categories) {
      const items = products.filter((p) => p.categoryId === c.id && match(p));
      if (!q || items.length) {
        buckets.push({ id: c.id, name: c.name, items });
      }
    }
    const known = new Set(categories.map((c: Category) => c.id));
    const orphans = products.filter(
      (p) => (!p.categoryId || !known.has(p.categoryId)) && match(p),
    );
    if (orphans.length) buckets.push({ id: UNCATEGORIZED, name: 'More items', items: orphans });

    // Search: show all matching categories. Otherwise: only the selected category.
    if (q) return buckets;
    if (!activeCat) return buckets.slice(0, 1);
    return buckets.filter((s) => s.id === activeCat);
  }, [products, categories, query, activeCat]);

  const totalVisible = sections.reduce((sum, s) => sum + s.items.length, 0);
  const categoryNav = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        count: products.filter((p) => p.categoryId === c.id).length,
      })),
    [categories, products],
  );
  const orphanCount = products.filter((p) => {
    const known = new Set(categories.map((c) => c.id));
    return !p.categoryId || !known.has(p.categoryId);
  }).length;

  const selectCategory = (id: string) => {
    setActiveCat(id);
    setQuery('');
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <Loader fullScreen label="Loading menu..." />;

  if (unavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <EmptyState
          icon={Store}
          title="Shop temporarily unavailable"
          description="This business needs an active Bizora App subscription to take online orders. Please check back soon."
        />
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <EmptyState
          icon={Store}
          title="Business not found"
          description="This page may have been removed or the link is incorrect."
        />
      </div>
    );
  }

  const cover = imageUrl(business.coverImageUrl);
  const logo = imageUrl(business.logoUrl);
  const location = [business.address, business.city, business.state].filter(Boolean).join(', ');
  const mapsUrl = location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : null;
  const openLabel = business.isOpen === false ? 'Closed' : business.businessHours || 'Open now';
  const nameInitials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* ===== Premium hero ===== */}
      <div className="relative isolate overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-700 via-violet-700 to-fuchsia-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.22),transparent_45%)]" />
        <div className="absolute inset-0 bg-slate-950/45" />

        <div className="relative mx-auto max-w-[1700px] px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 text-2xl font-bold text-white shadow-2xl backdrop-blur-md sm:h-28 sm:w-28">
              {logo ? (
                <img src={logo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                nameInitials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl">
                  {displayName}
                </h1>
                {business.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
              {business.description && (
                <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">{business.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-white/80 sm:justify-start">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {location}
                  </span>
                )}
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:text-white">
                    <Phone className="h-4 w-4" /> {business.phone}
                  </a>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={share}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md transition-transform hover:scale-[1.03] hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Body: sidebar + content ===== */}
      <div className="relative -mt-8 rounded-t-[2rem] bg-slate-100 pb-28 pt-8 dark:bg-slate-950 sm:pb-16">
        <div className="mx-auto grid max-w-[1700px] gap-6 px-4 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-10">
          {/* ---- Sidebar ---- */}
          <aside className="lg:sticky lg:top-6 lg:h-fit">
            {/* Categories nav */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 px-1 pb-3">
                <LayoutGrid className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Categories
                </h2>
              </div>
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
                {categoryNav.length === 0 && orphanCount === 0 && (
                  <p className="px-1 text-sm text-slate-400">No categories yet</p>
                )}
                {categoryNav.map((s) => {
                  const active = activeCat === s.id && !query.trim();
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectCategory(s.id)}
                      className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all lg:w-full ${
                        active
                          ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md shadow-brand-600/25'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {s.count}
                      </span>
                    </button>
                  );
                })}
                {orphanCount > 0 && (
                  <button
                    type="button"
                    onClick={() => selectCategory(UNCATEGORIZED)}
                    className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all lg:w-full ${
                      activeCat === UNCATEGORIZED && !query.trim()
                        ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md shadow-brand-600/25'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>More items</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        activeCat === UNCATEGORIZED && !query.trim()
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {orphanCount}
                    </span>
                  </button>
                )}
              </nav>
            </div>

            {/* Contact / info card */}
            <div className="mt-4 hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
              <h2 className="px-1 pb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Information
              </h2>
              <ul className="space-y-3 text-sm">
                {location && (
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                    <span>{location}</span>
                  </li>
                )}
                {business.phone && (
                  <li>
                    <a href={`tel:${business.phone}`} className="flex items-center gap-3 text-slate-600 hover:text-brand-600 dark:text-slate-300">
                      <Phone className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                      {business.phone}
                    </a>
                  </li>
                )}
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Clock className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span className={business.isOpen === false ? 'text-rose-600 font-medium' : ''}>{openLabel}</span>
                </li>
                {mapsUrl && (
                  <li>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      <Navigation className="h-4 w-4 shrink-0" />
                      Get directions
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </aside>

          {/* ---- Main content ---- */}
          <div ref={contentRef} className="min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {query.trim()
                    ? 'Search results'
                    : sections[0]?.name || 'Menu'}
                </h2>
                <p className="text-sm text-slate-400">
                  {query.trim()
                    ? `${totalVisible} match${totalVisible === 1 ? '' : 'es'}`
                    : `${sections[0]?.items.length ?? 0} item${
                        (sections[0]?.items.length ?? 0) === 1 ? '' : 's'
                      } in this category`}
                </p>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the menu..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Sections */}
            <div className="mt-6 space-y-10">
              {sections.length === 0 ? (
                <EmptyState
                  icon={UtensilsCrossed}
                  title={query.trim() ? 'No items found' : 'No menu yet'}
                  description={
                    query.trim()
                      ? 'Try a different search.'
                      : categories.length
                        ? 'Categories are ready — add products from your owner dashboard.'
                        : 'Add categories and products to start selling.'
                  }
                />
              ) : (
                sections.map((section) => (
                  <section key={section.id} id={`cat-${section.id}`} className="scroll-mt-24">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-brand-500 to-violet-500" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{section.name}</h3>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {section.items.length}
                      </span>
                    </div>
                    {section.items.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          No products in this category yet
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                        {section.items.map((p) => (
                          <MenuItem
                            key={p.id}
                            product={p}
                            detailUrl={`/business/${slug}/item/${p.id}`}
                            onAddToCart={addToCart}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile dock */}
      {count() > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/90 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex flex-1 items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-600 to-accent-600 px-4 py-3 text-left text-white shadow-lg shadow-brand-600/25"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/75">
                  View cart · {count()} items
                </span>
                <span className="block truncate text-base font-extrabold tabular-nums">
                  {formatCurrency(total())}
                </span>
              </span>
              <span className="shrink-0 rounded-xl bg-white/15 px-2.5 py-1 text-xs font-bold ring-1 ring-white/20">
                Pay
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop cart FAB */}
      {count() > 0 && (
        <motion.button
          type="button"
          initial={{ y: 24, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-7 right-7 z-30 hidden overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-600 to-accent-600 p-[1px] shadow-2xl shadow-brand-700/30 lg:block"
        >
          <span className="flex items-center gap-3 rounded-[0.9rem] bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-3.5 text-white">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-lg bg-white px-1 text-[10px] font-extrabold text-brand-700">
                {count()}
              </span>
            </span>
            <span className="text-left">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Your cart
              </span>
              <span className="block text-sm font-extrabold tabular-nums">
                {formatCurrency(total())}
              </span>
            </span>
          </span>
        </motion.button>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        businessId={business.id}
        businessName={displayName}
      />
    </div>
  );
}
