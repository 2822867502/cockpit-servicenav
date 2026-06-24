/**
 * Entry point for the servicenav Cockpit plugin.
 *
 * Bootstraps the React application inside the Cockpit shell.
 * Uses async bootstrap to ensure the mock Cockpit layer is loaded
 * before App renders in development mode.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Import PatternFly base styles
import '@patternfly/react-core/dist/styles/base.css';

// Import plugin-specific styles
import './styles/servicenav.css';

// Import i18n (initializes language detection)
import { initI18n } from './lib/i18n';

// Static import — no React.lazy, to avoid race conditions with esbuild IIFE bundling
import App from './app';
import { ErrorBoundary } from './components/ErrorBoundary';

async function bootstrap(): Promise<void> {
  // In development mode (no Cockpit shell), load the mock layer before rendering.
  // The mock provides a localStorage-backed implementation of cockpit.file() etc.
  // This MUST complete before App mounts, because useServices immediately calls
  // cockpit.file() on mount.
  if (typeof (window as any).cockpit === 'undefined') {
    await import('./lib/mockCockpit');
    console.log('[servicenav] Mock cockpit loaded for development.');
  }

  // Initialize i18n (detects language from cockpit.language or navigator.language)
  initI18n();

  // Render the app
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } else {
    console.error('[servicenav] Root element not found. Cannot mount React app.');
  }
}

bootstrap();
