/**
 * Full mock of the Cockpit global API for testing.
 *
 * Provides in-memory config storage, identity translation,
 * and test-friendly defaults for all cockpit.* methods used by the plugin.
 */

// In-memory config storage for tests
let storedConfig: string | null = null;
let currentTag = '0';

function nextTag(): string {
  currentTag = String(parseInt(currentTag, 10) + 1);
  return currentTag;
}

export function resetMockConfig(): void {
  storedConfig = null;
  currentTag = '0';
}

export function setMockConfig(config: object): void {
  storedConfig = JSON.stringify(config);
  nextTag();
}

export function getMockConfig(): object | null {
  if (storedConfig === null) return null;
  return JSON.parse(storedConfig);
}

// Create the mock file handle
function createMockFileHandle() {
  const watchers: Array<(content: any) => void> = [];

  function notify(content: any): void {
    watchers.forEach((cb) => cb(content));
  }

  return {
    read(): Promise<[any, string]> {
      if (storedConfig === null) {
        return Promise.resolve([null, '-']);
      }
      return Promise.resolve([JSON.parse(storedConfig), currentTag]);
    },

    replace(content: any, expectedTag?: string): Promise<string> {
      if (expectedTag !== undefined && expectedTag !== currentTag) {
        const err = new Error('Configuration was modified by another session.');
        (err as any).problem = 'change-conflict';
        return Promise.reject(err);
      }

      if (content === null) {
        storedConfig = null;
      } else {
        storedConfig = JSON.stringify(content);
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
      let current = storedConfig ? JSON.parse(storedConfig) : null;
      if (current === null) {
        current = initial || { version: 1, viewMode: 'grid', services: [] };
      }
      const updated = callback(current);
      if (updated === undefined) {
        return Promise.resolve([current, currentTag]);
      }
      storedConfig = JSON.stringify(updated);
      const newTag = nextTag();
      notify(updated);
      return Promise.resolve([updated, newTag]);
    },

    watch(callback: (content: any) => void): { remove: () => void } {
      watchers.push(callback);
      const content = storedConfig ? JSON.parse(storedConfig) : null;
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

    path: '/etc/cockpit/servicenav.conf',
  };
}

// Build the mock cockpit object
const mockCockpit = {
  file: jest.fn().mockImplementation((_path: string, _options?: any) => {
    return createMockFileHandle();
  }),

  gettext: jest.fn().mockImplementation((text: string): string => text),

  ngettext: jest.fn().mockImplementation(
    (singular: string, plural: string, count: number): string =>
      count === 1 ? singular : plural
  ),

  locale: jest.fn(),

  language: 'en',

  jump: jest.fn(),

  location: {
    path: [] as string[],
    options: {} as Record<string, any>,
    href: 'https://test-host:9090/servicenav',
    go: jest.fn(),
    replace: jest.fn(),
    decode: jest.fn(),
    encode: jest.fn(),
  },

  hidden: false,
};

// Install on global
(global as any).cockpit = mockCockpit;

// Mock window.location — jsdom requires delete-then-reassign
const mockLocation = {
  protocol: 'https:',
  hostname: 'test-host',
  port: '9090',
  host: 'test-host:9090',
  origin: 'https://test-host:9090',
  href: 'https://test-host:9090/cockpit/@localhost/servicenav/index.html',
  pathname: '/cockpit/@localhost/servicenav/index.html',
  search: '',
  hash: '',
  ancestorOrigins: {} as DOMStringList,
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  toString: () => 'https://test-host:9090/cockpit/@localhost/servicenav/index.html',
} as unknown as Location;

// @ts-expect-error - jsdom allows delete + reassign for location
delete window.location;
window.location = mockLocation;

export default mockCockpit;
