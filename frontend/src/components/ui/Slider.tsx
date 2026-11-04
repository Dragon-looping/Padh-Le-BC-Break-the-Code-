interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  unlimitedOption?: boolean;
  id?: string;
}

export default function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  unlimitedOption = false,
  id,
}: SliderProps) {
  const displayValue = value ?? max;
  const isUnlimited = value === null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="font-mono text-xs uppercase tracking-wider"
          style={{ color: 'var(--ink)' }}
        >
          {label}
        </label>
        <span
          className="font-mono text-xs tabular-nums"
          style={{ color: 'var(--orange)' }}
        >
          {isUnlimited ? '∞' : displayValue}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (unlimitedOption && v === max) onChange(null);
          else onChange(v);
        }}
        className="w-full h-1 appearance-none cursor-pointer"
        style={{ accentColor: 'var(--orange)' }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={displayValue}
        aria-valuetext={isUnlimited ? 'Unlimited' : String(displayValue)}
      />

      {unlimitedOption && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${id}-unlimited`}
            checked={isUnlimited}
            onChange={(e) => onChange(e.target.checked ? null : Math.round((min + max) / 2))}
            className="cursor-pointer"
            style={{ accentColor: 'var(--orange)' }}
          />
          <label
            htmlFor={`${id}-unlimited`}
            className="font-mono text-xs uppercase tracking-wider cursor-pointer"
            style={{ color: 'var(--silver)' }}
          >
            Unlimited
          </label>
        </div>
      )}
    </div>
  );
}
