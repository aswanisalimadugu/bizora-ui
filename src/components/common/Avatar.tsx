import { initials } from '../../utils/format';

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: Size;
  className?: string;
}

/** Circular avatar: shows image when available, otherwise gradient initials. */
export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 ${className}`}
      />
    );
  }
  return (
    <span
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 font-semibold text-white shadow-sm ${className}`}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
