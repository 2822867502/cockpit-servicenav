/**
 * Configuration file access layer for the servicenav plugin.
 *
 * Wraps the Cockpit `cockpit.file()` API to read/write the plugin's JSON config file
 * located at /etc/cockpit/servicenav.conf. Provides:
 * - Default config generation when no file exists
 * - Atomic reads with tag-based conflict detection
 * - Atomic read-modify-write via modify()
 * - File watching for external changes
 *
 * In development/test environments without Cockpit, the mockCockpit layer handles storage.
 */

import type { ServicenavConfig, ServiceEntry, ViewMode } from './types';

/**
 * Safely coerce a value to an array. If the value is not an array
 * (e.g., a malformed JSON object, null, undefined), returns an empty array.
 *
 * This is critical because Cockpit's JSON file API may return
 * config data where `services` is a non-array object if the config
 * file was manually edited or corrupted. Using such a value with
 * spread operators or .map()/.filter() throws:
 *   TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))
 */
export function ensureArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : defaultValue;
}

/** Path to the plugin configuration file on the Cockpit server */
const CONFIG_PATH = '/etc/cockpit/servicenav.conf';

/** Current config schema version */
const CONFIG_VERSION = 1;

/** Default configuration used when no config file exists */
const DEFAULT_CONFIG: ServicenavConfig = {
  version: CONFIG_VERSION,
  viewMode: 'grid',
  services: [],
};

/**
 * Create a default configuration object.
 * Always returns a fresh copy to prevent mutation.
 */
export function createDefaultConfig(): ServicenavConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

/**
 * Get the cockpit.file() wrapper for the config.
 *
 * Uses JSON syntax for automatic parsing/stringifying.
 * Returns a file proxy that supports read(), replace(), modify(), and watch().
 */
function getConfigFile() {
  // Access the global `cockpit` object provided by Cockpit's shell
  // In dev/test, this is provided by the mock layer
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
 *
 * If the config file does not exist (first run), returns the default config.
 * Automatically migrates old schema versions if needed.
 *
 * @returns Promise resolving to the parsed configuration and its current tag
 */
export function readConfig(): Promise<{ config: ServicenavConfig; tag: string }> {
  return new Promise((resolve, reject) => {
    try {
      const file = getConfigFile();
      file
        .read()
        .then(([content, tag]: [ServicenavConfig | null, string]) => {
          if (content === null) {
            // File doesn't exist - return defaults
            resolve({ config: createDefaultConfig(), tag: '-' });
          } else {
            // Migrate if needed
            const migrated = migrateConfig(content);
            resolve({ config: migrated, tag });
          }
        })
        .catch((error: Error) => {
          console.error('Failed to read config:', error);
          // On read error, return defaults so the UI still works
          resolve({ config: createDefaultConfig(), tag: '-' });
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Write configuration to disk.
 *
 * Uses atomic replacement via rename(). If an expectedTag is provided,
 * the write only succeeds if the file hasn't been modified since that tag.
 *
 * @param config - The configuration to write
 * @param expectedTag - Optional tag from a previous read for optimistic locking
 * @returns Promise resolving to the new tag string
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
            reject(
              new Error(
                'Configuration was modified by another session. Please reload and try again.'
              )
            );
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
 * Atomically modify the configuration using a callback function.
 *
 * Uses cockpit.file().modify() which handles the read-modify-write cycle
 * with automatic retry on concurrent modification conflicts.
 *
 * @param fn - Transformation function (receives current config, returns modified config)
 * @returns Promise resolving to the new config and tag
 */
export function modifyConfig(
  fn: (config: ServicenavConfig) => ServicenavConfig
): Promise<{ config: ServicenavConfig; tag: string }> {
  return new Promise((resolve, reject) => {
    try {
      const file = getConfigFile();

      // Provide initial content so we don't fail if file doesn't exist yet
      const initialContent = createDefaultConfig();

      file.modify(
        (current: ServicenavConfig) => {
          const config = current || initialContent;
          return fn(config);
        },
        initialContent,
        '-'
      )
        .then(([newContent, newTag]: [ServicenavConfig, string]) => {
          resolve({ config: newContent, tag: newTag });
        })
        .catch((error: any) => {
          reject(
            new Error(`Failed to modify configuration: ${error?.message || error}`)
          );
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Watch the configuration file for external changes.
 *
 * The callback fires whenever the config file is modified on disk
 * (including by our own writeConfig/modifyConfig calls).
 *
 * @param callback - Called with the updated config on each change
 * @returns A function to call to stop watching (removes the listener)
 */
export function watchConfig(
  callback: (config: ServicenavConfig) => void
): () => void {
  try {
    const file = getConfigFile();
    const handle = file.watch((content: ServicenavConfig | null) => {
      if (content !== null) {
        callback(content);
      }
    });
    // Return unwatch function
    return () => {
      if (handle && typeof handle.remove === 'function') {
        handle.remove();
      }
    };
  } catch (error) {
    console.error('Failed to watch config file:', error);
    return () => {}; // No-op unwatch
  }
}

/**
 * Migrate older config schema versions to the current version.
 *
 * Currently handles v0 -> v1 migration (if any future changes).
 */
function migrateConfig(config: any): ServicenavConfig {
  if (!config || typeof config !== 'object') {
    return createDefaultConfig();
  }

  // Ensure version field exists
  if (typeof config.version !== 'number') {
    config.version = 0;
  }

  // v0 -> v1 migration (placeholder for future)
  if (config.version < 1) {
    config.version = 1;
  }

  // Ensure required fields exist — use ensureArray to guard against
  // non-array values (objects, null, etc.) from malformed config files
  config.services = ensureArray(config.services);

  if (!config.viewMode || !['grid', 'list'].includes(config.viewMode)) {
    config.viewMode = 'grid';
  }

  // Normalize service entries — guard against null/undefined entries
  // that could appear in a manually-edited or corrupted config file
  config.services = config.services.map((s: any, _index: number) => {
    // If the entry is null, undefined, or not an object, skip it by
    // returning an object with a fresh generated ID. This prevents
    // TypeError from accessing .id / .name on null values.
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

/**
 * Generate a unique ID for a new service entry.
 * Uses crypto.randomUUID if available, otherwise a simple fallback.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: time-based + random
  return 'svc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
}

/**
 * Create a new service entry with default values and generated metadata.
 */
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

/**
 * Get the current view mode from the configuration.
 * Used by the useViewMode hook.
 */
export function getViewMode(config: ServicenavConfig): ViewMode {
  return config.viewMode || 'grid';
}

/**
 * Set the view mode in the configuration.
 * Used by the useViewMode hook.
 */
export function setViewMode(config: ServicenavConfig, mode: ViewMode): ServicenavConfig {
  return { ...config, viewMode: mode };
}
