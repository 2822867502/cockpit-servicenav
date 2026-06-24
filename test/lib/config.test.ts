/**
 * Tests for lib/config.ts — localStorage-based configuration.
 */

import {
  readConfig,
  writeConfig,
  createDefaultConfig,
  createServiceEntry,
  generateId,
  ensureArray,
} from '../../src/lib/config';
import { setMockConfig, getMockConfig, resetMockConfig } from '../__mocks__/cockpit';
import type { ServicenavConfig } from '../../src/lib/types';

describe('createDefaultConfig', () => {
  it('returns config with version 1 and empty services', () => {
    const config = createDefaultConfig();
    expect(config.version).toBe(1);
    expect(config.services).toEqual([]);
    expect(config.viewMode).toBe('grid');
  });

  it('returns a new object each call', () => {
    const a = createDefaultConfig();
    const b = createDefaultConfig();
    expect(a).not.toBe(b);
    a.services.push({ id: 'test' } as any);
    expect(b.services).toEqual([]);
  });
});

describe('readConfig', () => {
  beforeEach(() => resetMockConfig());

  it('returns default config when no config exists', () => {
    const config = readConfig();
    expect(config.version).toBe(1);
    expect(config.services).toEqual([]);
    expect(config.viewMode).toBe('grid');
  });

  it('returns stored config when it exists', () => {
    setMockConfig({
      version: 1,
      viewMode: 'list',
      services: [{
        id: 'test-1', name: 'Test', url: '8080', iconType: 'auto',
        iconUrl: null, description: 'desc',
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      }],
    });
    const config = readConfig();
    expect(config.viewMode).toBe('list');
    expect(config.services).toHaveLength(1);
    expect(config.services[0].name).toBe('Test');
  });

  it('normalizes services if it is a non-array object', () => {
    setMockConfig({ version: 1, viewMode: 'grid', services: { '0': {} } });
    const config = readConfig();
    expect(Array.isArray(config.services)).toBe(true);
    expect(config.services).toEqual([]);
  });

  it('normalizes null entries in services array', () => {
    setMockConfig({
      version: 1, viewMode: 'grid',
      services: [
        { id: 'ok', name: 'OK', url: '8080', iconType: 'auto', iconUrl: null, description: '', createdAt: '', updatedAt: '' },
        null,
      ],
    });
    const config = readConfig();
    expect(config.services).toHaveLength(2);
    expect(config.services[0].name).toBe('OK');
    expect(config.services[1].name).toBe('');
  });
});

describe('writeConfig', () => {
  beforeEach(() => resetMockConfig());

  it('writes config and can be read back', () => {
    const config = createDefaultConfig();
    config.services.push(createServiceEntry({ name: 'New', url: '8080' }));
    writeConfig(config);

    const stored = getMockConfig() as ServicenavConfig;
    expect(stored.services).toHaveLength(1);
    expect(stored.services[0].name).toBe('New');
  });
});

describe('ensureArray', () => {
  it('returns input if already array', () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });

  it('returns empty array for undefined, null, object, number, string, boolean', () => {
    expect(ensureArray(undefined)).toEqual([]);
    expect(ensureArray(null)).toEqual([]);
    expect(ensureArray({ '0': {} })).toEqual([]);
    expect(ensureArray(42)).toEqual([]);
    expect(ensureArray('str')).toEqual([]);
    expect(ensureArray(true)).toEqual([]);
  });

  it('returns custom default when provided', () => {
    const fallback = [{ id: 'x' }];
    expect(ensureArray(null, fallback)).toBe(fallback);
  });
});

describe('createServiceEntry', () => {
  it('creates entry with generated id and defaults', () => {
    const entry = createServiceEntry({ name: 'Test', url: '8080' });
    expect(entry.id).toBeTruthy();
    expect(entry.name).toBe('Test');
    expect(entry.url).toBe('8080');
    expect(entry.iconType).toBe('auto');
    expect(entry.iconUrl).toBeNull();
    expect(entry.description).toBe('');
  });
});

describe('generateId', () => {
  it('returns non-empty unique strings', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
