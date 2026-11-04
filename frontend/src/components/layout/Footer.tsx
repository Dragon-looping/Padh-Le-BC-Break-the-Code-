import { Link } from 'react-router-dom';
import { useMotion } from '../../app/MotionContext';

export default function Footer() {
  const { reducedMotion, setReducedMotion } = useMotion();

  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: 'var(--ink)', backgroundColor: 'var(--paper)' }}
    >
      {/* Oversized wordmark */}
      <div className="relative overflow-hidden px-5 md:px-10 py-8 md:py-16">
        <div className="relative">
          <h2
            className="font-display font-bold uppercase text-[12vw] leading-none tracking-tight select-none"
            style={{ color: 'var(--paper-2)' }}
            aria-hidden
          >
            BREAK THE CODE
          </h2>
          {/* Orange cut line through the wordmark */}
          <div
            className="absolute inset-y-0 left-1/2 w-px pointer-events-none"
            style={{ backgroundColor: 'var(--orange)', transform: 'translateX(-50%)' }}
            aria-hidden
          />
        </div>
      </div>

      {/* Links + motion toggle */}
      <div
        className="border-t px-5 md:px-10 py-6 flex flex-wrap gap-6 items-center justify-between"
        style={{ borderColor: 'var(--silver-light)' }}
      >
        <nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
          <Link to="/lab" className="font-mono text-xs uppercase tracking-wider hover:opacity-70">
            Lab
          </Link>
          <Link to="/datasets" className="font-mono text-xs uppercase tracking-wider hover:opacity-70">
            Datasets
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
            Motion
          </span>
          <button
            role="switch"
            aria-checked={!reducedMotion}
            onClick={() => setReducedMotion(!reducedMotion)}
            className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider"
            style={{ color: 'var(--ink)' }}
          >
            <span
              className="inline-block w-8 h-4 border border-current relative"
              style={{ borderColor: 'var(--ink)' }}
            >
              <span
                className="absolute top-0.5 bottom-0.5 w-3 transition-transform"
                style={{
                  backgroundColor: 'var(--orange)',
                  transform: reducedMotion ? 'translateX(1px)' : 'translateX(calc(100% + 1px))',
                  left: '1px',
                }}
              />
            </span>
            {reducedMotion ? 'Reduced' : 'Full'}
          </button>
        </div>

        <span className="font-mono text-xs" style={{ color: 'var(--silver)' }}>
          PADH LE BC — Break the Code
        </span>
      </div>
    </footer>
  );
}
