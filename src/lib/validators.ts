/**
 * Form validation utilities for the servicenav plugin.
 *
 * Validates service configuration data before saving to the config file.
 * All validators return null for valid input, or an error message string for invalid input.
 */

import type { ServiceFormData, ValidationErrors } from './types';
import { isRelativePort } from './url';

/** Maximum length for service name */
const MAX_NAME_LENGTH = 100;

/** Maximum length for service description */
const MAX_DESCRIPTION_LENGTH = 500;

/** Maximum length for icon URL */
const MAX_ICON_URL_LENGTH = 2048;

/** Maximum length for service URL */
const MAX_URL_LENGTH = 2048;

/**
 * Validate a service name.
 *
 * Requirements:
 * - Non-empty after trimming whitespace
 * - Between 1 and 100 characters
 *
 * @returns Error message string, or null if valid
 */
export function validateServiceName(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return 'Service name is required.';
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Service name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  return null;
}

/**
 * Validate a service URL/port.
 *
 * Accepts:
 * - Absolute HTTP/HTTPS URLs: "https://example.com:3000"
 * - Relative port numbers: "8080"
 * - Relative port with path: "9090/admin"
 *
 * @returns Error message string, or null if valid
 */
export function validateServiceUrl(url: string): string | null {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return 'URL or port is required.';
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    return `URL must be ${MAX_URL_LENGTH} characters or fewer.`;
  }

  // Check if it's a relative port
  if (isRelativePort(trimmed)) {
    return null; // Valid relative port
  }

  // Check if it's a valid absolute URL with http/https scheme
  const urlPattern = /^https?:\/\/.+/i;
  if (urlPattern.test(trimmed)) {
    try {
      // Use URL constructor for validation (browser environment)
      new URL(trimmed);
      return null;
    } catch {
      return 'Invalid URL format. Please enter a valid URL (e.g., https://example.com:3000) or a port number (e.g., 8080).';
    }
  }

  return 'Invalid format. Enter an absolute URL (https://...) or a port number (e.g., 8080 or 9090/admin).';
}

/**
 * Validate an icon URL.
 *
 * Requirements:
 * - Must be a valid HTTP/HTTPS URL
 * - Max length: 2048 characters
 * - Empty string is valid (optional field)
 *
 * @returns Error message string, or null if valid
 */
export function validateIconUrl(url: string): string | null {
  const trimmed = url.trim();

  // Empty is valid (optional field)
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > MAX_ICON_URL_LENGTH) {
    return `Icon URL must be ${MAX_ICON_URL_LENGTH} characters or fewer.`;
  }

  // Must be http or https
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'Icon URL must start with http:// or https://.';
  }

  try {
    new URL(trimmed);
    return null;
  } catch {
    return 'Invalid icon URL format.';
  }
}

/**
 * Validate a service description.
 *
 * Requirements:
 * - Optional field (empty is valid)
 * - Max length: 500 characters
 *
 * @returns Error message string, or null if valid
 */
export function validateDescription(description: string): string | null {
  const trimmed = description.trim();

  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  return null;
}

/**
 * Validate all fields of a service form.
 *
 * Runs each field validator and collects errors.
 * Returns null if all fields are valid, or an error map otherwise.
 *
 * @param data - The form data to validate
 * @returns Validation errors keyed by field name, or null if all valid
 */
export function validateServiceForm(data: ServiceFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  const nameError = validateServiceName(data.name);
  if (nameError) {
    errors.name = nameError;
  }

  const urlError = validateServiceUrl(data.url);
  if (urlError) {
    errors.url = urlError;
  }

  // Only validate iconUrl if iconType is 'url'
  if (data.iconType === 'url') {
    const iconUrlError = validateIconUrl(data.iconUrl);
    if (iconUrlError) {
      errors.iconUrl = iconUrlError;
    }
  }

  const descError = validateDescription(data.description);
  if (descError) {
    errors.description = descError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
