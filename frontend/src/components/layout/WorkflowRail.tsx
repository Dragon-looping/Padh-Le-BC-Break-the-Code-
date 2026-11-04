import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../app/WorkspaceContext';

const STATIONS = [
  { id: 'lab', label: 'Lab', subLabel: 'SPECIMENS', path: '/lab', requires: null },
  { id: 'datasets', label: 'Datasets', subLabel: 'SPECIMENS', path: '/datasets', requires: null },
  { id: 'arena', label: 'Arena', subLabel: 'STARTING GRID', path: null, requires: 'dataset' },
  { id: 'advisor', label: 'Advisor', subLabel: 'THE VERDICT', path: null, requires: 'experiment' },
  { id: 'studio', label: 'Studio', subLabel: 'CONTROL SURFACE', path: null, requires: 'experiment' },
  { id: 'results', label: 'Results', subLabel: 'THE READOUT', path: null, requires: 'experiment' },
] as const;

type StationId = typeof STATIONS[number]['id'];

function getStationPath(
  station: typeof STATIONS[number],
  ws: { activeDatasetId: string | null; activeExperimentId: string | null }
): string | null {
  if (station.path) return station.path;
  if (station.id === 'arena' && ws.activeDatasetId) return `/arena/${ws.activeDatasetId}`;
  if (station.id === 'advisor' && ws.activeExperimentId) return `/advisor/${ws.activeExperimentId}`;
  if (station.id === 'studio' && ws.activeExperimentId) return `/studio/${ws.activeExperimentId}`;
  if (station.id === 'results' && ws.activeExperimentId) return `/results/${ws.activeExperimentId}`;
  return null;
}

function isStationAvailable(
  station: typeof STATIONS[number],
  ws: { activeDatasetId: string | null; activeExperimentId: string | null }
): boolean {
  if (!station.requires) return true;
  if (station.requires === 'dataset') return !!ws.activeDatasetId;
  if (station.requires === 'experiment') return !!ws.activeExperimentId;
  return false;
}

function getActiveStation(pathname: string): StationId | null {
  if (pathname.startsWith('/lab')) return 'lab';
  if (pathname.startsWith('/datasets')) return 'datasets';
  if (pathname.startsWith('/arena')) return 'arena';
  if (pathname.startsWith('/advisor')) return 'advisor';
  if (pathname.startsWith('/studio')) return 'studio';
  if (pathname.startsWith('/results')) return 'results';
  return null;
}

