/**
 * Tests for useIconFetcher — cockpit.http() based icon loading.
 *
 * The hook now uses cockpit.http() EXCLUSIVELY — no <img> fallback.
 * Tests mock cockpit.http() to return blobs or reject.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useIconFetcher } from '../../src/hooks/useIconFetcher';
import type { ServiceEntry } from '../../src/lib/types';

// Mock URL.createObjectURL since jsdom may not fully support it
const mockObjectUrl = 'blob:mock-icon-url';
URL.createObjectURL = jest.fn(() => mockObjectUrl);

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

function mockHttpSuccess() {
  const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
  const cockpit = (window as any).cockpit;
  cockpit.http.mockResolvedValue({
    blob: () => Promise.resolve(mockBlob),
    status: 200,
  });
}

function mockHttpFailure() {
  const cockpit = (window as any).cockpit;
  cockpit.http.mockRejectedValue(new Error('TLS handshake failure'));
}

describe('useIconFetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (URL.createObjectURL as jest.Mock).mockReturnValue(mockObjectUrl);
    mockHttpFailure(); // default: TLS failure
  });

  it('returns loading=false immediately for iconType "none" (no network)', () => {
    const svc = { ...baseService, iconType: 'none' as const };
    const { result } = renderHook(() => useIconFetcher(svc));
    expect(result.current.loading).toBe(false);
    expect(result.current.iconSrc).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it('sets error when cockpit.http() fails (TLS error → default icon)', async () => {
    mockHttpFailure();
    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.iconSrc).toBeNull();
  });

  it('sets iconSrc on successful cockpit.http() fetch', async () => {
    mockHttpSuccess();
    const svc = { ...baseService, iconType: 'auto' as const };
    const { result } = renderHook(() => useIconFetcher(svc));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.iconSrc).toBe(mockObjectUrl);
    expect(result.current.error).toBe(false);
  });

  it('uses custom URL when iconType is "url"', async () => {
    mockHttpSuccess();
    const svc = {
      ...baseService,
      iconType: 'url' as const,
      iconUrl: 'https://example.com/icon.png',
    };
    const { result } = renderHook(() => useIconFetcher(svc));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.iconSrc).toBe(mockObjectUrl);
    expect((window as any).cockpit.http).toHaveBeenCalledWith(
      'https://example.com/icon.png',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('resets state when service changes', async () => {
    mockHttpSuccess();
    const svc1 = { ...baseService, id: 'svc-1', iconType: 'auto' as const };
    const { result, rerender } = renderHook(
      ({ svc }) => useIconFetcher(svc),
      { initialProps: { svc: svc1 } }
    );

    await waitFor(() => expect(result.current.iconSrc).toBe(mockObjectUrl));

    // Switch to 'none' icon service
    const svc2 = { ...baseService, id: 'svc-2', iconType: 'none' as const };
    rerender({ svc: svc2 });

    expect(result.current.iconSrc).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('passes resolved favicon URL to cockpit.http() for auto mode', async () => {
    mockHttpSuccess();
    const svc = { ...baseService, iconType: 'auto' as const };
    renderHook(() => useIconFetcher(svc));

    await waitFor(() => {
      expect((window as any).cockpit.http).toHaveBeenCalledWith(
        expect.stringContaining('favicon.ico'),
        expect.anything()
      );
    });
  });

  it('never throws even if cockpit.http is not a function', () => {
    const oldHttp = (window as any).cockpit.http;
    delete (window as any).cockpit.http;

    const svc = { ...baseService, iconType: 'auto' as const };
    expect(() => renderHook(() => useIconFetcher(svc))).not.toThrow();

    (window as any).cockpit.http = oldHttp;
  });
});
