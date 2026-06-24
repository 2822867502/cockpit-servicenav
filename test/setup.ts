/**
 * Jest setup file — runs before each test suite via `setupFiles`.
 *
 * IMPORTANT: `setupFiles` runs before Jest globals (beforeAll, beforeEach,
 * expect, etc.) are available. Only put mocking/initialization code here
 * that does NOT depend on Jest globals.
 */

// Install the cockpit mock and window.location mock on the global scope
import './__mocks__/cockpit';
