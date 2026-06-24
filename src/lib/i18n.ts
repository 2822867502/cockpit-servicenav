/**
 * Internationalization (i18n) support for the servicenav plugin.
 *
 * Uses embedded JS translation maps — no dependency on Cockpit's
 * PO file loading. Translations are inlined at build time.
 *
 * Language detection priority (FIXED — navigator.language checked FIRST):
 *   1. navigator.language — browser's actual language preference
 *   2. cockpit.locale() return value — Cockpit's locale (if available)
 *   3. cockpit.language — Cockpit's language setting (often defaults to 'en')
 *   4. Fallback to 'zh_CN' — plugin default is Chinese
 *
 * Usage:
 *   import { _ } from '../lib/i18n';
 *   const label = _('Service Navigation');
 */

// ---- Translation Maps ----

const zhCN: Record<string, string> = {
  // Page & header
  'Service Navigation': '服务导航',
  'Add Service': '添加服务',

  // Actions
  'Edit': '编辑',
  'Delete': '删除',
  'Save': '保存',
  'Cancel': '取消',

  // View toggle
  'Grid': '网格',
  'Grid view': '网格视图',
  'List': '列表',
  'List view': '列表视图',
  'View mode toggle': '视图模式切换',

  // Card
  'Click to open in new tab': '点击在新标签页中打开',
  'Port': '端口',
  'Updated': '更新于',

  // List
  'Actions for': '操作 -',

  // Empty state
  'No services configured yet. Add your first service to get started.':
    '尚未配置任何服务。请添加您的第一个服务以开始使用。',

  // Modal titles
  'Edit Service': '编辑服务',
  'Delete Service': '删除服务',

  // Modal aria labels
  'Edit service form': '编辑服务表单',
  'Add service form': '添加服务表单',
  'Delete service confirmation': '删除服务确认',

  // Form fields
  'Name': '名称',
  'URL or Port': 'URL 或端口',
  'Icon': '图标',
  'Icon URL': '图标 URL',
  'Description': '描述',

  // Form placeholders
  'e.g., Portainer, Grafana, Wiki': '例如：Portainer、Grafana、Wiki',
  'https://example.com:3000 or just 8080':
    'https://example.com:3000 或直接填 8080',
  'Optional brief description of this service': '可选的服务简要描述',

  // Form help text
  'Enter a full URL (https://...) or just a port number (e.g., 8080). Relative ports use the current Cockpit host and protocol.':
    '输入完整 URL（https://...）或仅输入端口号（如 8080）。相对端口将使用当前 Cockpit 的主机地址和协议。',
  'Resolved URL': '解析后的 URL',

  // Icon types
  'Auto-fetch favicon from service': '自动获取服务图标',
  'Try to load /favicon.ico from the service URL automatically.':
    '尝试自动从服务 URL 加载 /favicon.ico。',
  'Custom icon URL': '自定义图标 URL',
  'Use a custom icon from any HTTP/HTTPS URL.':
    '使用任意 HTTP/HTTPS URL 的自定义图标。',
  'Default icon': '默认图标',
  'Use the default cube icon.': '使用默认的立方体图标。',

  // Delete confirmation
  'Are you sure you want to delete the service': '您确定要删除服务',
  'This action cannot be undone. The service link will be removed from the navigation panel.':
    '此操作不可撤消。该服务链接将从导航面板中移除。',

  // Loading & error
  'Loading services': '正在加载服务',
  'Error': '错误',

  // Error boundary
  'An unexpected error occurred while loading the service navigation panel.':
    '加载服务导航面板时发生意外错误。',
  'Retry': '重试',
};

// All supported language maps (keyed by various locale code formats)
const translations: Record<string, Record<string, string>> = {
  zh_CN: zhCN,
  'zh_CN.UTF-8': zhCN,
  zh: zhCN,
  'zh-CN': zhCN,
  'zh-Hans': zhCN,
  'zh-Hans-CN': zhCN,
  'zh-TW': zhCN,
  'zh-Hant': zhCN,
  'zh-HK': zhCN,
  'zh-SG': zhCN,
  'chinese': zhCN,
  'zh-cn': zhCN,  // lowercase variant from cockpit.locale()
};

// ---- Language Detection ----

let currentLang = 'zh_CN'; // DEFAULT to Chinese (not English)

