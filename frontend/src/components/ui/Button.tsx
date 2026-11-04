import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const styles = {
  primary: {
    backgroundColor: 'var(--cobalt)',
    color: 'var(--paper)',
    border: '1px solid var(--cobalt)',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--ink)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--ink)',
    border: 'none',
  },
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-xs',
  lg: 'px-7 py-3.5 text-sm',
} as const;

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        'relative overflow-hidden font-mono uppercase tracking-wider transition-all',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        sizes[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-[3px_3px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        className,
      ].join(' ')}
      style={styles[variant]}
    >
      {/* Split-fill hover effect via pseudo-element (pure CSS) */}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
