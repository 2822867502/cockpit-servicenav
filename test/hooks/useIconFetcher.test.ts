/**
 * Tests for useIconFetcher — synchronous URL resolution.
 */

import { renderHook } from '@testing-library/react';
import { useIconFetcher } from '../../src/hooks/useIconFetcher';
import type { ServiceEntry } from '../../src/lib/types';

const baseService: ServiceEntry = {
  id: 'test-1',
  name: 'Test',
  url: '8080',
  iconType: 'auto',
  iconUrl: null,
  description: '',
  httpsMode: 'follow',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useIconFetcher', () => {
  it('returns null for iconType "none"', () => {
    const svc = { ...baseService, iconType: 'none' as const };
    const { result } = renderHook(() => useIconFetcher(svc));
    expect(result.current.iconSrc).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns favicon URL for iconType "auto"', () => {
    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));
    expect(result.current.iconSrc).toContain('favicon.ico');
    expect(result.current.iconSrc).toBe('https://test-host:8080/favicon.ico');
  });

  it('returns custom URL for iconType "url" (absolute)', () => {
    const svc = { ...baseService, iconType: 'url' as const, iconUrl: 'https://example.com/icon.png' };
    const { result } = renderHook(() => useIconFetcher(svc));
    expect(result.current.iconSrc).toBe('https://example.com/icon.png');
  });

  it('resolves relative icon URL with current host for iconType "url"', () => {
    const svc = { ...baseService, iconType: 'url' as const, iconUrl: '5080/static/img/logo.svg', httpsMode: 'https' as const };
    const { result } = renderHook(() => useIconFetcher(svc));
    expect(result.current.iconSrc).toBe('https://test-host:5080/static/img/logo.svg');
  });

  it('respects httpsMode for relative port URLs', () => {
    const svc = { ...baseService, iconType: 'auto' as const, httpsMode: 'http' as const };
    const { result } = renderHook(() => useIconFetcher(svc));
    expect(result.current.iconSrc).toContain('http://test-host:8080/favicon.ico');
  });

  it('returns null for iconType "url" with empty iconUrl', () => {
    const svc = { ...baseService, iconType: 'url' as const, iconUrl: '' };
    const { result } = renderHook(() => useIconFetcher(svc));
    expect(result.current.iconSrc).toBeNull();
  });
});
