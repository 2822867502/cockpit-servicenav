/**
 * useIconFetcher hook — handles service icon loading with fallback chain.
 *
 * Implements three icon resolution strategies:
 * 1. 'url': Load from user-provided icon URL
 * 2. 'auto': Attempt to load favicon.ico from the service's resolved URL
 * 3. 'none': Skip fetching, use default icon immediately
 *
 * Uses <img> elements for loading (not fetch) to avoid CORS restrictions.
 * Each attempt has a 5-second timeout before falling back.
 * Results are cached in state per service ID.
 */

import { useState, useEffect, useRef } from 'react';
import type { ServiceEntry } from '../lib/types';
import { resolveServiceUrl } from '../lib/url';

/** Timeout in milliseconds for icon fetch attempts */
const ICON_FETCH_TIMEOUT = 5000;

export interface UseIconFetcherReturn {
  /** Resolved icon source URL, or null if default should be used */
  iconSrc: string | null;
  /** True while icon is being loaded */
  loading: boolean;
  /** True if all fetch attempts failed */
  error: boolean;
}

/**
 * Try to load an icon from a URL, with timeout.
 *
 * @param url - The icon URL to try
 * @param signal - AbortController signal for cancellation
 * @returns Promise resolving to true if loaded successfully
 */
function tryLoadIcon(url: string, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;

    const cleanup = () => {
      if (!settled) {
        settled = true;
        img.onload = null;
        img.onerror = null;
      }
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(false);
    }, ICON_FETCH_TIMEOUT);

    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(false);
    });

    img.onload = () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Get the favicon URL for a service.
 *
 * For absolute URLs, appends /favicon.ico to the origin.
 * For relative ports, constructs the full URL and appends /favicon.ico.
 */
function getFaviconUrl(service: ServiceEntry): string {
  const resolvedUrl = resolveServiceUrl(service.url);
  try {
    const urlObj = new URL(resolvedUrl);
    return `${urlObj.origin}/favicon.ico`;
  } catch {
    return `${resolvedUrl}/favicon.ico`;
  }
}

/**
 * Hook to manage icon loading for a service.
 *
 * The fetch chain:
 * 1. If iconType === 'url' and iconUrl is set, try the user-provided URL
 * 2. If iconType === 'auto', try /favicon.ico from the service's origin
 * 3. Fall back to null (UI renders default SVG)
 *
 * @param service - The service to fetch an icon for
 * @returns Icon state (src, loading, error)
 */
export function useIconFetcher(service: ServiceEntry): UseIconFetcherReturn {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(service.iconType !== 'none');
  const [error, setError] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort any previous fetch
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // Reset state for new service
    setIconSrc(null);
    setError(false);

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchIcon = async () => {
      // Case 1: No icon requested — use default
      if (service.iconType === 'none') {
        setLoading(false);
        return;
      }

      // Case 2: User-provided icon URL
      if (service.iconType === 'url' && service.iconUrl) {
        setLoading(true);
        const success = await tryLoadIcon(service.iconUrl, controller.signal);
        if (success && !controller.signal.aborted) {
          setIconSrc(service.iconUrl);
          setLoading(false);
          return;
        }
        // Fall through to default if URL failed and not aborted
        if (!controller.signal.aborted) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      // Case 3: Auto-fetch favicon
      if (service.iconType === 'auto') {
        setLoading(true);
        const faviconUrl = getFaviconUrl(service);
        const success = await tryLoadIcon(faviconUrl, controller.signal);
        if (success && !controller.signal.aborted) {
          setIconSrc(faviconUrl);
          setLoading(false);
          return;
        }
        // Fall through to default if favicon failed
        if (!controller.signal.aborted) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      // Default: no source
      setLoading(false);
    };

    fetchIcon();

    return () => {
      controller.abort();
    };
  }, [service.id, service.iconType, service.iconUrl, service.url]);

  return { iconSrc, loading, error };
}
