import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Loader2, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { generateProductFill } from '../../api/aiApi';
import { useEntitlements, useSubscriptionEntitlementsStore } from '../../store/subscriptionEntitlementsStore';
import { getErrorMessage } from '../../utils/format';

interface AiProductFillButtonProps {
  productName: string;
  businessName?: string;
  existingCategories: string[];
  onFill: (data: { description: string; price: number; categoryName: string }) => void;
  disabled?: boolean;
}

/** Fills description, price & category — name stays manual. */
export function AiProductFillButton({
  productName,
  businessName,
  existingCategories,
  onFill,
  disabled,
}: AiProductFillButtonProps) {
  const [loading, setLoading] = useState(false);
  const { canUseAi, loaded } = useEntitlements();
  const businessId = useSubscriptionEntitlementsStore((s) => s.businessId);

  const run = async () => {
    if (!canUseAi) {
      toast.info('Upgrade your plan to use AI');
      return;
    }
    if (!productName.trim()) {
      toast.error('Enter product name first');
      return;
    }
    setLoading(true);
    try {
      const result = await generateProductFill({
        name: productName.trim(),
        businessName,
        existingCategories: existingCategories.join(', '),
        businessId: businessId ?? undefined,
      });
      onFill({
        description: result.description,
        price: result.suggestedPrice,
        categoryName: result.suggestedCategory,
      });
      toast.success('AI filled description, price & category');
    } catch (error) {
      toast.error(getErrorMessage(error, 'AI fill failed'));
    } finally {
      setLoading(false);
    }
  };

  if (loaded && !canUseAi) {
    return (
      <Link
        to="/dashboard/subscription"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        <Lock className="h-4 w-4" />
        Auto-fill with AI — upgrade plan
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={run}
      disabled={disabled || loading || !productName.trim()}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="ai-shimmer group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-brand-200/60 bg-gradient-to-r from-brand-50 via-white to-accent-50 px-4 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-shadow hover:shadow-md hover:shadow-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-slate-900 dark:to-accent-500/10 dark:text-brand-300"
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is thinking…
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600 group-hover:animate-pulse dark:text-brand-400" />
            Auto-fill with AI
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(description, price, category)</span>
            <Wand2 className="h-3.5 w-3.5 opacity-60" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
