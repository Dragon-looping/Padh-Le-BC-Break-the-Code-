// Skeleton bar — hatched silver shimmer for loading states
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({ width = '100%', height = '1rem', className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height, backgroundColor: 'var(--silver-light)' }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(174,180,191,0.3) 4px, rgba(174,180,191,0.3) 8px)',
          animation: 'skeleton-shimmer 1.5s linear infinite',
        }}
      />
      <style>{`
        @keyframes skeleton-shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer { animation: none; }
        }
      `}</style>
    </div>
  );
}
