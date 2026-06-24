/**
 * useServices hook — manages the service list state with localStorage persistence.
 */

import { useState, useCallback } from 'react';
import type { ServiceEntry, ServiceFormData, ServicenavConfig, HttpsMode } from '../lib/types';
import { readConfig, writeConfig, generateId, ensureArray } from '../lib/config';

export interface UseServicesReturn {
  services: ServiceEntry[];
  loading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  httpsMode: HttpsMode;
  addService: (data: ServiceFormData) => Promise<void>;
  updateService: (id: string, data: ServiceFormData) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => Promise<void>;
  setHttpsMode: (mode: HttpsMode) => Promise<void>;
  refresh: () => void;
  clearError: () => void;
}

interface AppState {
  services: ServiceEntry[];
  viewMode: 'grid' | 'list';
  httpsMode: HttpsMode;
}

function loadInitialState(): AppState {
  const config = readConfig();
  return {
    services: ensureArray<ServiceEntry>(config.services),
    viewMode: config.viewMode === 'list' ? 'list' : 'grid',
    httpsMode: config.httpsMode || 'follow',
  };
}

export function useServices(): UseServicesReturn {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [error, setError] = useState<string | null>(null);

  const loading = false;

  const saveAndSet = useCallback((partial: Partial<AppState>) => {
    const config = readConfig();
    const updated: ServicenavConfig = {
      ...config,
      services: partial.services ?? config.services,
      viewMode: partial.viewMode ?? config.viewMode,
      httpsMode: partial.httpsMode ?? config.httpsMode,
    };
    writeConfig(updated);
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const refresh = useCallback(() => setState(loadInitialState()), []);

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
      saveAndSet({ services: [...services, entry] });
    } catch (err: any) {
      setError(err.message || 'Failed to add service.');
      throw err;
    }
  }, [saveAndSet]);

  const updateService = useCallback(async (id: string, data: ServiceFormData): Promise<void> => {
    try {
      setError(null);
      const { services } = loadInitialState();
      saveAndSet({
        services: services.map((s) =>
          s.id === id ? {
            ...s,
            name: data.name.trim(),
            url: data.url.trim(),
            iconType: data.iconType,
            iconUrl: data.iconUrl.trim() || null,
            description: data.description.trim(),
            updatedAt: new Date().toISOString(),
          } : s
        ),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update service.');
      throw err;
    }
  }, [saveAndSet]);

  const removeService = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      const { services } = loadInitialState();
      saveAndSet({ services: services.filter((s) => s.id !== id) });
    } catch (err: any) {
      setError(err.message || 'Failed to remove service.');
      throw err;
    }
  }, [saveAndSet]);

  const changeViewMode = useCallback(async (mode: 'grid' | 'list'): Promise<void> => {
    try { saveAndSet({ viewMode: mode }); } catch (err: any) {
      setError(err.message || 'Failed to update view mode.'); throw err;
    }
  }, [saveAndSet]);

  const changeHttpsMode = useCallback(async (mode: HttpsMode): Promise<void> => {
    try { saveAndSet({ httpsMode: mode }); } catch (err: any) {
      setError(err.message || 'Failed to update HTTPS mode.'); throw err;
    }
  }, [saveAndSet]);

  const clearError = useCallback(() => setError(null), []);

  return {
    services: state.services,
    loading,
    error,
    viewMode: state.viewMode,
    httpsMode: state.httpsMode,
    addService,
    updateService,
    removeService,
    setViewMode: changeViewMode,
    setHttpsMode: changeHttpsMode,
    refresh,
    clearError,
  };
}
