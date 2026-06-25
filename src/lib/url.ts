/**
 * URL resolution utilities for the servicenav plugin.
 *
 * Handles two types of service URLs:
 * 1. Absolute URLs: "https://example.com:3000" - returned as-is (protocol NOT overridden)
 * 2. Relative ports: "8080" or "9090/admin" - resolved using current Cockpit hostname
 *    with protocol determined by the httpsMode setting.
 */

import type { HttpsMode } from './types';

/**
 * Check if a service URL input is a relative port specification.
 *
 * Relative ports are: just a number ("8080"), or a port with path ("9090/admin").
 * They do NOT include a protocol or full hostname.
 *
 * Examples:
 *   "8080"        -> true
 *   "9090/admin"  -> true
 *   "3000/api/v1" -> true
 *   "https://example.com" -> false
 *   "http://localhost:3000" -> false
 *   "not-a-url"   -> false
 */
export function isRelativePort(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // If it starts with a protocol, it's absolute
  if (/^https?:\/\//i.test(trimmed)) return false;

  // Relative port: starts with a number (port) optionally followed by path
  // Must be a valid port number (1-65535) at the start
  const match = trimmed.match(/^(\d+)(\/.*)?$/);
  if (!match) return false;

  const port = parseInt(match[1], 10);
  return port >= 1 && port <= 65535;
}

/**
 * Get the current Cockpit origin (protocol + hostname + port if non-standard).
 *
 * Uses window.location to determine how the user is accessing Cockpit.
 * This is the base URL that relative ports will be resolved against.
 *
 * Example returns:
 *   "https://cockpit.example.com:9090"
 *   "http://192.168.1.100:8080"
 *   "https://myserver.local"
 */
export function getCurrentOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://localhost:9090'; // SSR/test fallback
  }
  return window.location.origin;
}

/**
 * Get the current Cockpit protocol (e.g., "https:" or "http:").
 */
export function getCurrentProtocol(): string {
  if (typeof window === 'undefined') return 'https:';
  return window.location.protocol;
}

/**
 * Get the current Cockpit hostname (e.g., "myserver.local" or "192.168.1.100").
 */
export function getCurrentHostname(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
}

/**
 * Resolve a service URL input into a full absolute URL.
 *
 * - If input is an absolute URL (starts with http:// or https://), returns as-is.
 * - If input is a relative port (e.g., "8080" or "9090/admin"), builds a full URL
 *   using the current Cockpit origin's protocol and hostname, but replaces the port.
 *
 * Examples (assuming Cockpit is accessed at https://10.0.2.1:9090):
 *   resolveServiceUrl("8080")        -> "https://10.0.2.1:8080"
 *   resolveServiceUrl("9090/admin")  -> "https://10.0.2.1:9090/admin"
 *   resolveServiceUrl("https://example.com:3000") -> "https://example.com:3000"
 *
 * @param input - The raw URL/port string from config
 * @returns Fully resolved absolute URL
 */
export function resolveServiceUrl(input: string, httpsMode: HttpsMode = 'follow'): string {
  const trimmed = input.trim();

  if (!trimmed) return '';

  // Protocol with missing hostname: "http://:5080/path" or "https://:8443/icon.svg"
  // Substitute current Cockpit hostname, keep the specified port and protocol
  const protoMatch = trimmed.match(/^(https?):\/\/:(\d+)(\/.*)?$/i);
  if (protoMatch) {
    const protocol = protoMatch[1] + ':';
    const port = protoMatch[2];
    const path = protoMatch[3] || '';
    const hostname = getCurrentHostname();
    return `${protocol}//${hostname}:${port}${path}`;
  }

  // Absolute URL with full hostname — NEVER override the user's explicit protocol+host
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Relative port specification — determine protocol from httpsMode
  const match = trimmed.match(/^(\d+)(\/.*)?$/);
  if (match) {
    const port = match[1];
    const path = match[2] || '';
    const hostname = getCurrentHostname();
    let protocol: string;
    if (httpsMode === 'https') {
      protocol = 'https:';
    } else if (httpsMode === 'http') {
      protocol = 'http:';
    } else {
      // 'follow' — use same protocol as current Cockpit page
      protocol = getCurrentProtocol();
    }
    return `${protocol}//${hostname}:${port}${path}`;
  }

  return trimmed;
}

/**
 * Extract the port number from a URL string.
 *
 * @returns The port number, or null if no explicit port is present.
 *
 * Examples:
 *   extractPort("https://host:8443/path") -> 8443
 *   extractPort("https://host/path") -> null
 *   extractPort("8080") -> 8080
 */
export function extractPort(url: string): number | null {
  const trimmed = url.trim();

  // Check for relative port first
  const relMatch = trimmed.match(/^(\d+)(\/.*)?$/);
  if (relMatch) {
    return parseInt(relMatch[1], 10);
  }

  // Check for port in absolute URL
  const urlObj = parseUrl(trimmed);
  if (urlObj && urlObj.port) {
    return parseInt(urlObj.port, 10);
  }

  return null;
}

/**
 * Lightweight URL parsing (avoids DOM URL constructor issues in test environments).
 */
interface ParsedUrl {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
}

function parseUrl(url: string): ParsedUrl | null {
  const match = url.match(
    /^(https?):\/\/([^/:]+)(?::(\d+))?(\/.*)?$/i
  );
  if (!match) return null;

  return {
    protocol: match[1],
    hostname: match[2],
    port: match[3] || '',
    pathname: match[4] || '/',
  };
}
