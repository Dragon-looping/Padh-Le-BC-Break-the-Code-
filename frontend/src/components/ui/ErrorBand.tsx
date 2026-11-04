import type { ApiError } from '../../api/types';

interface ErrorBandProps {
  error: ApiError | null;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorBand({ error, onRetry, className = '' }: ErrorBandProps) {
  if (!error) return null;

  return (
    <div
      className={`border-l-4 p-4 ${className}`}
      style={{
        borderLeftColor: 'var(--error)',
        backgroundColor: 'rgba(196,33,15,0.06)',
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Orange hatch pattern */}
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 mt-0.5">
          <circle cx="10" cy="10" r="9" stroke="var(--error)" strokeWidth="1.5" />
          <line x1="10" y1="6" x2="10" y2="11" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="14" r="1" fill="var(--error)" />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {error.message}
          </p>

          {error.kind === 'network' && (
            <p className="font-mono text-xs mt-1" style={{ color: 'var(--silver)' }}>
              Check your connection and try again.
            </p>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="font-mono text-xs uppercase tracking-wider mt-3 px-3 py-1.5 border border-current transition-opacity hover:opacity-70"
              style={{ color: 'var(--ink)' }}
            >
              Retry
            </button>
          )}

          {/* Collapsible technical details */}
          {Boolean(error.details) && (
            <details className="mt-2">
              <summary
                className="font-mono text-xs cursor-pointer"
                style={{ color: 'var(--silver)' }}
              >
                Technical details
              </summary>
              <pre
                className="font-mono text-xs mt-1 overflow-x-auto p-2"
                style={{ backgroundColor: 'var(--paper-2)', color: 'var(--ink)' }}
              >
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
