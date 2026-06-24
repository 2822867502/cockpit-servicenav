/**
 * Jest setup file — runs before each test suite via `setupFiles`.
 *
 * IMPORTANT: `setupFiles` runs before Jest globals (beforeAll, beforeEach,
 * expect, etc.) are available. Only put mocking/initialization code here
 * that does NOT depend on Jest globals.
 */

// Install the cockpit mock and window.location mock on the global scope
import './__mocks__/cockpit';

// Override navigator.language to 'en' so tests use English
Object.defineProperty(navigator, 'language', {
  value: 'en',
  writable: true,
  configurable: true,
});

// Initialize i18n — forces English since navigator.language='en'
import { initI18n } from '../src/lib/i18n';
initI18n();
