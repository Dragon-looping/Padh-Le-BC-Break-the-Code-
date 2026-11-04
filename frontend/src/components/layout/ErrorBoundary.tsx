import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();
  let message = 'Something went wrong.';
  let status: number | null = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message = error.statusText || error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
    >
      {/* Cut device */}
      <div className="w-px h-20 mb-8" style={{ backgroundColor: 'var(--orange)' }} aria-hidden />

      <span className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--silver)' }}>
        Error {status ?? '—'}
      </span>
      <h1 className="font-display font-bold text-4xl md:text-6xl uppercase tracking-tight mb-4 text-center">
        {status === 404 ? 'Not Found' : 'Something broke'}
      </h1>
      <p className="font-sans text-base mb-8 max-w-md text-center" style={{ color: 'var(--silver)' }}>
        {message}
      </p>

      <Link
        to="/"
        className="font-mono text-xs uppercase tracking-wider px-6 py-3 border border-current transition-opacity hover:opacity-70"
        style={{ color: 'var(--ink)' }}
      >
        Back to the Bench
      </Link>
    </div>
  );
}
