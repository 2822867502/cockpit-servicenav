/**
 * Tests for useIconFetcher hook.
 *
 * The hook now uses cockpit.http() as the primary loading method
 * with <img> as fallback. In tests, cockpit.http() is mocked to
 * reject (simulating TLS failure), so the <img> fallback path is tested.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useIconFetcher } from '../../src/hooks/useIconFetcher';
import type { ServiceEntry } from '../../src/lib/types';

// Mock global Image constructor for <img> fallback path
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
};
let imageConstructorCalls: Array<{ src: string; crossOrigin: string }> = [];

(global as any).Image = jest.fn().mockImplementation(() => {
  const img = {
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    src: '',
    crossOrigin: '',
  };
  // Intercept the src/crossOrigin assignments via defineProperty
  let _src = '';
  let _crossOrigin = '';
  Object.defineProperty(img, 'src', {
    get: () => _src,
    set: (v: string) => { _src = v; },
  });
  Object.defineProperty(img, 'crossOrigin', {
    get: () => _crossOrigin,
    set: (v: string) => { _crossOrigin = v; },
  });
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

    // Reset cockpit.http mock to default (rejects = TLS failure simulation)
    const cockpit = (window as any).cockpit;
    if (cockpit?.http?.mockRejectedValue) {
      cockpit.http.mockRejectedValue(new Error('Simulated TLS handshake failure'));
    }

    // jsdom doesn't fully implement URL.createObjectURL — provide a mock
    if (!URL.createObjectURL || typeof URL.createObjectURL !== 'function') {
      (URL as any).createObjectURL = jest.fn(() => 'blob:mock-url');
    }
  });

  it('returns loading=false immediately for iconType "none" (no network requests)', () => {
    const svc = { ...baseService, iconType: 'none' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    expect(result.current.loading).toBe(false);
    expect(result.current.iconSrc).toBeNull();
    expect(result.current.error).toBe(false);
    // No network requests should have been made
    expect(imageConstructorCalls.length).toBe(0);
  });

  it('falls back to <img> when cockpit.http() fails, then succeeds on image load', async () => {
    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    // Wait for cockpit.http() to reject + <img> fallback to be created
    await waitFor(() => {
      expect(imageConstructorCalls.length).toBeGreaterThan(0);
    });

    const lastImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    expect(lastImg.src).toContain('favicon.ico');

    // Simulate successful image load
    await act(async () => {
      lastImg.onload?.();
    });

    await waitFor(() => {
      expect(result.current.iconSrc).toBeTruthy();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(false);
    });
  });

  it('sets error when both cockpit.http() and <img> fallback fail', async () => {
    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    // Wait for <img> fallback to be created
    await waitFor(() => {
      expect(imageConstructorCalls.length).toBeGreaterThan(0);
    });

    const lastImg = imageConstructorCalls[imageConstructorCalls.length - 1];

    // Simulate image load failure
    await act(async () => {
      lastImg.onerror?.();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.iconSrc).toBeNull();
    });
  });

  it('uses custom URL when iconType is "url" (via cockpit.http + <img> fallback)', async () => {
    const svc = {
      ...baseService,
      iconType: 'url' as const,
      iconUrl: 'https://example.com/icon.png',
    };
    renderHook(() => useIconFetcher(svc));

    // Wait for fallback <img> to be created
    await waitFor(() => {
      expect(imageConstructorCalls.length).toBeGreaterThan(0);
    });

    const lastImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    expect(lastImg.src).toBe('https://example.com/icon.png');
  });

  it('resets state when service changes', async () => {
    const svc1 = { ...baseService, id: 'svc-1', iconType: 'auto' as const };
    const { result, rerender } = renderHook(
      ({ svc }) => useIconFetcher(svc),
      { initialProps: { svc: svc1 } }
    );

    // Wait for fallback and simulate load
    await waitFor(() => {
      expect(imageConstructorCalls.length).toBeGreaterThan(0);
    });
    const firstImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    await act(async () => { firstImg.onload?.(); });
    await waitFor(() => expect(result.current.iconSrc).toBeTruthy());

    // Reset counter
    imageConstructorCalls = [];

    // Switch to a different service with iconType 'none'
    const svc2 = { ...baseService, id: 'svc-2', iconType: 'none' as const };
    rerender({ svc: svc2 });

    expect(result.current.iconSrc).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles cockpit.http() success (returns blob URL), skipping <img> fallback', async () => {
    const cockpit = (window as any).cockpit;
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });

    // Mock successful cockpit.http()
    cockpit.http.mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
      status: 200,
    });

    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have loaded successfully via cockpit.http (blob URL)
    expect(result.current.iconSrc).toBeTruthy();
    expect(result.current.iconSrc).toContain('blob:');
    expect(result.current.error).toBe(false);
  });

  it('never throws — even if fetching encounters unexpected errors', async () => {
    // Simulate a completely broken cockpit.http
    const cockpit = (window as any).cockpit;
    cockpit.http.mockImplementation(() => {
      throw new Error('Unexpected crash in cockpit.http');
    });

    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    // Wait for cockpit.http() to be called and throw, then for <img> fallback
    await waitFor(() => {
      expect(imageConstructorCalls.length).toBeGreaterThan(0);
    });

    // Trigger the img onerror to simulate complete failure
    const lastImg = imageConstructorCalls[imageConstructorCalls.length - 1];
    await act(async () => {
      lastImg.onerror?.();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // The hook should survive with error state
    expect(result.current.error).toBe(true);
    expect(result.current.loading).toBe(false);
  });
});
