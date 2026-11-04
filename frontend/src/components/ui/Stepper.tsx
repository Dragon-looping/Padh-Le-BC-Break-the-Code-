interface StepperProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  id?: string;
}

export default function Stepper({ min, max, step = 1, value, onChange, label, id }: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-xs uppercase tracking-wider"
        style={{ color: 'var(--ink)' }}
      >
        {label}
      </label>
      <div className="flex items-center gap-0 border" style={{ borderColor: 'var(--ink)' }}>
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="w-9 h-9 font-mono text-lg flex items-center justify-center transition-opacity disabled:opacity-30 hover:bg-[var(--paper-2)]"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-16 h-9 text-center font-mono text-sm tabular-nums border-x bg-transparent"
          style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
          aria-label={label}
        />
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="w-9 h-9 font-mono text-lg flex items-center justify-center transition-opacity disabled:opacity-30 hover:bg-[var(--paper-2)]"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
