import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Shared easing + durations for a consistent premium feel. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Wrap a page's content to get a smooth enter transition. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0.96, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
