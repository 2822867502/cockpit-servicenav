/**
 * Development-only mock of the Cockpit global API.
 *
 * When running outside Cockpit (e.g., `npm run watch`), the real
 * `cockpit` global is not available. This mock uses browser
 * localStorage as a backing store for config persistence.
 */

const STORAGE_KEY = 'servicenav-config';

const mockCockpit = {
  localStorage: {
    getItem: (key: string): string | null => {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    setItem: (key: string, value: string): void => {
      try { localStorage.setItem(key, value); } catch { /* quota exceeded */ }
    },
    removeItem: (key: string): void => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    },
  },

  // cockpit.http() — delegates to browser fetch for icon loading in dev
  http: async (url: string, _options?: any) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return { blob: () => Promise.resolve(blob), status: response.status };
  },

  gettext: (text: string): string => text,
  locale: (_poData?: any): any => undefined,
  language: 'en',

  jump: (_path: string, _host?: string) => {
    console.log('[mock] cockpit.jump:', _path, _host);
  },
};

(window as any).cockpit = mockCockpit;
console.log('[servicenav] Dev mode: mock cockpit loaded. Config via localStorage key:', STORAGE_KEY);
