/**
 * Configuration module — uses cockpit.localStorage for data persistence.
 *
 * Replaces cockpit.file() which requires filesystem permissions that may
 * not be granted in all Cockpit deployments. cockpit.localStorage is
 * always available and requires no special permissions.
 */

import type { ServicenavConfig, ServiceEntry, ViewMode } from './types';

const STORAGE_KEY = 'servicenav-config';

/**
 * Safely coerce a value to an array. Prevents "object is not iterable"
 * errors when stored data has services as a non-array value.
 */
export function ensureArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : defaultValue;
}

function getCockpitStorage() {
  const cockpit = (window as any).cockpit;
  if (cockpit && cockpit.localStorage) {
    return cockpit.localStorage;
  }
  // Fallback for dev/test: use browser localStorage
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  // Last resort: in-memory store
  const mem: Record<string, string> = {};
  return {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
}

export function createDefaultConfig(): ServicenavConfig {
  return {
    version: 1,
    viewMode: 'grid',
    services: [],
  };
}

/** Read config from storage. Always returns a valid config. */
export function readConfig(): ServicenavConfig {
  try {
    const storage = getCockpitStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultConfig();

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createDefaultConfig();

    if (typeof parsed.version !== 'number') parsed.version = 1;
    if (!parsed.viewMode || !['grid', 'list'].includes(parsed.viewMode)) {
      parsed.viewMode = 'grid';
    }
    parsed.services = ensureArray(parsed.services).map((s: any) => {
      if (!s || typeof s !== 'object') {
        return { id: generateId(), name: '', url: '', iconType: 'auto', iconUrl: null, description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }
      return {
        id: s.id || generateId(),
        name: String(s.name || ''),
        url: String(s.url || ''),
        iconType: ['auto', 'url', 'none'].includes(s.iconType) ? s.iconType : 'auto',
        iconUrl: s.iconUrl || null,
        description: String(s.description || ''),
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
      };
    });

    return parsed as ServicenavConfig;
  } catch (err) {
    console.error('[servicenav] readConfig failed:', err);
    return createDefaultConfig();
  }
}

/** Write config to storage. */
export function writeConfig(config: ServicenavConfig): void {
  try {
    const storage = getCockpitStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('[servicenav] writeConfig failed:', err);
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'svc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
}

export function createServiceEntry(overrides?: Partial<ServiceEntry>): ServiceEntry {
  const now = new Date().toISOString();
  return { id: generateId(), name: '', url: '', iconType: 'auto', iconUrl: null, description: '', createdAt: now, updatedAt: now, ...overrides };
}
