/**
 * Configuration file access layer for the servicenav plugin.
 *
 * Wraps Cockpit's `cockpit.file()` API for atomic JSON config read/write.
 * All data flowing through this module is normalized to prevent
 * Symbol.iterator errors from malformed config files.
 */

import type { ServicenavConfig, ServiceEntry, ViewMode } from './types';

/**
 * Safely coerce a value to an array. Prevents "object is not iterable"
 * errors when malformed JSON config has services as a non-array value.
 */
export function ensureArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : defaultValue;
}

const CONFIG_PATH = '/etc/cockpit/servicenav.conf';
const CONFIG_VERSION = 1;

const DEFAULT_CONFIG: ServicenavConfig = {
  version: CONFIG_VERSION,
  viewMode: 'grid',
  services: [],
};

/** Return a fresh default config (no reference sharing). */
export function createDefaultConfig(): ServicenavConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

/** Access cockpit.file() with JSON syntax for auto-parse/stringify. */
function getConfigFile() {
  const cockpit = (window as any).cockpit;
  if (!cockpit || !cockpit.file) {
    throw new Error(
      'Cockpit runtime not available. Ensure the plugin is loaded inside Cockpit ' +
      'or the mock cockpit layer is initialized for development.'
    );
  }
  return cockpit.file(CONFIG_PATH, { syntax: JSON });
}

/**
 * Read the current configuration from disk.
 * Returns defaults if file doesn't exist or can't be read.
 */
export function readConfig(): Promise<{ config: ServicenavConfig; tag: string }> {
  return new Promise((resolve) => {
    try {
      const file = getConfigFile();
      file.read()
        .then((rawResult: unknown) => {
          // cockpit.file().read() returns [content, tag] array.
          // Extract safely — if format is unexpected, use defaults.
          let content: ServicenavConfig | null = null;
          let tag = '-';

          if (Array.isArray(rawResult) && rawResult.length >= 2) {
            content = rawResult[0] as ServicenavConfig | null;
            tag = String(rawResult[1] ?? '-');
          }

          if (!content || typeof content !== 'object') {
            resolve({ config: createDefaultConfig(), tag: '-' });
          } else {
            const migrated = migrateConfig(content);
            resolve({ config: migrated, tag });
          }
        })
        .catch((error: Error) => {
          console.error('[servicenav] readConfig failed:', error?.message || error);
          resolve({ config: createDefaultConfig(), tag: '-' });
        });
    } catch (error) {
      console.error('[servicenav] readConfig init failed:', error);
      resolve({ config: createDefaultConfig(), tag: '-' });
    }
  });
}

/**
 * Write configuration to disk atomically.
 */
export function writeConfig(
  config: ServicenavConfig,
  expectedTag?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const file = getConfigFile();
      const promise = expectedTag
        ? file.replace(config, expectedTag)
        : file.replace(config);

      promise
        .then((newTag: string) => resolve(newTag))
        .catch((error: any) => {
          if (error?.problem === 'change-conflict') {
            reject(new Error('Configuration was modified by another session. Please reload and try again.'));
          } else {
            reject(new Error(`Failed to write configuration: ${error?.message || error}`));
          }
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Atomically modify the configuration.
 * Uses cockpit.file().modify() for read-modify-write with retry.
 */
export function modifyConfig(
  fn: (config: ServicenavConfig) => ServicenavConfig
): Promise<{ config: ServicenavConfig; tag: string }> {
  return new Promise((resolve, reject) => {
    try {
      const file = getConfigFile();
      const initialContent = createDefaultConfig();

      file.modify(
        (current: ServicenavConfig) => {
          const config = (current && typeof current === 'object') ? current : initialContent;
          // Normalize services before passing to callback
          config.services = ensureArray(config.services);
          return fn(config);
        },
        initialContent,
        '-'
      )
        .then((result: unknown) => {
          // Safe extraction: cockpit.file().modify() returns [newContent, newTag]
          if (Array.isArray(result) && result.length >= 2) {
            resolve({ config: result[0] as ServicenavConfig, tag: String(result[1] ?? '-') });
          } else {
            resolve({ config: createDefaultConfig(), tag: '-' });
          }
        })
        .catch((error: any) => {
          reject(new Error(`Failed to modify configuration: ${error?.message || error}`));
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Watch the configuration file for external changes.
 */
export function watchConfig(
  callback: (config: ServicenavConfig) => void
): () => void {
  try {
    const file = getConfigFile();
    const handle = file.watch((content: ServicenavConfig | null) => {
      if (content && typeof content === 'object') {
        content.services = ensureArray((content as any).services);
        callback(content);
      }
    });
    return () => {
      if (handle && typeof handle.remove === 'function') {
        handle.remove();
      }
    };
  } catch (error) {
    console.error('[servicenav] watchConfig failed:', error);
    return () => {};
  }
}

/**
 * Normalize config data — ensures all fields have correct types.
 */
function migrateConfig(config: any): ServicenavConfig {
  if (!config || typeof config !== 'object') {
    return createDefaultConfig();
  }

  if (typeof config.version !== 'number') {
    config.version = 0;
  }
  if (config.version < 1) {
    config.version = 1;
  }

  config.services = ensureArray(config.services);

  if (!config.viewMode || !['grid', 'list'].includes(config.viewMode)) {
    config.viewMode = 'grid';
  }

  // Normalize each service entry
  config.services = config.services.map((s: any) => {
    if (s == null || typeof s !== 'object') {
      return {
        id: generateId(),
        name: '',
        url: '',
        iconType: 'auto' as const,
        iconUrl: null,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
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

  return config as ServicenavConfig;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'svc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
}

export function createServiceEntry(overrides?: Partial<ServiceEntry>): ServiceEntry {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: '',
    url: '',
    iconType: 'auto',
    iconUrl: null,
    description: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function getViewMode(config: ServicenavConfig): ViewMode {
  return config.viewMode || 'grid';
}

export function setViewMode(config: ServicenavConfig, mode: ViewMode): ServicenavConfig {
  return { ...config, viewMode: mode };
}
