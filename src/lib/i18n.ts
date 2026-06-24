/**
 * Internationalization (i18n) support for the servicenav plugin.
 *
 * Uses embedded JS translation maps for reliability — no dependency on
 * Cockpit's PO file loading mechanism (which requires build-time compilation
 * and runtime loading that varies across Cockpit versions).
 *
 * Language detection priority:
 *   1. Cockpit's `cockpit.language` setting (if available)
 *   2. Browser's `navigator.language`
 *   3. Fallback to English ('en')
 *
 * Usage in components:
 *   import { _ } from '../lib/i18n';
 *   const label = _('Service Navigation');
 */

// ---- Translation Maps ----
// Keys are English strings, values are translated strings.
// English is the default/fallback language (no map needed).

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
};

// All supported language maps
const translations: Record<string, Record<string, string>> = {
  zh_CN: zhCN,
  zh: zhCN,       // generic Chinese → simplified Chinese
  'zh-CN': zhCN,  // BCP 47 variant
  'zh-Hans': zhCN, // BCP 47 with script tag
  'zh-TW': zhCN,  // For now, use simplified for traditional as well
};

// ---- Language Detection ----

let currentLang = 'en';

/**
 * Detect the user's preferred language.
 *
 * Checks (in priority order):
 *   1. cockpit.language (set by Cockpit shell based on user preferences)
 *   2. navigator.language (browser language)
 *   3. Falls back to 'en'
 */
function detectLanguage(): string {
  // 1. Check Cockpit's language setting
  const cockpit = (window as any).cockpit;
  if (cockpit && typeof cockpit.language === 'string' && cockpit.language) {
    return cockpit.language;
  }

  // 2. Check browser's navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }

  return 'en';
}

/**
 * Initialize i18n. Detects language and makes `_()` globally available.
 * Call once at startup, before any component renders.
 */
export function initI18n(): void {
  currentLang = detectLanguage();
  // Expose _ globally for convenience
  if (typeof window !== 'undefined') {
    (window as any)._ = _;
  }
}

/**
 * Translation function.
 *
 * Looks up the English text in the current language's translation map.
 * Falls back gracefully: returns the original text if no translation exists.
 *
 * @param text - English source string
 * @returns Translated string in the current language, or the original text
 */
export function _(text: string): string {
  // Try Cockpit's built-in gettext first (if PO data happens to be loaded)
  if (typeof window !== 'undefined') {
    const cockpit = (window as any).cockpit;
    if (cockpit && typeof cockpit.gettext === 'function') {
      const result = cockpit.gettext(text);
      // cockpit.gettext returns identity if no translation loaded;
      // if it returns something different, use it
      if (result !== text) {
        return result;
      }
    }
  }

  // Use our embedded translation maps
  if (currentLang !== 'en' && translations[currentLang]) {
    const translated = translations[currentLang][text];
    if (translated) {
      return translated;
    }
  }

  // Fallback: return original English text
  return text;
}

/**
 * Plural-aware translation function (rarely needed for this plugin).
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
