/**
 * Development-only mock of the Cockpit global API.
 *
 * When running outside the Cockpit shell (e.g., during `npm run watch` development),
 * the real `cockpit` global is not available. This mock provides the minimal API
 * surface needed by the plugin, using localStorage as a backing store for config.
 *
 * This file is NOT included in production builds or test runs.
 * Tests use their own mock in test/__mocks__/cockpit.ts.
 */

import type { ServicenavConfig } from './types';
import { createDefaultConfig } from './config';

const STORAGE_KEY = 'cockpit-servicenav-mock-config';

// -- Mock cockpit.file() implementation using localStorage --

interface MockFileHandle {
  read: () => Promise<[any, string]>;
  replace: (content: any, expectedTag?: string) => Promise<string>;
  modify: (callback: (current: any) => any, initial?: any, initialTag?: string) => Promise<[any, string]>;
  watch: (callback: (content: any) => void) => { remove: () => void };
  path: string;
}

function createMockFile(path: string): MockFileHandle {
  let tag = '0';

  function getStored(): ServicenavConfig | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setStored(config: ServicenavConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function nextTag(): string {
    tag = String(parseInt(tag, 10) + 1);
    return tag;
  }

  const watchers: Array<(content: any) => void> = [];

  function notify(content: ServicenavConfig | null): void {
    watchers.forEach((cb) => cb(content));
  }

  return {
    path,

    read(): Promise<[any, string]> {
      const content = getStored();
      if (content === null) {
        return Promise.resolve([null, '-']);
      }
      return Promise.resolve([content, tag]);
    },

    replace(content: any, expectedTag?: string): Promise<string> {
      if (expectedTag !== undefined && expectedTag !== tag) {
        const err = new Error('Configuration was modified by another session.');
        (err as any).problem = 'change-conflict';
        return Promise.reject(err);
      }
      if (content === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setStored(content);
      }
      const newTag = nextTag();
      notify(content);
      return Promise.resolve(newTag);
    },

    modify(
      callback: (current: any) => any,
      initial?: any,
      _initialTag?: string
    ): Promise<[any, string]> {
      let current = getStored();
      if (current === null) {
        current = initial || createDefaultConfig();
      }
      const updated = callback(current);
      if (updated === undefined) {
        return Promise.resolve([current, tag]);
      }
      setStored(updated);
      const newTag = nextTag();
      notify(updated);
      return Promise.resolve([updated, newTag]);
    },

    watch(callback: (content: any) => void): { remove: () => void } {
      watchers.push(callback);
      // Immediately notify with current content
      const content = getStored();
      if (content !== null) {
        setTimeout(() => callback(content), 0);
      }
      return {
        remove(): void {
          const idx = watchers.indexOf(callback);
          if (idx >= 0) watchers.splice(idx, 1);
        },
      };
    },
  };
}

// -- Mock cockpit global --

const mockCockpit = {
  file: (path: string, _options?: any) => createMockFile(path),

  gettext: (text: string): string => text, // Identity (no translation in dev)

  locale: (_poData: any): void => {
    // No-op in dev mode
  },

  language: 'en',

  location: {
    path: [] as string[],
    options: {} as Record<string, any>,
    href: '',
    go: (_path: any, _options?: any) => {},
    replace: (_path: any, _options?: any) => {},
    decode: (_href: string, _options?: any) => ([] as string[]),
    encode: (_path: any, _options?: any) => '',
  },

  jump: (_path: string, _host?: string) => {
    console.log('[mock] cockpit.jump:', _path, _host);
  },

  hidden: false,
};

// Install mock globally
(window as any).cockpit = mockCockpit;

console.log('[servicenav] Dev mode: mock cockpit API loaded. Config stored in localStorage.');
