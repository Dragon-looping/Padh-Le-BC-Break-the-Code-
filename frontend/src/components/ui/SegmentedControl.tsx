interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label}>
      <div
        className="inline-flex border"
        style={{ borderColor: 'var(--ink)' }}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className="font-mono text-xs uppercase tracking-wider px-3 py-2 transition-colors"
              style={{
                backgroundColor: active ? 'var(--orange)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink)',
                borderRight: '1px solid var(--ink)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
