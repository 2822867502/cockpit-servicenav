/**
 * useServices hook — manages the service list state with localStorage persistence.
 *
 * Configuration is stored via cockpit.localStorage (or browser localStorage in dev).
 * All reads/writes are synchronous — no async overhead, no permission issues.
 */

import { useState, useCallback } from 'react';
import type { ServiceEntry, ServiceFormData, ServicenavConfig } from '../lib/types';
import { readConfig, writeConfig, createServiceEntry, generateId, ensureArray } from '../lib/config';

export interface UseServicesReturn {
  services: ServiceEntry[];
  loading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  addService: (data: ServiceFormData) => Promise<void>;
  updateService: (id: string, data: ServiceFormData) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => Promise<void>;
  refresh: () => void;
  clearError: () => void;
}

function loadInitialState(): { services: ServiceEntry[]; viewMode: 'grid' | 'list' } {
  const config = readConfig();
  return {
    services: ensureArray<ServiceEntry>(config.services),
    viewMode: config.viewMode === 'list' ? 'list' : 'grid',
  };
}

export function useServices(): UseServicesReturn {
  const [state, setState] = useState<{ services: ServiceEntry[]; viewMode: 'grid' | 'list' }>(loadInitialState);
  const [error, setError] = useState<string | null>(null);

  // loading is always false since reads are synchronous
  const loading = false;

  const saveAndSet = useCallback((services: ServiceEntry[], viewMode?: 'grid' | 'list') => {
    const config = readConfig();
    const updated: ServicenavConfig = {
      ...config,
      services,
      viewMode: viewMode ?? config.viewMode,
    };
    writeConfig(updated);
    setState({ services, viewMode: updated.viewMode });
  }, []);

  const refresh = useCallback(() => {
    setState(loadInitialState());
  }, []);

  const addService = useCallback(async (data: ServiceFormData): Promise<void> => {
    try {
      setError(null);
      const { services } = loadInitialState();
      const now = new Date().toISOString();
      const entry: ServiceEntry = {
        id: generateId(),
        name: data.name.trim(),
        url: data.url.trim(),
        iconType: data.iconType,
        iconUrl: data.iconUrl.trim() || null,
        description: data.description.trim(),
        createdAt: now,
        updatedAt: now,
      };
      saveAndSet([...services, entry]);
    } catch (err: any) {
      setError(err.message || 'Failed to add service.');
      throw err;
    }
  }, [saveAndSet]);

  const updateService = useCallback(async (id: string, data: ServiceFormData): Promise<void> => {
    try {
      setError(null);
      const { services, viewMode } = loadInitialState();
      const updated = services.map((s) =>
        s.id === id ? { ...s, ...data, name: data.name.trim(), url: data.url.trim(), iconUrl: data.iconUrl.trim() || null, description: data.description.trim(), updatedAt: new Date().toISOString() } : s
      );
      saveAndSet(updated, viewMode);
    } catch (err: any) {
      setError(err.message || 'Failed to update service.');
      throw err;
    }
  }, [saveAndSet]);

  const removeService = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      const { services, viewMode } = loadInitialState();
      saveAndSet(services.filter((s) => s.id !== id), viewMode);
    } catch (err: any) {
      setError(err.message || 'Failed to remove service.');
      throw err;
    }
  }, [saveAndSet]);

  const changeViewMode = useCallback(async (mode: 'grid' | 'list'): Promise<void> => {
    try {
      setError(null);
      const { services } = loadInitialState();
      saveAndSet(services, mode);
    } catch (err: any) {
      setError(err.message || 'Failed to update view mode.');
      throw err;
    }
  }, [saveAndSet]);

  const clearError = useCallback(() => setError(null), []);

  return {
    services: state.services,
    loading,
    error,
    viewMode: state.viewMode,
    addService,
    updateService,
    removeService,
    setViewMode: changeViewMode,
    refresh,
    clearError,
  };
}
