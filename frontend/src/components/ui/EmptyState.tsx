interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | { label: string; href: string };
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      aria-label={title}
    >
      {/* A lone data point and a dashed cut line */}
      <div className="relative mb-8 w-16 h-16 flex items-center justify-center">
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed"
          style={{ borderColor: 'var(--orange)', transform: 'translateX(-50%)' }}
          aria-hidden
        />
        <div
          className="relative z-10 w-3 h-3 rounded-full border-[1.5px]"
          style={{ backgroundColor: 'var(--paper)', borderColor: 'var(--cobalt)' }}
          aria-hidden
        />
      </div>

      <h3
        className="font-display font-bold uppercase text-xl tracking-tight mb-2"
        style={{ color: 'var(--ink)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="font-sans text-sm mb-6 max-w-xs" style={{ color: 'var(--silver)' }}>
          {description}
        </p>
      )}
      {action && (
        'href' in action ? (
          <a
            href={action.href}
            className="font-mono text-xs uppercase tracking-wider px-4 py-2.5 border border-current transition-opacity hover:opacity-70"
            style={{ color: 'var(--cobalt)' }}
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="font-mono text-xs uppercase tracking-wider px-4 py-2.5 border border-current transition-opacity hover:opacity-70"
            style={{ color: 'var(--cobalt)' }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
