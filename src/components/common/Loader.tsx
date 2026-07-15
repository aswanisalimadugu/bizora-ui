import { Loader2 } from 'lucide-react';

interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function Loader({ label = 'Loading...', fullScreen = false }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        {content}
      </div>
    );
  }
  return <div className="flex w-full items-center justify-center py-16">{content}</div>;
}
