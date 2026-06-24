/**
 * Tests for lib/url.ts — URL resolution utilities.
 */

import {
  resolveServiceUrl,
  isRelativePort,
  getCurrentOrigin,
  getCurrentProtocol,
  getCurrentHostname,
  extractPort,
} from '../../src/lib/url';

describe('isRelativePort', () => {
  it('returns true for a plain port number', () => {
    expect(isRelativePort('8080')).toBe(true);
  });

  it('returns true for a port number with path', () => {
    expect(isRelativePort('9090/admin')).toBe(true);
  });

  it('returns true for port with deep path', () => {
    expect(isRelativePort('3000/api/v1/users')).toBe(true);
  });

  it('returns true for port 1 (minimum valid)', () => {
    expect(isRelativePort('1')).toBe(true);
  });

  it('returns true for port 65535 (maximum valid)', () => {
    expect(isRelativePort('65535')).toBe(true);
  });

  it('returns false for absolute HTTP URL', () => {
    expect(isRelativePort('https://example.com')).toBe(false);
  });

  it('returns false for absolute HTTPS URL with port', () => {
    expect(isRelativePort('https://example.com:3000')).toBe(false);
  });

  it('returns false for absolute HTTP URL', () => {
    expect(isRelativePort('http://192.168.1.100:8080')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isRelativePort('')).toBe(false);
  });

  it('returns false for whitespace only', () => {
    expect(isRelativePort('   ')).toBe(false);
  });

  it('returns false for non-numeric non-URL string', () => {
    expect(isRelativePort('not-a-url')).toBe(false);
  });

  it('returns false for port number 0 (invalid port)', () => {
    expect(isRelativePort('0')).toBe(false);
  });

  it('returns false for port number 65536 (out of range)', () => {
    expect(isRelativePort('65536')).toBe(false);
  });

  it('returns false for number that looks like port but exceeds range', () => {
    expect(isRelativePort('99999')).toBe(false);
  });
});

describe('resolveServiceUrl', () => {
  it('resolves plain port to full URL using current origin', () => {
    // window.location.origin is mocked as 'https://test-host:9090'
    // hostname is 'test-host', protocol is 'https:'
    const result = resolveServiceUrl('8080');
    expect(result).toBe('https://test-host:8080');
  });

  it('resolves port with path using current origin', () => {
    const result = resolveServiceUrl('9090/admin');
    expect(result).toBe('https://test-host:9090/admin');
  });

  it('resolves port with deep path', () => {
    const result = resolveServiceUrl('3000/api/v1/status');
    expect(result).toBe('https://test-host:3000/api/v1/status');
  });

  it('returns absolute HTTPS URL unchanged', () => {
    const url = 'https://grafana.example.com:3000';
    expect(resolveServiceUrl(url)).toBe(url);
  });

  it('returns absolute HTTP URL unchanged', () => {
    const url = 'http://192.168.1.100:8080';
    expect(resolveServiceUrl(url)).toBe(url);
  });

  it('returns empty string for empty input', () => {
    expect(resolveServiceUrl('')).toBe('');
  });

  it('handles whitespace around port number (trims)', () => {
    const result = resolveServiceUrl('  8080  ');
    expect(result).toBe('https://test-host:8080');
  });

  it('returns input unchanged for unrecognized format', () => {
    // Fallback behavior
    expect(resolveServiceUrl('not-a-valid-url')).toBe('not-a-valid-url');
  });
});

describe('getCurrentOrigin', () => {
  it('returns the mocked window.location.origin', () => {
    expect(getCurrentOrigin()).toBe('https://test-host:9090');
  });
});

describe('getCurrentProtocol', () => {
  it('returns https: from mock', () => {
    expect(getCurrentProtocol()).toBe('https:');
  });
});

describe('getCurrentHostname', () => {
  it('returns test-host from mock', () => {
    expect(getCurrentHostname()).toBe('test-host');
  });
});

describe('extractPort', () => {
  it('extracts port from absolute URL', () => {
    expect(extractPort('https://example.com:8443/admin')).toBe(8443);
  });

  it('extracts port from absolute HTTP URL', () => {
    expect(extractPort('http://localhost:3000')).toBe(3000);
  });

  it('returns null for URL without explicit port', () => {
    expect(extractPort('https://example.com/admin')).toBeNull();
  });

  it('extracts port from relative port string', () => {
    expect(extractPort('8080')).toBe(8080);
  });

  it('extracts port from relative port with path', () => {
    expect(extractPort('9090/admin')).toBe(9090);
  });

  it('returns null for empty string', () => {
    expect(extractPort('')).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(extractPort('not-a-url')).toBeNull();
  });
});