export default function WorkflowRail() {
  const location = useLocation();
  const navigate = useNavigate();
  const ws = useWorkspace();
  const [indexOpen, setIndexOpen] = useState(false);
  const activeStation = getActiveStation(location.pathname);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: 'var(--paper)', borderColor: 'var(--ink)' }}
      >
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 flex items-center gap-6 h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="PADH LE BC — Home">
            <LogoMark />
            <span
              className="font-display font-bold text-sm tracking-tight uppercase hidden sm:block"
              style={{ color: 'var(--ink)' }}
            >
              PADH LE BC
            </span>
          </Link>

          {/* Station rail */}
          <nav aria-label="Workflow stations" className="flex-1 overflow-x-auto">
            <ol className="flex items-center gap-0 min-w-max">
              {STATIONS.map((station, idx) => {
                const available = isStationAvailable(station, ws);
                const path = getStationPath(station, ws);
                const isActive = activeStation === station.id;
                const isFirst = idx === 0;

                return (
                  <li key={station.id} className="flex items-center">
                    {!isFirst && (
                      <div
                        className="w-6 h-px mx-1"
                        style={{ backgroundColor: available ? 'var(--ink)' : 'var(--silver-light)' }}
                        aria-hidden
                      />
                    )}
                    <StationNode
                      label={station.label}
                      subLabel={station.subLabel}
                      isActive={isActive}
                      available={available}
                      path={path}
                      disabledReason={
                        !available
                          ? station.requires === 'dataset'
                            ? 'Upload a dataset first'
                            : 'Run an experiment first'
                          : undefined
                      }
                      onClick={path ? () => navigate(path) : undefined}
                    />
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Context chip */}
          {(ws.activeDatasetId || ws.activeExperimentId) && (
            <div
              className="hidden md:flex items-center gap-1 px-2 py-1 border text-xs font-mono shrink-0"
              style={{ borderColor: 'var(--silver)', color: 'var(--ink)' }}
            >
              {ws.datasetName && (
                <span className="truncate max-w-[100px]">{ws.datasetName}</span>
              )}
              {ws.activeExperimentId && (
                <span style={{ color: 'var(--silver)' }}>·</span>
              )}
              {ws.activeExperimentId && (
                <span className="truncate max-w-[80px]" style={{ color: 'var(--silver)' }}>
                  {ws.activeExperimentId.slice(-6)}
                </span>
              )}
            </div>
          )}

          {/* Index button */}
          <button
            className="ml-auto shrink-0 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3 py-2 border transition-colors"
            style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
            onClick={() => setIndexOpen(true)}
            aria-expanded={indexOpen}
            aria-label="Open site index"
          >
            <span>Index</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <line x1="1" y1="3" x2="11" y2="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" />
              <line x1="1" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Index overlay */}
      <AnimatePresence>
        {indexOpen && (
          <IndexOverlay onClose={() => setIndexOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Station node ─────────────────────────────────────────────────────────────
function StationNode({
  label,
  subLabel,
  isActive,
  available,
  path,
  disabledReason,
  onClick,
}: {
  label: string;
  subLabel: string;
  isActive: boolean;
  available: boolean;
  path: string | null;
  disabledReason?: string;
  onClick?: () => void;
}) {
  const content = (
    <span className="flex flex-col items-center gap-0.5 px-2 py-1 group/node">
      {/* Circle */}
      <span
        className="w-3 h-3 rounded-full border-[1.5px] transition-colors"
        style={{
          backgroundColor: isActive ? 'var(--orange)' : available ? 'transparent' : 'transparent',
          borderColor: isActive
            ? 'var(--orange)'
            : available
            ? 'var(--ink)'
            : 'var(--silver-light)',
        }}
        aria-hidden
      />
      {/* Label */}
      <span
        className="text-[10px] font-mono uppercase tracking-wider hidden md:block"
        style={{
          color: isActive ? 'var(--orange)' : available ? 'var(--ink)' : 'var(--silver)',
        }}
      >
        {label}
      </span>
    </span>
  );

  if (!available) {
    return (
      <span
        title={disabledReason}
        aria-disabled="true"
        aria-label={`${label} — ${disabledReason}`}
        className="cursor-not-allowed"
      >
        {content}
      </span>
    );
  }

  if (path) {
    return (
      <Link to={path} aria-current={isActive ? 'page' : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} aria-current={isActive ? 'page' : undefined}>
      {content}
    </button>
  );
}

// ─── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      {/* Cobalt left half */}
      <rect x="0" y="0" width="13" height="28" fill="#1E3CFF" />
      {/* Lime right half */}
      <rect x="15" y="0" width="13" height="28" fill="#C6F432" stroke="#0A1033" strokeWidth="1" />
      {/* Orange cut line */}
      <rect x="13" y="0" width="2" height="28" fill="#FF5B1F" />
    </svg>
  );
}

// ─── Index overlay ────────────────────────────────────────────────────────────
const INDEX_LINKS = [
  { label: 'Learning Lab', sub: 'SPECIMENS', href: '/lab' },
  { label: 'Datasets', sub: 'FEED IT A CSV', href: '/datasets' },
  { label: 'Model Arena', sub: 'STARTING GRID', href: '/arena' },
  { label: 'Model Advisor', sub: 'THE VERDICT', href: '/advisor' },
  { label: 'Studio', sub: 'CONTROL SURFACE', href: '/studio' },
  { label: 'Results', sub: 'THE READOUT', href: '/results' },
];

function IndexOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Site index"
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: 'var(--orange)' }}
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.5, ease: [0.77, 0, 0.18, 1] }}
      onKeyDown={handleKeyDown}
    >
      {/* Close button */}
      <div className="flex justify-end p-6">
        <button
          onClick={onClose}
          className="font-mono text-xs uppercase tracking-wider px-4 py-2 border border-current"
          style={{ color: 'var(--ink)' }}
          autoFocus
          aria-label="Close index"
        >
          Close ×
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 flex flex-col justify-center px-10 md:px-20 gap-2">
        {INDEX_LINKS.map((link, idx) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.26 }}
          >
            <button
              className="flex flex-col items-start group w-full text-left"
              onClick={() => { navigate(link.href); onClose(); }}
            >
              <span
                className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
                style={{ color: 'var(--ink)', opacity: 0.6 }}
              >
                {link.sub}
              </span>
              <span
                className="font-display font-bold uppercase text-4xl md:text-6xl leading-none tracking-tight transition-opacity group-hover:opacity-70"
                style={{ color: 'var(--ink)' }}
              >
                {link.label}
              </span>
            </button>
          </motion.div>
        ))}
      </nav>

      {/* Hairline footer */}
      <div className="px-10 md:px-20 py-6 border-t" style={{ borderColor: 'var(--ink)', opacity: 0.3 }}>
        <span className="font-mono text-xs" style={{ color: 'var(--ink)' }}>
          PADH LE BC — Break the Code
        </span>
      </div>
    </motion.div>
  );
}
