/**
 * Form validation utilities for the servicenav plugin.
 */

import type { ServiceFormData, ValidationErrors } from './types';
import { _ } from './i18n';

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_URL_LENGTH = 2048;
const MAX_ICON_URL_LENGTH = 2048;

/** Check if input is relative port with optional path: "8080" or "9090/admin" */
function isRelativePort(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  const match = trimmed.match(/^(\d+)(\/.*)?$/);
  if (!match) return false;
  const port = parseInt(match[1], 10);
  return port >= 1 && port <= 65535;
}

/** Check if input is "protocol://:PORT/path" format (missing hostname) */
function isProtocolRelative(input: string): boolean {
  return /^https?:\/\/:\d+(\/.*)?$/i.test(input.trim());
}

export function validateServiceName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return _('Name is required.');
  if (trimmed.length > MAX_NAME_LENGTH) return _('Name must be 100 characters or fewer.');
  return null;
}

export function validateServiceUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) return _('URL or port is required.');
  if (trimmed.length > MAX_URL_LENGTH) return _('URL must be 2048 characters or fewer.');

  // Relative port: "8080" or "9090/admin"
  if (isRelativePort(trimmed)) return null;

  // Protocol-relative: "http://:5080/path" or "https://:8443/icon.svg"
  if (isProtocolRelative(trimmed)) return null;

  // Absolute URL with hostname
  if (/^https?:\/\//i.test(trimmed)) {
    try { new URL(trimmed); return null; } catch { /* fall through */ }
  }

  return _('Invalid format. Use absolute URL (https://...), port (8080), or port+path (9090/admin).');
}

export function validateIconUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) return null; // optional field
  if (trimmed.length > MAX_ICON_URL_LENGTH) return _('Icon URL must be 2048 characters or fewer.');

  // Protocol-relative: "http://:5080/path"
  if (isProtocolRelative(trimmed)) return null;

  // Relative port+path: "5080/static/img/logo.svg"
  if (isRelativePort(trimmed)) return null;

  // Absolute URL
  if (/^https?:\/\//i.test(trimmed)) {
    try { new URL(trimmed); return null; } catch { /* fall through */ }
  }

  return _('Invalid icon URL. Use absolute URL or relative port+path.');
}

export function validateDescription(description: string): string | null {
  const trimmed = description.trim();
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) return _('Description must be 500 characters or fewer.');
  return null;
}

export function validateServiceForm(data: ServiceFormData): ValidationErrors {
  const errors: ValidationErrors = {};
  const nameError = validateServiceName(data.name);
  if (nameError) errors.name = nameError;
  const urlError = validateServiceUrl(data.url);
  if (urlError) errors.url = urlError;
  if (data.iconType === 'url') {
    const iconUrlError = validateIconUrl(data.iconUrl);
    if (iconUrlError) errors.iconUrl = iconUrlError;
  }
  const descError = validateDescription(data.description);
  if (descError) errors.description = descError;
  return Object.keys(errors).length > 0 ? errors : null;
}
