import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { ContactForm } from '../components/marketing/ContactForm';
import { DesktopSection } from '../components/marketing/DesktopSection';
import { FaqItem } from '../components/marketing/FaqItem';
import { HeroPreview } from '../components/marketing/HeroPreview';
import { InstallAppBanner } from '../components/marketing/InstallAppBanner';
import { MarketingNavbar } from '../components/marketing/MarketingNavbar';
import { StatsBar } from '../components/marketing/StatsBar';
import { getPlans } from '../api/paymentApi';
import type { SubscriptionPlan } from '../types';
import { formatCurrency } from '../utils/format';

const features = [
  { icon: QrCode, title: 'QR Menu Cards', desc: 'Generate scannable QR codes for your digital menu. Place them on tables, walls, or share via WhatsApp.' },
  { icon: ShoppingBag, title: 'Product Catalog', desc: 'Showcase your dishes and products with images, prices, descriptions and availability status.' },
  { icon: MessageCircle, title: 'WhatsApp Ordering', desc: 'Customers browse your menu and place orders directly on WhatsApp - no app downloads needed.' },
  { icon: Globe, title: 'Online Storefront', desc: 'A beautiful, mobile-first website for your business that works on any device.' },
  { icon: CreditCard, title: 'Online Payments', desc: 'Accept digital payments securely with Razorpay or display your UPI QR for cash payments.' },
  { icon: BarChart3, title: 'Order Insights', desc: 'Track orders, popular items, customer behavior and revenue from your business dashboard.' },
];

const steps = [
  { n: '01', title: 'Create your account', desc: 'Sign up as a business owner in seconds.' },
  { n: '02', title: 'Build your page', desc: 'Add your logo, products, categories and contact info.' },
  { n: '03', title: 'Share & grow', desc: 'Share your link or QR and start receiving orders.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Bakery owner', quote: 'Bizora App got my bakery online in an afternoon. Orders through WhatsApp doubled in a month!' },
  { name: 'Rahul Verma', role: 'Salon owner', quote: 'The QR code on my counter means clients browse services instantly. Super professional.' },
  { name: 'Anita Reddy', role: 'Boutique owner', quote: 'My customers love the clean menu. Managing products is effortless from my phone.' },
];

const faqs = [
  { q: 'Do I need any technical skills?', a: 'Not at all. If you can fill a form, you can build your Bizora App page. Everything is point-and-click.' },
  { q: 'Can I install Bizora App on my computer?', a: 'Yes! Run npm run desktop to launch Bizora App as a native Windows app with backend and frontend together.' },
  { q: 'Can customers order without signing up?', a: 'Yes. Your public page is fully open - customers browse and order via WhatsApp with zero friction.' },
  { q: 'Is there a free plan?', a: 'Yes, you can start free and upgrade anytime as your business grows.' },
  { q: 'How do payments work?', a: 'Subscription payments are handled securely through Razorpay. You can also use your own UPI QR.' },
  { q: 'Can I use my own branding?', a: 'Absolutely - add your logo, cover image, colors and business details for a branded experience.' },
];

const fallbackPlans = [
  { name: 'Starter', price: 0, durationDays: 0, features: '1 business page,Up to 10 products,WhatsApp enquiries,Basic support', highlighted: false },
  { name: 'Growth', price: 499, durationDays: 30, features: 'Unlimited products,Custom categories,Order management,QR business card,Priority support', highlighted: true },
  { name: 'Business', price: 999, durationDays: 30, features: 'Everything in Growth,Verified badge,Advanced insights,Dedicated manager', highlighted: false },
];

const logos = ['Restaurants', 'Cafés', 'Bakeries', 'Salons', 'Retail Stores'];

