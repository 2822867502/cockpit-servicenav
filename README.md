# Cockpit Service Navigation Plugin (servicenav)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-126%20passed-brightgreen.svg)](test-reports/)

A Cockpit plugin that adds a "Service Navigation" page to the Cockpit admin interface. Displays configurable sub-services (Portainer, Grafana, custom webapps) as cards or list items with quick-access links.

**Authors**: deepseek v4 pro & zlk

---

## Features

- **Service Cards/List**: Display sub-services in a responsive card grid or compact list view
- **Smart URL Resolution**: Configure services with absolute URLs or relative port numbers (uses current Cockpit host and protocol)
- **Per-Service HTTPS Mode**: Each service independently controls link protocol — Follow Cockpit / Force HTTPS / Force HTTP
- **Icon Display**: Simple `<img>` tag loading of `/favicon.ico` with default fallback icon
- **CRUD Management**: Add, edit, and delete services through a modal form interface
- **Config Persistence**: All settings stored via `cockpit.localStorage` — no filesystem permissions required
- **Dark Mode**: Full dark mode support synced from parent Cockpit theme (`pf-v6-theme-dark`)
- **Multi-Language**: Chinese (Simplified) default, English fallback
- **PatternFly 5 UI**: Consistent with Cockpit's design system

## Requirements

- **Cockpit** version 270 or later
- **Node.js** 18+ (for building the plugin)
- **npm** 9+

## Quick Start

```bash
git clone <repo-url>
cd cockpit-plugin-subservice
npm install
npm run build
sudo make install      # installs to /usr/local/share/cockpit/
```

Then access Cockpit at `https://your-server:9090` and find "服务导航" in the sidebar.

### Development Mode

```bash
npm run watch          # auto-rebuild on changes
make devel-install     # symlink into ~/.local/share/cockpit/
```

## Configuration

### Storage

Configuration is stored via `cockpit.localStorage` (key: `servicenav-config`). In development mode, falls back to browser `localStorage`. No filesystem permissions needed.

### Config Format

```json
{
  "version": 1,
  "viewMode": "grid",
  "services": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Grafana Monitoring",
      "url": "3000",
      "httpsMode": "follow",
      "iconType": "auto",
      "iconUrl": null,
      "description": "Metrics and monitoring dashboards",
      "createdAt": "2026-06-25T10:00:00.000Z",
      "updatedAt": "2026-06-25T10:00:00.000Z"
    }
  ]
}
```

### URL Configuration

| Type | Example | Behavior |
|---|---|---|
| **Relative Port** | `8080` | Uses current Cockpit host + protocol from `httpsMode` |
| **Relative Port + Path** | `9090/admin` | Uses current Cockpit host + path |
| **Absolute URL** | `https://example.com:3000` | Used as-is, never overridden |

If Cockpit is accessed at `https://10.0.2.1:9090`, configuring a service with port `8080` will open `https://10.0.2.1:8080` (or `http://` depending on `httpsMode`).

### Per-Service HTTPS Mode

Each service has its own `httpsMode` field controlling the protocol for relative-port links:

| Value | Description |
|---|---|
| `follow` (default) | Use the same protocol as the current Cockpit page |
| `https` | Force `https://` for this service |
| `http` | Force `http://` for this service |

Absolute URLs (starting with `http://` or `https://`) are never affected by this setting.

### Icon Configuration

| Mode | Description |
|---|---|
| `auto` | Load `/favicon.ico` from the service URL via `<img>` tag |
| `url` | Use a user-provided icon URL |
| `none` | Show default cube icon |

## Dark Mode

The plugin syncs the parent Cockpit's theme class (`pf-v6-theme-dark` / `pf-theme-dark`) to the plugin iframe's `<html>` element via `MutationObserver`. CSS uses a combination of:

1. `color-scheme: dark` — browser-native dark rendering
2. **PF5 design token overrides** — 50+ `--pf-v5-*` CSS custom properties set to dark values
3. **Direct CSS selectors** — targeting PF5 component classes (`pf-v5-c-form-control`, `pf-v5-c-card`, etc.)

This mirrors the official Cockpit PF6 approach of overriding design tokens in the dark theme block.

## Directory Structure

