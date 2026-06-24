/**
 * useIconFetcher — returns the favicon URL for a service.
 * Simple: just the URL string. The <img> tag in ServiceIcon handles display.
 * Browser handles .ico format natively.
 */

import { useMemo } from 'react';
import type { ServiceEntry } from '../lib/types';
import { resolveServiceUrl } from '../lib/url';

export interface UseIconFetcherReturn {
  iconSrc: string | null;
  loading: boolean;
  error: boolean;
}

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
  const iconSrc = useMemo(() => {
    if (service.iconType === 'none') return null;
    if (service.iconType === 'url' && service.iconUrl) return service.iconUrl;
    if (service.iconType === 'auto') return getFaviconUrl(service);
    return null;
  }, [service.id, service.iconType, service.iconUrl, service.url]);

  // No loading state — browser handles async image loading
  // No error state — browser shows broken-image icon on failure (acceptable)
  return { iconSrc, loading: false, error: false };
}
