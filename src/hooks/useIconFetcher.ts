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

    // Case 1: response is the raw body directly (ArrayBuffer, Uint8Array) — older Cockpit
    if (response instanceof ArrayBuffer || response instanceof Uint8Array) {
      const blob = new Blob([response], { type: 'image/x-icon' });
      return blob.size > 0 ? URL.createObjectURL(blob) : null;
    }

    // Case 2: response is a raw string (older Cockpit)
    if (typeof response === 'string' && response.length > 0) {
      const blob = new Blob([response], { type: 'image/x-icon' });
      return blob.size > 0 ? URL.createObjectURL(blob) : null;
    }

    // Case 3: response is an object with .blob() method (new Cockpit API)
    if (response && typeof response.blob === 'function') {
      const blob = await response.blob();
      return (blob && blob.size > 0) ? URL.createObjectURL(blob) : null;
    }

    // Case 4: response has .body property (ArrayBuffer or string)
    const body = (response as any).body;
    if (body) {
      const blob = new Blob([body], { type: 'image/x-icon' });
      return blob.size > 0 ? URL.createObjectURL(blob) : null;
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