```
cockpit-plugin-subservice/
├── build.js                 # esbuild build script
├── Makefile                 # Top-level build targets
├── package.json             # NPM config and dependencies
├── tsconfig.json            # TypeScript config
├── jest.config.js           # Jest test config
├── manifest.json            # Cockpit plugin descriptor
├── README.md                # This file
│
├── src/
│   ├── index.html           # Entry HTML loaded by Cockpit
│   ├── index.tsx            # React bootstrap + theme sync
│   ├── app.tsx              # Root App component
│   ├── components/
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   ├── ServiceCard.tsx        # Card view
│   │   ├── ServiceListItem.tsx    # List row view
│   │   ├── ServiceGrid.tsx        # Card grid (PF Gallery)
│   │   ├── ServiceList.tsx        # List view (PF DataList)
│   │   ├── ServiceForm.tsx        # Add/Edit modal form
│   │   ├── ServiceIcon.tsx        # Icon display (<img> + fallback)
│   │   ├── ViewToggle.tsx         # Grid/List toggle
│   │   ├── EmptyState.tsx         # Empty state CTA
│   │   └── DeleteConfirmDialog.tsx # Delete confirmation
│   ├── hooks/
│   │   ├── useServices.ts         # CRUD state + localStorage sync
│   │   └── useIconFetcher.ts      # Favicon URL resolution
│   ├── lib/
│   │   ├── config.ts        # cockpit.localStorage wrapper
│   │   ├── url.ts           # URL resolution + httpsMode
│   │   ├── validators.ts    # Form validation
│   │   ├── i18n.ts          # Embedded translation maps (zh_CN/en)
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── mockCockpit.ts   # Dev/test Cockpit mock
│   └── styles/
│       └── servicenav.css   # Dark mode + component styles
│
├── test/
│   ├── setup.ts             # Jest setup
│   ├── __mocks__/
│   │   ├── cockpit.ts       # Cockpit API mock
│   │   └── fileMock.js      # Static asset mock
│   ├── lib/                 # lib unit tests
│   ├── hooks/               # hook tests
│   └── components/          # component tests
│
├── po/                      # Translation reference files
└── test-reports/            # Test output (gitignored)
```

## Available Commands

```bash
npm run build         # Build plugin to dist/
npm run watch         # Build and watch for changes
npm test              # Run 126 Jest tests with coverage
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking
npm run clean         # Remove build artifacts
```

## Testing

```bash
npm test              # 126 tests, 10 suites
```

Tests use a full mock of the `cockpit` global API. No real Cockpit installation needed.

### Test Structure

| Category | Files | Focus |
|---|---|---|
| `lib/` | url, validators, config | Pure function unit tests |
| `hooks/` | useIconFetcher | Hook behavior |
| `components/` | ServiceCard, ServiceForm, ServiceIcon, etc. | React component rendering |

## Internationalization (i18n)

Default language is **Chinese (Simplified)**. English is the fallback.

**Language Detection Priority:**
1. `navigator.language` — Browser language
2. `cockpit.locale()` — Cockpit locale setting
3. `cockpit.language` — Cockpit user preference
4. Default: `zh_CN`

Translation maps are embedded in `src/lib/i18n.ts`. To add a new language, add a new map following the `zhCN` pattern.

## Troubleshooting

### Dark mode not applying

1. Open browser DevTools and check `<html>` has `pf-theme-dark` class
2. In console, paste: `document.documentElement.classList`
3. If missing, check parent window sync in `index.tsx` → `bootstrap()`
4. Verify Cockpit parent has `pf-v6-theme-dark` on its `<html>`

### Service list empty or add fails

1. Open DevTools → Application → Local Storage
2. Check key `servicenav-config` exists and is valid JSON
3. If using real Cockpit, verify `cockpit.localStorage` is available
4. Check browser console for `[servicenav]` error logs

### Icons not showing

1. Service must be reachable from the browser
2. For `auto` mode, `/favicon.ico` must exist on the target service
3. For `url` mode, the URL must be accessible
4. Fallback: set icon type to `none` for a default cube icon
5. Check browser Network tab for failed favicon requests

### `TypeError: object is not iterable`

Malformed config: `services` field is an object instead of array.
The plugin has `ensureArray()` guards — it will silently recover by returning `[]`.

## License

MIT License

## Contributing

1. Ensure all checks pass: `npm run lint && npm run typecheck && npm test`
2. Follow existing code style and patterns
3. Add tests for new functionality
4. Update `i18n.ts` translations for new user-facing strings
