import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { runAiCommand } from '../../api/aiApi';
import type { AiCommandResult } from '../../api/aiApi';
import { getCategories } from '../../api/productApi';
import { useAiContext, getContextSuggestions } from '../../hooks/useAiContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useBusinessStore } from '../../store/businessStore';
import { executeAiCommand, parseLocalAiCommand } from '../../utils/executeAiCommand';
import { getErrorMessage } from '../../utils/format';
import { easeOut } from './Motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AiAssistant() {
  const navigate = useNavigate();
  const context = useAiContext();
  const { activeBusiness, refresh } = useBusinessStore();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const { listening, supported, startListening, stopListening } = useVoiceInput('en-IN');

  const suggestions = getContextSuggestions(context.page, context.hasBusiness);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 180);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePanel();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = (role: ChatMessage['role'], text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  };

  const closePanel = useCallback(() => {
    setOpen(false);
    setPrompt('');
    stopListening();
  }, [stopListening]);

  const runCommand = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setPrompt('');
      addMessage('user', trimmed);
      setLoading(true);

      try {
        let existingCategories = context.existingCategories;
        if (activeBusiness?.id && !existingCategories) {
          const cats = await getCategories(activeBusiness.id);
          existingCategories = cats.map((c) => c.name).join(', ');
        }

        let result: AiCommandResult;
        try {
          result = await runAiCommand(trimmed, {
            ...context,
            existingCategories,
          });
        } catch (apiError) {
          const local = parseLocalAiCommand(trimmed);
          if (!local) throw apiError;
          result = {
            reply: 'Got it — creating that for you now.',
            action: local,
          };
        }

        const reply = (result.reply || 'Done.').replace(/\*\*/g, '');
        addMessage('assistant', reply);

        const outcome = await executeAiCommand(result, {
          navigate,
          businessId: activeBusiness?.id,
          refreshBusiness: refresh,
          prompt: trimmed,
        });

        if (outcome.shouldClose) {
          setTimeout(() => closePanel(), 600);
        }
      } catch (error) {
        const msg = getErrorMessage(error, 'AI command failed');
        addMessage('assistant', msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [loading, context, activeBusiness?.id, navigate, refresh, closePanel],
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    runCommand(prompt);
  };

  const toggleVoice = () => {
    if (listening) {
      stopListening();
      return;
    }
    startListening(
      (text) => {
        setPrompt(text);
        runCommand(text);
      },
      (msg) => toast.error(msg),
    );
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        title="AI Assistant"
        aria-label="AI Assistant"
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.96 }}
        className="relative inline-flex h-9 shrink-0 items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 px-3 text-sm font-semibold text-white shadow-md shadow-brand-600/25"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">AI</span>
      </motion.button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="ai-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[80] bg-slate-950/30 backdrop-blur-[2px]"
                  onClick={closePanel}
                  aria-hidden
                />

                <motion.div
                  key="ai-panel"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                  className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[81] flex max-h-[min(34rem,82dvh)] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22.5rem] dark:border-slate-700 dark:bg-slate-900"
                  role="dialog"
                  aria-label="AI Assistant"
                >
                  <div className="relative shrink-0 overflow-hidden px-4 pb-3.5 pt-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.25),transparent_45%)]" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-[15px] font-bold text-white">AI Assistant</h2>
                          <p className="text-[11px] text-white/75">Add products, categories & more</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={closePanel}
                        className="rounded-xl border border-white/15 bg-white/10 p-2 text-white/90 transition hover:bg-white/20"
                        aria-label="Close AI assistant"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={threadRef}
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-3.5 py-3 dark:bg-slate-950/60"
                  >
                    {messages.length === 0 && !loading && (
                      <div className="space-y-3 py-1">
                        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-3.5 py-3 dark:border-brand-800 dark:bg-brand-500/10">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Try a quick action
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Products are created instantly from your prompt.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => runCommand(s)}
                              disabled={loading}
                              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-600"
                            >
                              <span className="mr-1.5 inline-flex text-brand-500">
                                <Sparkles className="inline h-3 w-3" />
                              </span>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: easeOut }}
                          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                              m.role === 'user'
                                ? 'rounded-br-md bg-brand-600 text-white'
                                : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {m.text}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {loading && (
                      <div className="flex items-center gap-2 px-1 text-sm text-brand-600 dark:text-brand-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                        </span>
                        Creating…
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    {messages.length > 0 && (
                      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
                        {suggestions.slice(0, 2).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => runCommand(s)}
                            disabled={loading}
                            className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Add products dosa, idli…"
                        disabled={loading}
                        className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      {supported && (
                        <button
                          type="button"
                          onClick={toggleVoice}
                          disabled={loading}
                          title={listening ? 'Stop' : 'Speak'}
                          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${
                            listening
                              ? 'ai-voice-active border-rose-300 bg-rose-50 text-rose-600'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/25 transition hover:brightness-105 disabled:opacity-40"
                        aria-label="Send"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
