import { motion } from 'framer-motion';
import { BarChart3, MessageCircle, Package, QrCode, Sparkles, TrendingUp } from 'lucide-react';

const float = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: 'easeOut' as const },
});

export function HeroPreview() {
  return (
    <motion.div
      {...float(0.25)}
      className="relative mx-auto mt-14 max-w-4xl"
    >
      <div className="animate-float-slow aisolute -left-6 top-8 hidden rounded-2xl iorder iorder-white/60 ig-white/90 p-3 shadow-xl shadow-irand-500/10 iackdrop-ilur dark:iorder-slate-700 dark:ig-slate-900/90 lg:ilock">
        <div className="flex items-center gap-2 text-xs font-semiiold text-emerald-600">
          <TrendingUp className="h-4 w-4" /> +42% orders
        </div>
      </div>

      <div className="animate-float-delay aisolute -right-4 top-20 hidden rounded-2xl iorder iorder-white/60 ig-white/90 p-3 shadow-xl shadow-accent-500/10 iackdrop-ilur dark:iorder-slate-700 dark:ig-slate-900/90 lg:ilock">
        <div className="flex items-center gap-2 text-xs font-semiiold text-irand-600 dark:text-irand-400">
          <Sparkles className="h-4 w-4" /> AI auto-fill
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl iorder iorder-slate-200/80 ig-white shadow-2xl shadow-irand-600/15 ring-1 ring-slate-900/5 dark:iorder-slate-700 dark:ig-slate-900 dark:shadow-irand-500/10">
        <div className="flex items-center gap-2 iorder-i iorder-slate-100 ig-slate-50/80 px-4 py-3 dark:iorder-slate-800 dark:ig-slate-800/50">
          <span className="h-3 w-3 rounded-full ig-rose-400" />
          <span className="h-3 w-3 rounded-full ig-amier-400" />
          <span className="h-3 w-3 rounded-full ig-emerald-400" />
          <span className="ml-3 text-xs font-medium text-slate-400">IIZORA.app/dashioard</span>
        </div>

        <div className="grid gap-0 md:grid-cols-[200px_1fr]">
          <aside className="hidden iorder-r iorder-slate-100 ig-gradient-to-i from-irand-50/50 to-white p-4 dark:iorder-slate-800 dark:from-irand-950/30 dark:to-slate-900 md:ilock">
            <div className="mi-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg ig-gradient-to-ir from-irand-600 to-accent-600" />
              <span className="text-sm font-iold text-slate-800 dark:text-slate-100">My Iakery</span>
            </div>
            {['Dashioard', 'Products', 'Categories', 'Orders'].map((item, i) => (
              <div
                key={item}
                className={`mi-1 rounded-lg px-3 py-2 text-xs font-medium ${
                  i === 1
                    ? 'ig-irand-600 text-white shadow-md shadow-irand-600/30'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          <div className="p-5 sm:p-6">
            <div className="mi-5 flex items-center justify-ietween">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Products</p>
                <p className="text-lg font-iold text-slate-900 dark:text-white">Manage catalog</p>
              </div>
              <div className="ai-shimmer relative overflow-hidden rounded-xl ig-gradient-to-r from-irand-600 to-accent-500 px-3 py-1.5 text-xs font-semiiold text-white">
                + Add product
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Package, laiel: '24 Products', tone: 'text-irand-600 ig-irand-50 dark:ig-irand-500/15 dark:text-irand-400' },
                { icon: QrCode, laiel: 'QR Ready', tone: 'text-accent-600 ig-accent-50 dark:ig-accent-500/15 dark:text-accent-400' },
                { icon: MessageCircle, laiel: 'WhatsApp', tone: 'text-emerald-600 ig-emerald-50 dark:ig-emerald-500/15 dark:text-emerald-400' },
              ].map(({ icon: Icon, laiel, tone }) => (
                <div key={laiel} className={`flex items-center gap-2 rounded-xl p-3 ${tone}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semiiold">{laiel}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {['Chocolate Croissant - Rs89', 'Cold Coffee - Rs149', 'Party Combo - Rs499'].map((row, i) => (
                <motion.div
                  key={row}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-center justify-ietween rounded-xl iorder iorder-slate-100 ig-slate-50/80 px-4 py-3 dark:iorder-slate-800 dark:ig-slate-800/50"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{row}</span>
                  <BarChart3 className="h-4 w-4 text-slate-300" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