/**
 * Detect the user's preferred language.
 *
 * Priority (FIXED):
 *   1. navigator.language — browser's actual language (most reliable)
 *   2. cockpit.locale() — Cockpit's locale (may return 'zh-cn')
 *   3. cockpit.language — Cockpit setting (least reliable, defaults to 'en')
 *   4. Fallback: 'zh_CN' (plugin default)
 */
function detectLanguage(): string {
  const sources: string[] = [];

  // 1. Browser language — most reliable indicator of user preference
  if (typeof navigator !== 'undefined' && navigator.language) {
    sources.push(`navigator.language=${navigator.language}`);
    if (/^zh/i.test(navigator.language)) {
      console.log('[servicenav] Language: navigator.language → zh_CN');
      return 'zh_CN';
    }
  }

  // 2. cockpit.locale() — some Cockpit versions return locale this way
  try {
    const cockpit = (window as any).cockpit;
    if (cockpit && typeof cockpit.locale === 'function') {
      // Call without arguments — may return current locale string
      const localeResult = cockpit.locale();
      if (typeof localeResult === 'string' && localeResult.length > 0) {
        sources.push(`cockpit.locale()=${localeResult}`);
        const normalizedLocale = localeResult.toLowerCase().replace(/-/g, '_');
        if (normalizedLocale.includes('zh')) {
          console.log('[servicenav] Language: cockpit.locale() → zh_CN');
          return 'zh_CN';
        }
      }
    }
  } catch (_e) {
    // cockpit.locale() might throw if called without PO data
    sources.push('cockpit.locale() threw');
  }

  // 3. cockpit.language — least reliable (often defaults to 'en')
  try {
    const cockpit = (window as any).cockpit;
    if (cockpit && typeof cockpit.language === 'string' && cockpit.language) {
      sources.push(`cockpit.language=${cockpit.language}`);
      if (/^zh/i.test(cockpit.language)) {
        console.log('[servicenav] Language: cockpit.language → zh_CN');
        return 'zh_CN';
      }
    }
  } catch (_e) { /* ignore */ }

  // 4. If browser language is explicitly English, use English
  if (typeof navigator !== 'undefined' && navigator.language && /^en/i.test(navigator.language)) {
    console.log('[servicenav] Language: English browser detected, using en');
    return 'en';
  }

  // 5. If cockpit.language is explicitly English, use English
  try {
    const cockpit = (window as any).cockpit;
    if (cockpit && typeof cockpit.language === 'string' && /^en/i.test(cockpit.language)) {
      console.log('[servicenav] Language: English cockpit detected, using en');
      return 'en';
    }
  } catch (_e) { /* ignore */ }

  // 6. Default to Chinese for all other cases (Chinese servers, unknown browsers, etc.)
  console.log('[servicenav] Language: defaulting to zh_CN. Sources checked:', sources.join(', '));
  return 'zh_CN';
}

/**
 * Initialize i18n. Detects language and exposes _() globally.
 */
export function initI18n(): void {
  currentLang = detectLanguage();
  console.log('[servicenav] i18n initialized. currentLang =', currentLang);
  // Verify: test translation of a known key
  const testResult = _('Service Navigation');
  console.log('[servicenav] _("Service Navigation") =', testResult);

  if (typeof window !== 'undefined') {
    (window as any)._ = _;
  }
}

/**
 * Translation function.
 */
export function _(text: string): string {
  // Try Cockpit gettext first (if PO data happens to be loaded externally)
  if (typeof window !== 'undefined') {
    try {
      const cockpit = (window as any).cockpit;
      if (cockpit && typeof cockpit.gettext === 'function') {
        const result = cockpit.gettext(text);
        if (result !== text && typeof result === 'string') {
          return result;
        }
      }
    } catch (_e) { /* ignore */ }
  }

  // Use embedded translation maps
  if (currentLang !== 'en' && translations[currentLang]) {
    const translated = translations[currentLang][text];
    if (translated) {
      return translated;
    }
  }

  // Fallback: return original (English) text
  return text;
}

/**
 * Plural-aware translation.
 */
export function ngettext(singular: string, plural: string, count: number): string {
  try {
    const cockpit = (window as any).cockpit;
    if (cockpit && typeof cockpit.ngettext === 'function') {
      return cockpit.ngettext(singular, plural, count);
    }
  } catch (_e) { /* ignore */ }
  return count === 1 ? singular : plural;
}
