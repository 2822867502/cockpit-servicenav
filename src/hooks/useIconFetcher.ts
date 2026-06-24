/**
 * useIconFetcher — loads service icons exclusively via cockpit.http().
 *
 * WHY cockpit.http() instead of <img> tags:
 *   1. Avoids CORS / mixed-content errors in the iframe.
 *   2. Requests go through Cockpit's bridge (same origin), not the browser directly.
 *   3. TLS certificate errors are catchable Promise rejections.
 *   4. Binary response is converted to a blob: URL — safe for <img> display.
 *
 * Fallback: on ANY failure, silently returns null → ServiceIcon renders default SVG.
 */

import { useState, useEffect, useRef } from 'react';
import type { ServiceEntry } from '../lib/types';
import { resolveServiceUrl } from '../lib/url';

export interface UseIconFetcherReturn {
  iconSrc: string | null;
  loading: boolean;
  error: boolean;
}

/**
 * Fetch an icon URL via cockpit.http(), return a blob: URL.
 * Handles both Response-like objects (with .blob()) and raw response data.
 * Returns null on any failure — never throws.
 */
async function fetchViaCockpitHttp(url: string): Promise<string | null> {
  const cockpit = (window as any).cockpit;
  if (!cockpit || typeof cockpit.http !== 'function') {
    return null;
  }

  try {
    const response = await cockpit.http(url, {
      method: 'GET',
      headers: { Accept: 'image/*' },
    });

    if (!response) return null;

    // Case 1: response has .blob() method (newer Cockpit API)
    if (typeof response.blob === 'function') {
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        return URL.createObjectURL(blob);
      }
      return null;
    }

    // Case 2: response is raw ArrayBuffer or binary string
    const body = response.body || response;
    if (body instanceof ArrayBuffer || body instanceof Uint8Array) {
      const blob = new Blob([body], { type: 'image/x-icon' });
      if (blob.size > 0) return URL.createObjectURL(blob);
      return null;
    }

    // Case 3: string response
    if (typeof body === 'string' && body.length > 0) {
      const blob = new Blob([body], { type: 'image/x-icon' });
      if (blob.size > 0) return URL.createObjectURL(blob);
      return null;
    }

    return null;
  } catch (_e) {
    // TLS error, timeout, unreachable, etc. → default icon
    return null;
  }
}

/**
 * Build the favicon URL from a service entry.
 * Respects per-service httpsMode for protocol selection.
 */
function getFaviconUrl(service: ServiceEntry): string {
  const resolvedUrl = resolveServiceUrl(service.url, service.httpsMode);
  try {
    const urlObj = new URL(resolvedUrl);
    return `${urlObj.origin}/favicon.ico`;
  } catch {
    return `${resolvedUrl}/favicon.ico`;
  }
}

export function useIconFetcher(service: ServiceEntry): UseIconFetcherReturn {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(service.iconType !== 'none');
  const [error, setError] = useState<boolean>(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Case 1: No icon requested
      if (service.iconType === 'none') {
        setLoading(false);
        return;
      }

      // Case 2: Custom URL
      if (service.iconType === 'url' && service.iconUrl) {
        setLoading(true);
        const result = await fetchViaCockpitHttp(service.iconUrl);
        if (cancelled) return;
        if (result) {
          setIconSrc(result);
        } else {
          setError(true);
        }
        setLoading(false);
        return;
      }

      // Case 3: Auto-fetch /favicon.ico
      if (service.iconType === 'auto') {
        setLoading(true);
        const faviconUrl = getFaviconUrl(service);
        const result = await fetchViaCockpitHttp(faviconUrl);
        if (cancelled) return;
        if (result) {
          setIconSrc(result);
        } else {
          setError(true);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    setIconSrc(null);
    setError(false);
    load();

    return () => { cancelled = true; };
  }, [service.id, service.iconType, service.iconUrl, service.url]);

  return { iconSrc, loading, error };
}
