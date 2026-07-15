import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../common/ThemeToggle';
import { AiAssistant } from '../common/AiAssistant';
import { Avatar } from '../common/Avatar';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
  showAi?: boolean;
}

export function Navbar({ title, subtitle, onMenuClick, actions, showAi = true }: NavbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {showAi && <AiAssistant />}
          <ThemeToggle />
          <div className="pl-1 lg:hidden">
            <Avatar name={user?.name} size="md" />
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
    </header>
  );
}
