/**
 * Entry point for the servicenav Cockpit plugin.
 *
 * Bootstraps the React application inside the Cockpit shell.
 * Uses async initialization to ensure the mock/real Cockpit
 * runtime is ready before rendering.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import '@patternfly/react-core/dist/styles/base.css';
import './styles/servicenav.css';
import { initI18n } from './lib/i18n';
import App from './app';
import { ErrorBoundary } from './components/ErrorBoundary';

async function bootstrap(): Promise<void> {
  try {
    // Phase 1: load mock if running outside Cockpit
    if (typeof (window as any).cockpit === 'undefined') {
      await import('./lib/mockCockpit');
    }

    // Phase 2: sync dark-mode theme from parent Cockpit BEFORE first render.
    // Cockpit may use pf-theme-dark (PF5) or pf-v6-theme-dark (PF6).
    // We must check for both and sync to our iframe's <html>.
    function syncTheme() {
      try {
        const parentCls = window.parent.document.documentElement.classList;
        const isDark = parentCls.contains('pf-theme-dark') || parentCls.contains('pf-v6-theme-dark');
        document.documentElement.classList.toggle('pf-theme-dark', isDark);
      } catch (_) { /* cross-origin */ }
    }
    syncTheme();
    try {
      const observer = new MutationObserver(syncTheme);
      observer.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch (_) { /* cross-origin */ }

    // Phase 3: initialize language BEFORE any component calls _()
    initI18n();

    // Phase 4: render
    const container = document.getElementById('root');
    if (!container) {
      console.error('[servicenav] #root element not found.');
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
  } catch (err) {
    console.error('[servicenav] bootstrap failed:', err);
    try {
      const container = document.getElementById('root');
      if (container) {
        container.innerHTML =
          '<div style="padding:2rem;text-align:center;color:#c00;font-family:sans-serif">' +
          '<h3>服务导航插件加载失败 / Service Navigation plugin failed to load</h3>' +
          '<pre style="text-align:left;font-size:12px;max-width:600px;margin:0 auto">' +
          (err instanceof Error ? err.message : String(err)) +
          '</pre></div>';
      }
    } catch (_) { /* last resort */ }
  }
}

// Defer to next tick so Cockpit shell has fully initialized cockpit.* APIs
setTimeout(bootstrap, 0);
