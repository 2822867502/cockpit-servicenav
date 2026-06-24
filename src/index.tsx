/**
 * Entry point for the servicenav Cockpit plugin.
 *
 * Bootstraps the React application inside the Cockpit shell.
 * In development mode (no Cockpit runtime), loads the mock layer
 * so the plugin can be developed and tested standalone.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Import PatternFly base styles
import '@patternfly/react-core/dist/styles/base.css';

// Import plugin-specific styles
import './styles/servicenav.css';

// Import i18n (initializes _() globally)
import './lib/i18n';

// Import mock cockpit for development
// In production, cockpit is loaded by the shell before this script runs
if (typeof (window as any).cockpit === 'undefined') {
  import('./lib/mockCockpit').then(() => {
    console.log('[servicenav] Mock cockpit loaded for development.');
  });
}

// Lazy-load App to ensure mock is initialized first
const App = React.lazy(() => import('./app'));

// Render
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <React.Suspense
        fallback={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            Loading Service Navigation...
          </div>
        }
      >
        <App />
      </React.Suspense>
    </React.StrictMode>
  );
} else {
  console.error('[servicenav] Root element not found. Cannot mount React app.');
}
