/**
 * Jest setup file — runs before each test suite via `setupFiles`.
 *
 * IMPORTANT: `setupFiles` runs before Jest globals (beforeAll, beforeEach,
 * expect, etc.) are available. Only put mocking/initialization code here
 * that does NOT depend on Jest globals.
 */

// Install the cockpit mock and window.location mock on the global scope
import './__mocks__/cockpit';

// Initialize i18n (detects language from mock cockpit.language = 'en')
import { initI18n } from '../src/lib/i18n';
initI18n();
