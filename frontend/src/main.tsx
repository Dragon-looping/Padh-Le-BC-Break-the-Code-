import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Fonts
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif/400-italic.css';

// Mocks
if (import.meta.env.VITE_USE_MOCKS === 'true') {
  const { enableMocks } = await import('./mocks/index');
  enableMocks();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
