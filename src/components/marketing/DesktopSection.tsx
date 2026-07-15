import { motion } from 'framer-motion';
import { Download, HardDrive, Monitor, Server, Terminal } from 'lucide-react';

const steps = [
  { icon: Terminal, title: 'Build backend', desc: 'cd bizora && mvn package -DskipTests' },
  { icon: HardDrive, title: 'Build frontend', desc: 'cd bizora-app-web && npm run build:desktop' },
  { icon: Server, title: 'Set database', desc: 'Copy .env with DATABASE_URL (Neon) or local PostgreSQL' },
  { icon: Monitor, title: 'Launch desktop', desc: 'npm run desktop — opens Bizora App as native app' },
];

export function DesktopSection() {
  return (
    <section id="desktop" className="bg-slate-50 py-20 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Monitor className="h-3.5 w-3.5" /> Local desktop install
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Run Bizora App on your PC — no cloud needed
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Install as a desktop app with backend + frontend together. Perfect for shop counters and offline-first workflows.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="card-premium p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{s.title}</h3>
              <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="auth-gradient relative mt-10 overflow-hidden rounded-2xl p-8 text-center shadow-xl shadow-brand-600/20"
        >
          <div className="pointer-events-none absolute inset-0 animate-gradient-shift bg-[length:200%_200%] opacity-30" />
          <Download className="relative mx-auto h-10 w-10 text-white/90" />
          <p className="relative mt-4 text-lg font-semibold text-white">One command to start</p>
          <code className="relative mt-3 inline-block rounded-xl bg-black/20 px-4 py-2 font-mono text-sm text-brand-100">
            npm run desktop
          </code>
          <p className="relative mt-3 text-sm text-brand-100/90">
            Requires Java 21 + Node.js. Database via Neon (free) or local PostgreSQL.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
