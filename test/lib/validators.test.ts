/**
 * Tests for lib/validators.ts — form validation utilities.
 */

import {
  validateServiceName,
  validateServiceUrl,
  validateIconUrl,
  validateDescription,
  validateServiceForm,
} from '../../src/lib/validators';
import type { ServiceFormData } from '../../src/lib/types';

describe('validateServiceName', () => {
  it('returns null for a valid name', () => {
    expect(validateServiceName('Portainer')).toBeNull();
  });

  it('returns null for name with unicode characters', () => {
    expect(validateServiceName('监控系统')).toBeNull();
  });

  it('returns error for empty string', () => {
    const result = validateServiceName('');
    expect(result).not.toBeNull();
    expect(result).toContain('required');
  });

  it('returns error for whitespace only', () => {
    const result = validateServiceName('   ');
    expect(result).not.toBeNull();
    expect(result).toContain('required');
  });

  it('returns error for name exceeding 100 characters', () => {
    const longName = 'a'.repeat(101);
    const result = validateServiceName(longName);
    expect(result).not.toBeNull();
    expect(result).toContain('100');
  });

  it('returns null for name exactly 100 characters', () => {
    const name = 'a'.repeat(100);
    expect(validateServiceName(name)).toBeNull();
  });

  it('trims whitespace before validation', () => {
    expect(validateServiceName('  Grafana  ')).toBeNull();
  });
});

describe('validateServiceUrl', () => {
  it('returns null for a valid port number', () => {
    expect(validateServiceUrl('8080')).toBeNull();
  });

  it('returns null for a port with path', () => {
    expect(validateServiceUrl('9090/admin')).toBeNull();
  });

  it('returns null for a valid absolute HTTPS URL', () => {
    expect(validateServiceUrl('https://example.com:3000')).toBeNull();
  });

  it('returns null for a valid absolute HTTP URL', () => {
    expect(validateServiceUrl('http://192.168.1.100:8080')).toBeNull();
  });

  it('returns null for URL without port', () => {
    expect(validateServiceUrl('https://myservice.local')).toBeNull();
  });

  it('returns null for URL with path', () => {
    expect(validateServiceUrl('https://example.com/dashboard')).toBeNull();
  });

  it('returns error for empty string', () => {
    const result = validateServiceUrl('');
    expect(result).not.toBeNull();
    expect(result).toContain('required');
  });

  it('returns error for non-URL, non-port input', () => {
    const result = validateServiceUrl('not.valid');
    expect(result).not.toBeNull();
  });

  it('returns error for FTP URL (wrong scheme)', () => {
    const result = validateServiceUrl('ftp://example.com');
    expect(result).not.toBeNull();
    expect(result).toContain('Invalid format');
  });

  it('returns error for invalid URL format', () => {
    const result = validateServiceUrl('http://');
    expect(result).not.toBeNull();
  });

  it('returns error for port 0', () => {
    const result = validateServiceUrl('0');
    expect(result).not.toBeNull();
  });

  it('returns error for port > 65535', () => {
    const result = validateServiceUrl('99999');
    expect(result).not.toBeNull();
  });

  it('returns error for exceeding max URL length', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2050);
    const result = validateServiceUrl(longUrl);
    expect(result).not.toBeNull();
    expect(result).toContain('2048');
  });
});

describe('validateIconUrl', () => {
  it('returns null for empty string (optional field)', () => {
    expect(validateIconUrl('')).toBeNull();
  });

  it('returns null for valid HTTPS URL', () => {
    expect(validateIconUrl('https://example.com/icon.png')).toBeNull();
  });

  it('returns null for valid HTTP URL', () => {
    expect(validateIconUrl('http://example.com/favicon.ico')).toBeNull();
  });

  it('returns error for URL without http/https', () => {
    const result = validateIconUrl('example.com/icon.png');
    expect(result).not.toBeNull();
    expect(result).toContain('http://');
  });

  it('returns error for invalid URL', () => {
    const result = validateIconUrl('not-a-url!!!');
    expect(result).not.toBeNull();
  });

  it('returns error for exceeding max length', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2060);
    const result = validateIconUrl(longUrl);
    expect(result).not.toBeNull();
    expect(result).toContain('2048');
  });
});

describe('validateDescription', () => {
  it('returns null for empty description (optional)', () => {
    expect(validateDescription('')).toBeNull();
  });

  it('returns null for a valid description', () => {
    expect(validateDescription('A monitoring dashboard for Prometheus metrics.')).toBeNull();
  });

  it('returns null for description exactly 500 chars', () => {
    const desc = 'a'.repeat(500);
    expect(validateDescription(desc)).toBeNull();
  });

  it('returns error for description exceeding 500 chars', () => {
    const desc = 'a'.repeat(501);
    const result = validateDescription(desc);
    expect(result).not.toBeNull();
    expect(result).toContain('500');
  });
});

describe('validateServiceForm', () => {
  const validForm: ServiceFormData = {
    name: 'Grafana',
    url: '3000',
    iconType: 'auto',
    iconUrl: '',
    description: 'Monitoring dashboards',
  };

  it('returns null for a completely valid form', () => {
    expect(validateServiceForm(validForm)).toBeNull();
  });

  it('returns errors for empty name and url', () => {
    const form: ServiceFormData = { ...validForm, name: '', url: '' };
    const errors = validateServiceForm(form);
    expect(errors).not.toBeNull();
    expect(errors!.name).toBeDefined();
    expect(errors!.url).toBeDefined();
  });

  it('validates iconUrl when iconType is url', () => {
    const form: ServiceFormData = {
      ...validForm,
      iconType: 'url',
      iconUrl: 'invalid-url',
    };
    const errors = validateServiceForm(form);
    expect(errors).not.toBeNull();
    expect(errors!.iconUrl).toBeDefined();
  });

  it('does not validate iconUrl when iconType is auto', () => {
    const form: ServiceFormData = {
      ...validForm,
      iconType: 'auto',
      iconUrl: '', // empty but not required in auto mode
    };
    expect(validateServiceForm(form)).toBeNull();
  });

  it('does not validate iconUrl when iconType is none', () => {
    const form: ServiceFormData = {
      ...validForm,
      iconType: 'none',
      iconUrl: '',
    };
    expect(validateServiceForm(form)).toBeNull();
  });

  it('validates description length', () => {
    const form: ServiceFormData = {
      ...validForm,
      description: 'a'.repeat(501),
    };
    const errors = validateServiceForm(form);
    expect(errors).not.toBeNull();
    expect(errors!.description).toBeDefined();
  });

  it('returns null for valid form with absolute URL', () => {
    const form: ServiceFormData = {
      ...validForm,
      url: 'https://grafana.internal:3000',
      iconType: 'url',
      iconUrl: 'https://example.com/icon.png',
    };
    expect(validateServiceForm(form)).toBeNull();
  });
});
