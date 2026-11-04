// 404 Not Found page
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
    >
      <div className="w-px h-20 mb-8" style={{ backgroundColor: 'var(--orange)' }} aria-hidden />
      <span className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--silver)' }}>
        404
      </span>
      <h1
        className="font-display font-bold uppercase text-5xl md:text-8xl tracking-tight mb-4 text-center"
        style={{ color: 'var(--ink)' }}
      >
        Not Found
      </h1>
      <p className="font-sans text-sm mb-8 max-w-sm text-center" style={{ color: 'var(--silver)' }}>
        This page doesn't exist. The cut went the wrong way.
      </p>
      <Link
        to="/"
        className="font-mono text-xs uppercase tracking-wider px-6 py-3 border border-current transition-opacity hover:opacity-70"
        style={{ color: 'var(--cobalt)', borderColor: 'var(--cobalt)' }}
      >
        Back to the Bench
      </Link>
    </div>
  );
}
