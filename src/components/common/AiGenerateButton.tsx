import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { generateContent } from '../../api/aiApi';
import type { AiType } from '../../api/aiApi';
import { useEntitlements, useSubscriptionEntitlementsStore } from '../../store/subscriptionEntitlementsStore';
import { getErrorMessage } from '../../utils/format';

interface AiGenerateButtonProps {
  type: AiType;
  params: Record<string, string | number | undefined>;
  onResult: (text: string) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function AiGenerateButton({
  type,
  params,
  onResult,
  disabled,
  label = 'Generate with AI',
  size = 'sm',
}: AiGenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const { canUseAi, loaded } = useEntitlements();
  const businessId = useSubscriptionEntitlementsStore((s) => s.businessId);

  const run = async () => {
    if (!canUseAi) {
      toast.info('Upgrade your plan to use AI');
      return;
    }
    setLoading(true);
    try {
      const text = await generateContent(type, {
        ...params,
        businessId: params.businessId ?? businessId ?? undefined,
      }, businessId ?? undefined);
      onResult(text);
      toast.success('Generated with AI');
    } catch (error) {
      toast.error(getErrorMessage(error, 'AI generation failed'));
    } finally {
      setLoading(false);
    }
  };

  const pad = size === 'md' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs';

  if (loaded && !canUseAi) {
    return (
      <Link
        to="/dashboard/subscription"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 ${pad}`}
      >
        <Lock className="h-3.5 w-3.5" />
        AI · Upgrade
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={run}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`ai-shimmer relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 font-semibold text-white shadow-md shadow-brand-600/25 disabled:cursor-not-allowed disabled:opacity-60 ${pad}`}
    >
      <Sparkles className={`${loading ? 'animate-spin' : ''} h-3.5 w-3.5`} />
      {loading ? 'Generating…' : label}
      {!loading && <Wand2 className="h-3 w-3 opacity-80" />}
    </motion.button>
  );
}
