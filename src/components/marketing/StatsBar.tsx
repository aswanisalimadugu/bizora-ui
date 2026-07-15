import { motion } from 'framer-motion';

const stats = [
  { value: '2,500+', label: 'Businesses online' },
  { value: '50K+', label: 'Products listed' },
  { value: '98%', label: 'Customer satisfaction' },
  { value: '< 5 min', label: 'Average setup time' },
];

export function StatsBar() {
  return (
    <section className="border-y border-slate-100 bg-white/80 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center"
          >
            <p className="text-2xl font-bold text-gradient sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
