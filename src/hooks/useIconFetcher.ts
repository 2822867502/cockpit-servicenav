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
async function fetchViaCockpitHttp(fullUrl: string): Promise<string | null> {
  const cockpit = (window as any).cockpit;
  if (!cockpit || typeof cockpit.http !== 'function') {
    console.warn('[IconFetch] cockpit.http 不可用');
    return null;
  }

  try {
    // cockpit.http() requires (hostPort, { path }), NOT a full URL.
    // Parse the URL into host:port and path components.
    const urlObj = new URL(fullUrl);
    const hostPort = urlObj.host;        // e.g. "10.0.2.1:23333"
    const requestPath = urlObj.pathname + urlObj.search; // e.g. "/favicon.ico"
    console.log('[IconFetch] 请求 hostPort:', hostPort, 'path:', requestPath);

    const response = await cockpit.http(hostPort, {
      method: 'GET',
      path: requestPath,
    });

    if (!response) {
      console.warn('[IconFetch] 响应为空:', fullUrl);
      return null;
    }

    console.log('[IconFetch] 响应类型:', typeof response,
      '字节长度:', (response as any).byteLength || (response as any).length);

    // Convert response to Blob (handles ArrayBuffer, string, Uint8Array, etc.)
    let blob: Blob;
    if (typeof response === 'string') {
      blob = new Blob([response], { type: 'image/x-icon' });
    } else {
      blob = new Blob([response], { type: 'image/x-icon' });
    }

    console.log('[IconFetch] Blob size:', blob.size);
    return blob.size > 0 ? URL.createObjectURL(blob) : null;
  } catch (e) {
    console.warn('[IconFetch] 请求失败:', fullUrl, e);
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
  const blobUrlRef = useRef<string | null>(null);

  // Revoke previous blob URL to prevent memory leaks
  const setIconSrcSafe = (url: string | null) => {
    if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = url;
    setIconSrc(url);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
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
          setIconSrcSafe(result);
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
          setIconSrcSafe(result);
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
