/**
 * useServices hook — manages the service list state with config file synchronization.
 *
 * Provides the canonical data source for all service-related UI components.
 * All CRUD operations are synced atomically to /etc/cockpit/servicenav.conf.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ServiceEntry, ServiceFormData, ServicenavConfig } from '../lib/types';
import {
  readConfig,
  modifyConfig,
  watchConfig,
  createServiceEntry,
  generateId,
  ensureArray,
} from '../lib/config';

export interface UseServicesReturn {
  /** Array of configured services */
  services: ServiceEntry[];
  /** True while initial config is loading */
  loading: boolean;
  /** Error message if the last operation failed, null otherwise */
  error: string | null;
  /** Current view mode preference */
  viewMode: 'grid' | 'list';
  /** Add a new service from form data */
  addService: (data: ServiceFormData) => Promise<void>;
  /** Update an existing service by ID */
  updateService: (id: string, data: ServiceFormData) => Promise<void>;
  /** Remove a service by ID */
  removeService: (id: string) => Promise<void>;
  /** Change the view mode */
  setViewMode: (mode: 'grid' | 'list') => Promise<void>;
  /** Manually refresh from disk */
  refresh: () => Promise<void>;
  /** Clear the current error */
  clearError: () => void;
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>('grid');

  // Keep track of the latest services for the modify callback
  const servicesRef = useRef<ServiceEntry[]>([]);
  servicesRef.current = services;

  // Load initial config
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { config } = await readConfig();
      setServices(ensureArray<ServiceEntry>(config.services));
      setViewModeState(config.viewMode === 'list' ? 'list' : 'grid');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refresh();

    // Watch for external changes to the config file.
    // CRITICAL: use ensureArray() — config.services could be a non-array
    // object from a malformed/corrupted config file, which would cause
    // "object is not iterable" when components try to render it.
    const unwatch = watchConfig((config: ServicenavConfig) => {
      setServices(ensureArray<ServiceEntry>(config.services));
      setViewModeState(config.viewMode === 'list' ? 'list' : 'grid');
    });

    return () => {
      unwatch();
    };
  }, [refresh]);

  // Add a new service
  const addService = useCallback(
    async (data: ServiceFormData): Promise<void> => {
      try {
        setError(null);
        await modifyConfig((config: ServicenavConfig) => {
          const now = new Date().toISOString();
          const newService: ServiceEntry = {
            id: generateId(),
            name: data.name.trim(),
            url: data.url.trim(),
            iconType: data.iconType,
            iconUrl: data.iconUrl.trim() || null,
            description: data.description.trim(),
            createdAt: now,
            updatedAt: now,
          };
          return {
            ...config,
            // CRITICAL: ensureArray() prevents TypeError when config.services
            // is a non-iterable (e.g., malformed JSON object) — spreading a
            // non-iterable inside [] throws Symbol.iterator error and crashes page
            services: [...ensureArray<ServiceEntry>(config.services), newService],
          };
        });
        // State update happens via the watcher callback
      } catch (err: any) {
        setError(err.message || 'Failed to add service.');
        throw err;
      }
    },
    []
  );

  // Update an existing service
  const updateService = useCallback(
    async (id: string, data: ServiceFormData): Promise<void> => {
      try {
        setError(null);
        await modifyConfig((config: ServicenavConfig) => {
          const services = ensureArray<ServiceEntry>(config.services).map((s) => {
            if (s.id === id) {
              return {
                ...s,
                name: data.name.trim(),
                url: data.url.trim(),
                iconType: data.iconType,
                iconUrl: data.iconUrl.trim() || null,
                description: data.description.trim(),
                updatedAt: new Date().toISOString(),
              };
            }
            return s;
          });
          return { ...config, services };
        });
      } catch (err: any) {
        setError(err.message || 'Failed to update service.');
        throw err;
      }
    },
    []
  );

  // Remove a service
  const removeService = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await modifyConfig((config: ServicenavConfig) => {
          const services = ensureArray<ServiceEntry>(config.services).filter((s) => s.id !== id);
          return { ...config, services };
        });
      } catch (err: any) {
        setError(err.message || 'Failed to remove service.');
        throw err;
      }
    },
    []
  );

  // Change view mode
  const changeViewMode = useCallback(
    async (mode: 'grid' | 'list'): Promise<void> => {
      try {
        setError(null);
        await modifyConfig((config: ServicenavConfig) => {
          return { ...config, viewMode: mode };
        });
        setViewModeState(mode);
      } catch (err: any) {
        setError(err.message || 'Failed to update view mode.');
        throw err;
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    services,
    loading,
    error,
    viewMode,
    addService,
    updateService,
    removeService,
    setViewMode: changeViewMode,
    refresh,
    clearError,
  };
}
