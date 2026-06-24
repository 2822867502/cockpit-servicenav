/**
 * Entry point for the servicenav Cockpit plugin.
 *
 * Bootstraps the React application inside the Cockpit shell.
 * Uses async bootstrap to ensure the mock layer is loaded
 * before App renders in development mode.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Import PatternFly base styles
import '@patternfly/react-core/dist/styles/base.css';

// Import plugin-specific styles
import './styles/servicenav.css';

// Import i18n (initI18n called explicitly in bootstrap)
import { initI18n } from './lib/i18n';

// Static import — no React.lazy
import App from './app';
import { ErrorBoundary } from './components/ErrorBoundary';

async function bootstrap(): Promise<void> {
  try {
    // ---- Phase 1: Initialize mock (dev only) ----
    if (typeof (window as any).cockpit === 'undefined') {
      console.log('[servicenav] No cockpit runtime detected — loading mock.');
      await import('./lib/mockCockpit');
      console.log('[servicenav] Mock cockpit loaded; config stored in localStorage.');
    }

    // ---- Phase 2: Initialize i18n BEFORE rendering ----
    // This must run before any component calls _()
    initI18n();

    // ---- Phase 3: Diagnostic — verify data safety ----
    // Check cockpit global structure
    const ck = (window as any).cockpit;
    console.log('[servicenav] cockpit available:', !!ck);
    console.log('[servicenav] cockpit.file available:', !!(ck && ck.file));
    console.log('[servicenav] cockpit.http available:', !!(ck && ck.http));

    // ---- Phase 4: Render ----
    const container = document.getElementById('root');
    if (!container) {
      console.error('[servicenav] FATAL: #root element not found.');
      return;
    }

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('[servicenav] App rendered successfully.');
  } catch (err) {
    // Last-resort catch — log diagnostic info before crashing
    console.error('[servicenav] FATAL: bootstrap failed:', err);
    if (err instanceof TypeError) {
      console.error('[servicenav] TypeError details:', {
        message: err.message,
        stack: err.stack?.slice(0, 500),
      });
    }
    // Try to show a fallback message in the DOM
    try {
      const container = document.getElementById('root');
      if (container) {
        container.innerHTML =
          '<div style="padding:2rem;text-align:center;color:red">' +
          '<h3>服务导航插件加载失败</h3>' +
          '<p>Service Navigation plugin failed to load.</p>' +
          '<pre style="text-align:left;font-size:12px">' +
          (err instanceof Error ? err.message : String(err)) +
          '</pre></div>';
      }
    } catch (_domErr) {
      // Nothing more we can do
    }
  }
}

// Start the bootstrap process.
// Wrap in setTimeout to ensure the Cockpit shell has fully initialized
// before we access cockpit.* APIs.
setTimeout(() => {
  bootstrap();
}, 0);