export default function LandingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    getPlans()
      .then((p) => setPlans(p.filter((x) => x.active !== false)))
      .catch(() => setPlans([]));
  }, []);

  const displayPlans =
    plans.length > 0
      ? plans.map((p, i) => ({
          name: p.name,
          price: p.price,
          durationDays: p.durationDays,
          features: p.features,
          highlighted: plans.length === 1 ? i === 0 : i === 1,
        }))
      : fallbackPlans;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MarketingNavbar />
      <InstallAppBanner />

      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/80 via-white to-white dark:from-brand-950/40 dark:via-slate-950 dark:to-slate-950" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-600/10" />

        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:py-24">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300"
          >
            <Sparkles className="h-4 w-4" /> QR Menus, Online Catalog & WhatsApp Ordering
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
          >
            Your restaurant online with QR menus & WhatsApp orders in{' '}
            <span className="text-gradient animate-gradient-text">minutes</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300"
          >
            Bizora App creates a beautiful online menu catalog with QR codes and WhatsApp ordering integration.
            Perfect for restaurants, cafes, bakeries and any business wanting to go digital.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/register"
              className="ai-shimmer relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-600/40"
            >
              Start free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Sign in
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex items-center justify-center gap-1 text-sm text-slate-500 dark:text-slate-400"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2">Loved by local businesses</span>
          </motion.div>

          <HeroPreview />
        </div>
      </section>

      <StatsBar />

      {/* Logo strip */}
      <section className="border-b border-slate-100 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
          {logos.map((name) => (
            <span key={name} className="text-sm font-semibold tracking-wide text-slate-400 dark:text-slate-500">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Digital ordering made simple</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Everything your restaurant needs to take orders online, manage your menu and grow your business.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              className="card-premium group p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform group-hover:scale-110 dark:bg-brand-500/15 dark:text-brand-400">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-50 py-20 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">How it works</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Get up and running in three simple steps.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900"
              >
                <span className="text-4xl font-bold text-brand-200 dark:text-brand-800">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Loved by business owners</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Join thousands growing their business with Bizora App.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-sm italic text-slate-600 dark:text-slate-300">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-sm font-semibold text-white shadow-sm">
                  {t.name.split(' ').map((w) => w[0]).join('')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Simple, fair pricing</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Start free. Upgrade when you grow.</p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {displayPlans.map((p, i) => {
            const featureList = (p.features ?? '').split(',').map((f) => f.trim()).filter(Boolean);
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className={`relative rounded-2xl border p-8 transition-shadow ${
                  p.highlighted
                    ? 'border-brand-600 bg-white shadow-xl shadow-brand-600/10 dark:bg-slate-900'
                    : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{p.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {Number(p.price) === 0 ? 'Free' : formatCurrency(p.price)}
                  </span>
                  {Number(p.price) > 0 && p.durationDays ? (
                    <span className="mb-1 text-sm text-slate-400">/{p.durationDays}d</span>
                  ) : null}
                </div>
                <ul className="mt-6 space-y-3">
                  {featureList.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-8 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                    p.highlighted
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Get started
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <DesktopSection />

      {/* FAQ */}
      <section id="faq" className="bg-slate-50 py-20 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Everything you need to know before getting started.</p>
          </div>
          <div className="mt-12 space-y-3">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Get in touch</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Have a question or need a hand getting started? Our team is here to help.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <a href="mailto:hello@bizora.app" className="flex items-center gap-3 text-slate-700 hover:text-brand-600 dark:text-slate-300">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Mail className="h-5 w-5" />
                </span>
                hello@bizora.app
              </a>
              <a href="tel:+919000000000" className="flex items-center gap-3 text-slate-700 hover:text-brand-600 dark:text-slate-300">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Phone className="h-5 w-5" />
                </span>
                +91 90000 00000
              </a>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <MapPin className="h-5 w-5" />
                </span>
                Hyderabad, India
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="auth-gradient relative overflow-hidden rounded-3xl px-8 py-14 text-center shadow-xl shadow-brand-600/20"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 animate-gradient-shift opacity-20" />
          <h2 className="relative text-3xl font-bold text-white sm:text-4xl">Ready to bring your business online?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-brand-100">
            Join thousands of businesses growing with Bizora App. It only takes a minute.
          </p>
          <Link
            to="/register"
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-xl"
          >
            Create your free account <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
