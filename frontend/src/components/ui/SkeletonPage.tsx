// Skeleton page — shown while lazy route chunks load
export default function SkeletonPage() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      aria-label="Loading…"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated cut line */}
        <div
          className="w-px h-16"
          style={{ backgroundColor: 'var(--orange)', opacity: 0.4 }}
        />
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: 'var(--silver)' }}
        >
          Loading…
        </span>
      </div>
    </div>
  );
}
