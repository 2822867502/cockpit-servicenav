/**
 * useIconFetcher hook — handles service icon loading with fallback chain.
 *
 * IMPORTANT — TLS certificate handling:
 * This plugin may reference services on the same host using self-signed
 * certificates (e.g., https://host:8443). Browser <img> tags for these URLs
 * can trigger Cockpit's TLS proxy, which shows "Oops" on handshake failure.
 *
 * Strategy to avoid TLS-triggered "Oops":
 *   1. Use Cockpit's native `cockpit.http()` API first — it handles errors
 *      as Promise rejections (catchable) rather than shell-level alerts.
 *   2. On failure, fall back to <img> with a very short timeout.
 *   3. On any failure, silently use the default icon — NEVER propagate errors.
 *
 * Icon resolution priority:
 *   1. 'none': Skip all network requests, use default icon immediately
 *   2. 'url': Try user-provided icon URL
 *   3. 'auto': Try /favicon.ico from the service's resolved URL
 *   4. All failures → default SVG icon (silent fallback)
 */

import { useState, useEffect, useRef } from 'react';
import type { ServiceEntry } from '../lib/types';
import { resolveServiceUrl } from '../lib/url';

/** Timeout in milliseconds for favicon fetch attempts (short to avoid blocking) */
const ICON_FETCH_TIMEOUT_MS = 3000;

export interface UseIconFetcherReturn {
  /** Resolved icon source URL (data: or https:), or null for default */
  iconSrc: string | null;
  /** True while icon is being loaded */
  loading: boolean;
  /** True if all fetch attempts failed */
  error: boolean;
}

/**
 * Try to load an icon via Cockpit's native HTTP client.
 *
 * `cockpit.http()` routes through Cockpit's bridge, which handles TLS
 * errors as catchable Promise rejections (unlike <img> tags whose
 * network errors may surface as shell-level "Oops" alerts).
 *
 * Returns a data: URI on success, or null on failure.
 */
async function tryLoadViaCockpitHttp(url: string, signal: AbortSignal): Promise<string | null> {
  const cockpit = (window as any).cockpit;
  if (!cockpit || typeof cockpit.http !== 'function') {
    return null; // cockpit.http not available, caller will fall back
  }

  try {
    // cockpit.http() returns a Response-like object with .blob()
    const response = await cockpit.http(url, {
      method: 'GET',
      headers: { Accept: 'image/*' },
    });

    if (signal.aborted) return null;

    // cockpit.http responses have .blob() for binary data
    if (response && typeof response.blob === 'function') {
      const blob = await response.blob();
      if (signal.aborted) return null;

      if (blob && blob.size > 0) {
        // Convert blob to data: URI so <img> can display it without
        // making another network request that hits the TLS proxy
        return URL.createObjectURL(blob);
      }
    }
    return null;
  } catch {
    // cockpit.http failed (TLS error, timeout, unreachable, etc.)
    // This is expected for self-signed certs — silently return null
    return null;
  }
}

/**
 * Try to load an icon via <img> element (direct browser request).
 *
 * This is the fallback when cockpit.http() is unavailable (dev mode).
 * Uses onerror/onload handlers with a timeout.
 *
 * NOTE: In production Cockpit, <img> requests may go through Cockpit's
 * reverse proxy and trigger TLS handshake errors. This function is
 * used ONLY as a fallback when cockpit.http() is not available.
 */
function tryLoadViaImageTag(url: string, signal: AbortSignal): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;

    const finish = (result: string | null) => {
      if (!settled) {
        settled = true;
        img.onload = null;
        img.onerror = null;
        if (result && result.startsWith('blob:')) {
          // Don't revoke — the <img> tag still needs it
        }
        resolve(result);
      }
    };

    const timeoutId = setTimeout(() => finish(null), ICON_FETCH_TIMEOUT_MS);

    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      finish(null);
    }, { once: true });

    img.onload = () => {
      clearTimeout(timeoutId);
      finish(url); // Return the original URL on success
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      finish(null);
    };

    // Set crossOrigin to avoid CORS issues when reading image data
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/**
 * Get the favicon URL for a service.
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
 * Primary icon loading function — tries to load an icon URL, returns
 * a usable src string or null (use default icon).
 *
 * Strategy:
 *   1. Try cockpit.http() first (handles TLS errors as catchable rejections)
 *   2. Fall back to <img> tag (for dev mode where cockpit.http isn't available)
 *   3. Any failure → return null
 *
 * ALL errors are silently caught. This function NEVER throws.
 */
async function loadIcon(url: string, signal: AbortSignal): Promise<string | null> {
  // Primary: use cockpit.http() — TLS errors are catchable
  const httpResult = await tryLoadViaCockpitHttp(url, signal);
  if (httpResult) return httpResult;
  if (signal.aborted) return null;

  // Fallback: <img> tag (for dev mode or when cockpit.http is unavailable)
  const imgResult = await tryLoadViaImageTag(url, signal);
  if (imgResult) return imgResult;

  return null; // All attempts failed
}

/**
 * Hook to manage icon loading for a service.
 *
 * On any failure (TLS, timeout, 404, unreachable), silently falls back
 * to null — the ServiceIcon component renders the default SVG.
 * No errors are ever thrown or propagated.
 */
export function useIconFetcher(service: ServiceEntry): UseIconFetcherReturn {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(service.iconType !== 'none');
  const [error, setError] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Abort any in-flight fetch from previous service
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // Reset state for the new service
    setIconSrc(null);
    setError(false);

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchIcon = async () => {
      try {
        // Case 1: No icon requested — use default immediately, no network
        if (service.iconType === 'none') {
          setLoading(false);
          return;
        }

        // Case 2: User-provided custom icon URL
        if (service.iconType === 'url' && service.iconUrl) {
          setLoading(true);
          const result = await loadIcon(service.iconUrl, controller.signal);
          if (!mountedRef.current || controller.signal.aborted) return;

          if (result) {
            setIconSrc(result);
          } else {
            setError(true);
          }
          setLoading(false);
          return;
        }

        // Case 3: Auto-fetch /favicon.ico from the service
        if (service.iconType === 'auto') {
          setLoading(true);
          const faviconUrl = getFaviconUrl(service);
          const result = await loadIcon(faviconUrl, controller.signal);
          if (!mountedRef.current || controller.signal.aborted) return;

          if (result) {
            setIconSrc(result);
          } else {
            setError(true);
          }
          setLoading(false);
          return;
        }

        // Fallback: no icon source
        setLoading(false);
      } catch (_unused) {
        // Catch ANY unexpected error — never let it propagate.
        // The default SVG icon will be shown instead.
        if (mountedRef.current && !controller.signal.aborted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchIcon();

    return () => {
      controller.abort();
    };
  }, [service.id, service.iconType, service.iconUrl, service.url]);

  return { iconSrc, loading, error };
}
