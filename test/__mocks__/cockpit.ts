/**
 * Full mock of the Cockpit global API for testing.
 *
 * Provides in-memory storage via cockpit.localStorage,
 * identity translation, and test-friendly defaults.
 */

// In-memory storage for tests
const store: Record<string, string> = {};

export function resetMockConfig(): void {
  Object.keys(store).forEach((k) => delete store[k]);
}

export function setMockConfig(config: object): void {
  store['servicenav-config'] = JSON.stringify(config);
}

export function getMockConfig(): object | null {
  const raw = store['servicenav-config'];
  return raw ? JSON.parse(raw) : null;
}

// Build the mock cockpit object
const mockCockpit = {
  localStorage: {
    getItem: (key: string): string | null => {
      return store[key] ?? null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
  },

  // cockpit.http() mock — simulates icon fetch through Cockpit's bridge
  http: jest.fn().mockRejectedValue(new Error('Simulated TLS handshake failure')),

  gettext: jest.fn().mockImplementation((text: string): string => text),

  ngettext: jest.fn().mockImplementation(
    (singular: string, plural: string, count: number): string =>
      count === 1 ? singular : plural
  ),

  locale: jest.fn(),

  language: 'en',

  jump: jest.fn(),
};

// Install on global
(global as any).cockpit = mockCockpit;

// Mock window.location
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
