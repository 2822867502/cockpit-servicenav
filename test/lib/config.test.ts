/**
 * Tests for lib/config.ts — configuration file access layer.
 */

import {
  readConfig,
  writeConfig,
  modifyConfig,
  createDefaultConfig,
  createServiceEntry,
  generateId,
  ensureArray,
} from '../../src/lib/config';
import { setMockConfig, getMockConfig, resetMockConfig } from '../__mocks__/cockpit';
import type { ServicenavConfig } from '../../src/lib/types';

beforeEach(() => {
  resetMockConfig();
});

describe('createDefaultConfig', () => {
  it('returns config with version 1', () => {
    const config = createDefaultConfig();
    expect(config.version).toBe(1);
  });

  it('returns config with empty services array', () => {
    const config = createDefaultConfig();
    expect(config.services).toEqual([]);
  });

  it('returns config with grid view mode', () => {
    const config = createDefaultConfig();
    expect(config.viewMode).toBe('grid');
  });

  it('returns a new object each call (no mutation)', () => {
    const a = createDefaultConfig();
    const b = createDefaultConfig();
    expect(a).not.toBe(b);
    a.services.push({ id: 'test' } as any);
    expect(b.services).toEqual([]);
  });
});

describe('readConfig', () => {
  it('returns default config when no config exists', async () => {
    const { config, tag } = await readConfig();
    expect(config.version).toBe(1);
    expect(config.services).toEqual([]);
    expect(config.viewMode).toBe('grid');
    expect(tag).toBe('-');
  });

  it('returns stored config when it exists', async () => {
    const testConfig = {
      version: 1,
      viewMode: 'list' as const,
      services: [
        {
          id: 'test-1',
          name: 'Test Service',
          url: '8080',
          iconType: 'auto' as const,
          iconUrl: null,
          description: 'A test service',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    setMockConfig(testConfig);

    const { config } = await readConfig();
    expect(config.viewMode).toBe('list');
    expect(config.services).toHaveLength(1);
    expect(config.services[0].name).toBe('Test Service');
  });

  it('migrates config with missing version field', async () => {
    setMockConfig({ services: [] }); // no version
    const { config } = await readConfig();
    expect(config.version).toBe(1);
    expect(config.viewMode).toBe('grid');
  });

  it('normalizes invalid viewMode', async () => {
    setMockConfig({ version: 1, viewMode: 'invalid', services: [] });
    const { config } = await readConfig();
    expect(config.viewMode).toBe('grid');
  });
});

describe('writeConfig', () => {
  it('writes config and returns a new tag', async () => {
    const config = createDefaultConfig();
    config.services.push(
      createServiceEntry({ name: 'New Service', url: '8080' })
    );

    const tag = await writeConfig(config);
    expect(tag).toBeDefined();
    expect(typeof tag).toBe('string');

    // Verify it was stored
    const stored = getMockConfig() as ServicenavConfig;
    expect(stored.services).toHaveLength(1);
    expect(stored.services[0].name).toBe('New Service');
  });
});

describe('modifyConfig', () => {
  it('applies transformation function atomically', async () => {
    setMockConfig(createDefaultConfig());

    const { config } = await modifyConfig((current) => {
      return {
        ...current,
        services: [
          ...current.services,
          createServiceEntry({ name: 'Added Service', url: '3000' }),
        ],
      };
    });

    expect(config.services).toHaveLength(1);
    expect(config.services[0].name).toBe('Added Service');
  });

  it('handles empty config (creates default)', async () => {
    // No config set — modifyConfig should use initial content
    const { config } = await modifyConfig((current) => {
      expect(current).toBeDefined();
      expect(current.version).toBe(1);
      return current;
    });

    expect(config.version).toBe(1);
    expect(config.services).toEqual([]);
  });

  it('can update view mode', async () => {
    setMockConfig(createDefaultConfig());

    const { config } = await modifyConfig((current) => {
      return { ...current, viewMode: 'list' };
    });

    expect(config.viewMode).toBe('list');
  });
});

describe('createServiceEntry', () => {
  it('creates entry with generated id', () => {
    const entry = createServiceEntry({ name: 'Test', url: '8080' });
    expect(entry.id).toBeDefined();
    expect(entry.id.length).toBeGreaterThan(0);
    expect(entry.name).toBe('Test');
    expect(entry.url).toBe('8080');
  });

  it('creates entry with default values', () => {
    const entry = createServiceEntry();
    expect(entry.iconType).toBe('auto');
    expect(entry.iconUrl).toBeNull();
    expect(entry.description).toBe('');
    expect(entry.createdAt).toBeDefined();
    expect(entry.updatedAt).toBeDefined();
  });

  it('sets created and updated timestamps', () => {
    const before = new Date().toISOString();
    const entry = createServiceEntry();
    const after = new Date().toISOString();
    expect(entry.createdAt >= before).toBe(true);
    expect(entry.createdAt <= after).toBe(true);
    expect(entry.updatedAt).toBe(entry.createdAt);
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique ids on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('ensureArray', () => {
  it('returns the input if it is already an array', () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });

  it('returns empty array for undefined', () => {
    expect(ensureArray(undefined)).toEqual([]);
  });

  it('returns empty array for null', () => {
    expect(ensureArray(null)).toEqual([]);
  });

  it('returns empty array for a plain object (most common malformed case)', () => {
    // Simulates {"0": {...}, "1": {...}} from malformed JSON
    const obj = { '0': { id: 'x' }, '1': { id: 'y' } };
    expect(ensureArray(obj)).toEqual([]);
  });

  it('returns empty array for a number', () => {
    expect(ensureArray(42)).toEqual([]);
  });

  it('returns empty array for a string', () => {
    expect(ensureArray('not-an-array')).toEqual([]);
  });

  it('returns empty array for a boolean', () => {
    expect(ensureArray(true)).toEqual([]);
  });

  it('returns custom default when provided', () => {
    const fallback = [{ id: 'fallback' }];
    expect(ensureArray(null, fallback)).toBe(fallback);
  });
});

describe('readConfig with malformed data', () => {
  it('survives services being a plain object (not an array)', async () => {
    setMockConfig({
      version: 1,
      viewMode: 'grid',
      services: { '0': { id: 'x', name: 'X' } }, // malformed — object instead of array
    });

    const { config } = await readConfig();
    // Should normalize to empty array without crashing
    expect(Array.isArray(config.services)).toBe(true);
    expect(config.services).toEqual([]);
  });

  it('survives services being null', async () => {
    setMockConfig({
      version: 1,
      viewMode: 'grid',
      services: null,
    });

    const { config } = await readConfig();
    expect(Array.isArray(config.services)).toBe(true);
  });

  it('survives a service entry being null inside the array', async () => {
    setMockConfig({
      version: 1,
      viewMode: 'grid',
      services: [
        { id: 'valid', name: 'Valid', url: '8080', iconType: 'auto', iconUrl: null, description: '', createdAt: '', updatedAt: '' },
        null, // malformed entry
      ],
    });

    const { config } = await readConfig();
    expect(config.services.length).toBe(2);
    // First entry preserved
    expect(config.services[0].name).toBe('Valid');
    // Second entry normalized to a safe object
    expect(config.services[1].id).toBeTruthy();
    expect(config.services[1].name).toBe('');
  });

  it('survives completely missing version field', async () => {
    setMockConfig({ services: [] });
    const { config } = await readConfig();
    expect(config.version).toBe(1);
    expect(config.viewMode).toBe('grid');
  });
});
