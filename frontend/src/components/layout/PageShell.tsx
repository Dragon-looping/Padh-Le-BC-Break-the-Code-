import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import WorkflowRail from './WorkflowRail';
import CutTransition from './CutTransition';
import SampleDataBadge from '../ui/SampleDataBadge';

export default function PageShell() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Workflow Rail — hidden on landing */}
      {!isLanding && <WorkflowRail />}

      <main id="main-content" className="flex-1">
        <AnimatePresence mode="wait">
          <CutTransition key={location.pathname}>
            <Outlet />
          </CutTransition>
        </AnimatePresence>
      </main>

      {/* Sample data badge — always visible when mocks are active */}
      {import.meta.env.VITE_USE_MOCKS === 'true' && <SampleDataBadge />}
    </div>
  );
}
