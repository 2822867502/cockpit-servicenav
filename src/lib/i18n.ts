/**
 * Internationalization (i18n) support for the servicenav plugin.
 *
 * Uses Cockpit's built-in gettext mechanism when running inside the Cockpit shell.
 * Falls back to an identity function (returning the input string) in dev/test.
 *
 * Usage in components:
 *   import { _ } from '../lib/i18n';
 *   const label = _('Service Navigation');
 *
 * The `_` function is also exposed globally (window._) for convenience.
 */

/**
 * Translation function. Returns the translated string if a translation
 * exists, otherwise returns the original English string.
 *
 * In Cockpit's production environment, this uses cockpit.gettext()
 * which picks up translations from compiled PO files.
 *
 * In dev/test, it acts as an identity function (input = output).
 */
export function _(text: string): string {
  if (typeof window !== 'undefined') {
    const cockpit = (window as any).cockpit;
    if (cockpit && typeof cockpit.gettext === 'function') {
      return cockpit.gettext(text);
    }
  }
  return text;
}

/**
 * Plural-aware translation function.
 *
 * @param singular - English singular form
 * @param plural - English plural form
 * @param count - The quantity determining which form to use
 */
export function ngettext(singular: string, plural: string, count: number): string {
  if (typeof window !== 'undefined') {
    const cockpit = (window as any).cockpit;
    if (cockpit && typeof cockpit.ngettext === 'function') {
      return cockpit.ngettext(singular, plural, count);
    }
  }
  return count === 1 ? singular : plural;
}

/**
 * Initialize i18n.
 *
 * In production (Cockpit shell), PO data is loaded by Cockpit automatically.
 * This function is a no-op in that case. In dev, it makes `_` globally available.
 */
export function initI18n(): void {
  // Expose _ globally for convenience in non-module contexts
  if (typeof window !== 'undefined') {
    (window as any)._ = _;
  }
}

// Auto-initialize
initI18n();
