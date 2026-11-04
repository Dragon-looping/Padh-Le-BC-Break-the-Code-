interface ChipProps {
  label: string;
  color?: 'default' | 'cobalt' | 'lime' | 'orange' | 'blush' | 'error';
  size?: 'sm' | 'md';
}

const colorStyles = {
  default: { backgroundColor: 'var(--paper-2)', color: 'var(--ink)', border: '1px solid var(--silver-light)' },
  cobalt: { backgroundColor: 'var(--cobalt)', color: 'var(--paper)', border: 'none' },
  lime: { backgroundColor: 'var(--lime)', color: 'var(--ink)', border: '1.5px solid var(--ink)' },
  orange: { backgroundColor: 'var(--orange)', color: 'var(--ink)', border: 'none' },
  blush: { backgroundColor: 'var(--blush)', color: 'var(--ink)', border: 'none' },
  error: { backgroundColor: 'rgba(196,33,15,0.1)', color: 'var(--error)', border: '1px solid var(--error)' },
} as const;

export default function Chip({ label, color = 'default', size = 'md' }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center font-mono uppercase tracking-wider rounded-full whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
      ].join(' ')}
      style={colorStyles[color]}
    >
      {label}
    </span>
  );
}
