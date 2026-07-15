import { Mic, MicOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function VoiceInputButton({ onResult, className = '', size = 'sm' }: VoiceInputButtonProps) {
  const { listening, supported, startListening, stopListening } = useVoiceInput();

  if (!supported) return null;

  const dims = size === 'md' ? 'h-10 w-10' : 'h-9 w-9';
  const icon = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const toggle = () => {
    if (listening) {
      stopListening();
      return;
    }
    startListening(
      (text) => {
        onResult(text);
        toast.success('Voice captured');
      },
      (msg) => toast.error(msg),
    );
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop listening' : 'Speak'}
      aria-label={listening ? 'Stop voice input' : 'Start voice input'}
      className={`relative inline-flex ${dims} shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
        listening
          ? 'ai-voice-active border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400'
          : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600 dark:hover:text-brand-400'
      } ${className}`}
    >
      {listening && (
        <>
          <span className="ai-pulse-ring absolute inset-0 rounded-xl" />
          <span className="ai-pulse-ring ai-pulse-ring-delay absolute inset-0 rounded-xl" />
        </>
      )}
      {listening ? <MicOff className={`relative ${icon}`} /> : <Mic className={`relative ${icon}`} />}
    </button>
  );
}
