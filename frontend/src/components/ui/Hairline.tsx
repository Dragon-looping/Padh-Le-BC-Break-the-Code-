interface HairlineProps {
  label?: string;
  index?: string;
  className?: string;
}

/** A thin 1px ink rule with optional label and margin index number */
export default function Hairline({ label, index, className = '' }: HairlineProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {index && (
        <span
          className="font-mono text-[10px] tabular-nums shrink-0"
          style={{ color: 'var(--silver)' }}
        >
          {index}
        </span>
      )}
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--ink)' }} aria-hidden />
      {label && (
        <>
          {/* Orange tick mark */}
          <span
            className="w-1 h-2.5 shrink-0"
            style={{ backgroundColor: 'var(--orange)' }}
            aria-hidden
          />
          <span
            className="font-mono text-[10px] uppercase tracking-widest shrink-0"
            style={{ color: 'var(--silver)' }}
          >
            {label}
          </span>
        </>
      )}
    </div>
  );
}
