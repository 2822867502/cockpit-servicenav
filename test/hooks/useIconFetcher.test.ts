/**
 * Tests for useIconFetcher hook.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useIconFetcher } from '../../src/hooks/useIconFetcher';
import type { ServiceEntry } from '../../src/lib/types';

// Mock global Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
};
let imageConstructorCalls: Array<{ src: string }> = [];

(global as any).Image = jest.fn().mockImplementation(() => {
  const img = { ...mockImage };
  imageConstructorCalls.push(img);
  return img;
});

const baseService: ServiceEntry = {
  id: 'test-1',
  name: 'Test',
  url: '8080',
  iconType: 'auto',
  iconUrl: null,
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useIconFetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    imageConstructorCalls = [];
    mockImage.onload = null;
    mockImage.onerror = null;
    mockImage.src = '';
  });

  it('returns loading=false immediately for iconType "none"', () => {
    const svc = { ...baseService, iconType: 'none' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    expect(result.current.loading).toBe(false);
    expect(result.current.iconSrc).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it('attempts to load favicon for iconType "auto"', () => {
    const svc = { ...baseService, iconType: 'auto' as const };
    renderHook(() => useIconFetcher(svc));

    // Should have created an Image with the favicon URL
    expect(imageConstructorCalls.length).toBeGreaterThan(0);
    const img = imageConstructorCalls[imageConstructorCalls.length - 1];
    expect(img.src).toContain('favicon.ico');
  });

  it('sets iconSrc on successful auto-fetch', async () => {
    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    // Simulate successful image load
    const lastImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    lastImg.onload?.();

    await waitFor(() => {
      expect(result.current.iconSrc).toBeTruthy();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(false);
    });
  });

  it('sets error on failed auto-fetch', async () => {
    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    // Simulate failed image load
    const lastImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    lastImg.onerror?.();

    await waitFor(() => {
      expect(result.current.error).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  it('uses custom URL when iconType is "url"', () => {
    const svc = {
      ...baseService,
      iconType: 'url' as const,
      iconUrl: 'https://example.com/icon.png',
    };
    renderHook(() => useIconFetcher(svc));

    const lastImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    expect(lastImg.src).toBe('https://example.com/icon.png');
  });

  it('resets state when service changes', async () => {
    const svc1 = { ...baseService, id: 'svc-1', iconType: 'auto' as const };
    const { result, rerender } = renderHook(
      ({ svc }) => useIconFetcher(svc),
      { initialProps: { svc: svc1 } }
    );

    // Load first icon
    const firstImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    firstImg.onload?.();
    await waitFor(() => expect(result.current.iconSrc).toBeTruthy());

    // Switch to a different service
    const svc2 = {
      ...baseService,
      id: 'svc-2',
      iconType: 'none' as const,
    };
    rerender({ svc: svc2 });

    expect(result.current.iconSrc).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
