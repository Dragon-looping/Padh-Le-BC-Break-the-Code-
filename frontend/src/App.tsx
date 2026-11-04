import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { WorkspaceProvider } from './app/WorkspaceContext';
import { MotionProvider } from './app/MotionContext';
import PageShell from './components/layout/PageShell';
import ErrorBoundary from './components/layout/ErrorBoundary';
import SkeletonPage from './components/ui/SkeletonPage';

// Lazy route modules
const Landing = lazy(() => import('./pages/Landing'));
const LabIndex = lazy(() => import('./pages/LabIndex'));
const AlgorithmDetail = lazy(() => import('./pages/AlgorithmDetail'));
const Datasets = lazy(() => import('./pages/Datasets'));
const DatasetProfile = lazy(() => import('./pages/DatasetProfile'));
const DatasetConfigure = lazy(() => import('./pages/DatasetConfigure'));
const Arena = lazy(() => import('./pages/Arena'));
const Advisor = lazy(() => import('./pages/Advisor'));
const Studio = lazy(() => import('./pages/Studio'));
const Results = lazy(() => import('./pages/Results'));
const Report = lazy(() => import('./pages/Report'));
const NotFound = lazy(() => import('./pages/NotFound'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <PageShell />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <Landing />
          </Suspense>
        ),
      },
      {
        path: 'lab',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <LabIndex />
          </Suspense>
        ),
      },
      {
        path: 'lab/:algorithm',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <AlgorithmDetail />
          </Suspense>
        ),
      },
      {
        path: 'datasets',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <Datasets />
          </Suspense>
        ),
      },
      {
        path: 'datasets/:id',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <DatasetProfile />
          </Suspense>
        ),
      },
      {
        path: 'datasets/:id/configure',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <DatasetConfigure />
          </Suspense>
        ),
      },
      {
        path: 'arena/:datasetId',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <Arena />
          </Suspense>
        ),
      },
      {
        path: 'advisor/:experimentId',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <Advisor />
          </Suspense>
        ),
      },
      {
        path: 'studio/:experimentId',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <Studio />
          </Suspense>
        ),
      },
      {
        path: 'results/:experimentId',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <Results />
          </Suspense>
        ),
      },
      {
        path: 'results/:experimentId/report',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <Report />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<SkeletonPage />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);

export default function App() {
  return (
    <MotionProvider>
      <WorkspaceProvider>
        <RouterProvider router={router} />
      </WorkspaceProvider>
    </MotionProvider>
  );
}
