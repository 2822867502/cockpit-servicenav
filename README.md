# Cockpit Service Navigation Plugin (servicenav)

A Cockpit plugin that adds a "Service Navigation" page to the Cockpit admin interface. It displays configurable sub-services (e.g., Portainer, Grafana, custom webapps) as cards or list items with quick-access links.

## Features

- **Service Cards/List**: Display sub-services in a responsive card grid or compact list view
- **Smart URL Resolution**: Configure services with absolute URLs or relative port numbers (uses current Cockpit host)
- **Icon Auto-Fetch**: Automatically tries to load `/favicon.ico` from each service, with fallback
- **Custom Icons**: Support for custom icon URLs and a default fallback icon
- **CRUD Management**: Add, edit, and delete services through a modal form interface
- **Config Persistence**: All settings stored in `/etc/cockpit/servicenav.conf` via Cockpit's atomic file API
- **Multi-Language**: English and Chinese (Simplified) translations
- **PatternFly 5 UI**: Consistent with Cockpit's design system

## Requirements

- **Cockpit** version 270 or later
- **Node.js** 18+ (for building the plugin)
- **npm** 9+

## Quick Start

### Installation (Development)

```bash
# Clone or enter the project directory
cd cockpit-plugin-subservice

# Install dependencies
npm install

# Build the plugin
npm run build
# or: make

# Install for development (symlinks dist/ into Cockpit's user plugin directory)
make devel-install

# Watch for changes during development
npm run watch
```

### Installation (System-Wide)

```bash
make
sudo make install
```

Then access Cockpit at `https://your-server:9090` and find "Service Navigation" in the sidebar menu.

## Configuration

### Config File Location

`/etc/cockpit/servicenav.conf`

### Config File Format

```json
{
  "version": 1,
  "viewMode": "grid",
  "services": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Grafana Monitoring",
      "url": "3000",
      "iconType": "auto",
      "iconUrl": null,
      "description": "Metrics and monitoring dashboards",
      "createdAt": "2026-06-25T10:00:00.000Z",
      "updatedAt": "2026-06-25T10:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Internal Wiki",
      "url": "https://wiki.internal.corp:8443",
      "iconType": "url",
      "iconUrl": "https://wiki.internal.corp:8443/assets/logo.png",
      "description": "Company internal documentation wiki",
      "createdAt": "2026-06-24T15:30:00.000Z",
      "updatedAt": "2026-06-25T09:15:00.000Z"
    }
  ]
}
```

### URL Configuration

Services can be configured with two types of URLs:

| Type | Example | Behavior |
|---|---|---|
| **Relative Port** | `8080` | Uses current Cockpit host: `https://<cockpit-host>:8080` |
| **Relative Port + Path** | `9090/admin` | Uses current Cockpit host: `https://<cockpit-host>:9090/admin` |
| **Absolute URL** | `https://example.com:3000` | Used as-is, no transformation |

If Cockpit is accessed at `https://10.0.2.1:9090`, configuring a service with port `8080` will open `https://10.0.2.1:8080`.

### Icon Configuration

Three icon modes are available (configured per service):

| Mode | Description | Priority |
|---|---|---|
| `auto` | Attempts to load `/favicon.ico` from the service URL | Falls back to default on failure |
| `url` | Uses a user-provided icon URL (HTTP/HTTPS) | Falls back to default on failure |
| `none` | Always uses the default cube icon | Immediate (no network request) |

## Development

### Directory Structure

```
cockpit-plugin-subservice/
├── build.js              # esbuild build script
├── Makefile              # Build orchestration
├── package.json          # NPM config and dependencies
├── tsconfig.json         # TypeScript config
├── jest.config.ts        # Jest test config
├── manifest.json         # Cockpit plugin descriptor
├── README.md             # This file
├── src/
│   ├── index.html        # Entry HTML (loaded by Cockpit)
│   ├── index.tsx         # React bootstrap
│   ├── app.tsx           # Root App component
│   ├── components/       # React UI components
│   │   ├── ServiceCard.tsx
│   │   ├── ServiceListItem.tsx
│   │   ├── ServiceGrid.tsx
│   │   ├── ServiceList.tsx
│   │   ├── ServiceForm.tsx
│   │   ├── ServiceIcon.tsx
│   │   ├── ViewToggle.tsx
│   │   ├── EmptyState.tsx
│   │   └── DeleteConfirmDialog.tsx
│   ├── hooks/            # React custom hooks
│   │   ├── useServices.ts
│   │   ├── useIconFetcher.ts
│   │   └── useViewMode.ts
│   ├── lib/              # Utility modules
│   │   ├── config.ts     # Config file access (cockpit.file wrapper)
│   │   ├── url.ts        # URL resolution
│   │   ├── validators.ts # Form validation
│   │   ├── i18n.ts       # Translation support
│   │   ├── types.ts      # TypeScript interfaces
│   │   └── mockCockpit.ts # Dev-only Cockpit mock
│   └── styles/
│       └── servicenav.css # Plugin styles
├── test/
│   ├── setup.ts          # Jest setup (mock cockpit, DOM matchers)
│   ├── __mocks__/        # Test mocks
│   │   ├── cockpit.ts    # Full Cockpit API mock
│   │   └── fileMock.js   # Static asset mock
│   ├── lib/              # Library unit tests
│   │   ├── url.test.ts
│   │   ├── validators.test.ts
│   │   └── config.test.ts
│   ├── hooks/            # Hook tests
│   │   └── useIconFetcher.test.ts
│   └── components/       # Component tests
│       ├── ServiceIcon.test.tsx
│       ├── ViewToggle.test.tsx
│       ├── EmptyState.test.tsx
│       ├── DeleteConfirmDialog.test.tsx
│       ├── ServiceCard.test.tsx
│       └── ServiceForm.test.tsx
├── po/                   # Translations
│   ├── servicenav.pot    # Translation template
│   ├── zh_CN.po          # Chinese translations
│   └── LINGUAS           # Supported languages list
└── test-reports/         # Generated test reports (gitignored)
```

### Available Commands

```bash
npm run build         # Build plugin to dist/
npm run watch         # Build and watch for changes
npm test              # Run Jest tests with coverage
npm run test:watch    # Run tests in watch mode
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix lint issues
npm run typecheck     # TypeScript type checking
npm run clean         # Remove build artifacts
```

### Development Without Cockpit

When developing outside Cockpit, the plugin uses a mock layer (`src/lib/mockCockpit.ts`) that stores config in `localStorage` instead of `/etc/cockpit/servicenav.conf`. This is automatically enabled when the `cockpit` global is not available.

To test the UI during development:

1. Run `npm run watch` to start the build watcher
2. Serve `dist/` with a local HTTP server: `npx serve dist/`
3. Open in a browser to see the plugin UI (without Cockpit shell)

### Code Style

- **Language**: TypeScript with strict mode
- **Framework**: React 18 with PatternFly 5 components
- **Build**: esbuild (fast, no webpack configuration needed)
- **Tests**: Jest + React Testing Library + jsdom
- **Lint**: ESLint with TypeScript and React plugins
- **Module style**: ES modules, functional components, custom hooks
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files

### Internationalization (i18n)

The plugin supports English and Chinese (Simplified), with English as the fallback language.

**Language Detection Priority:**
1. `cockpit.language` — Cockpit's user preference (if available)
2. `navigator.language` — Browser language setting
3. Fallback to English

**How it works:**
- All user-visible strings are wrapped with the `_()` function (`import { _ } from '../lib/i18n'`)
- Translation maps are embedded directly in `src/lib/i18n.ts` — no build-time PO compilation needed
- To add a new language: add a new translation map to `i18n.ts` following the existing `zhCN` pattern
- To add a new translatable string: add the `_()` call in the component, then add the translation pair to `i18n.ts`

**Important:** `initI18n()` must be called once at startup before any component renders. This is handled in `src/index.tsx`.

## Testing

```bash
# Run all tests with coverage
npm test

# Coverage reports are generated in test-reports/
```

### Test Structure

- **Unit tests** for `lib/` modules (URL resolution, validation, config access)
- **Component tests** for React components using Testing Library
- **Hook tests** for custom hooks

Tests use a full mock of the `cockpit` global API and `window.location`. No real Cockpit installation is needed for testing.

## License

MIT License

## Contributing

1. Ensure code passes all checks: `npm run lint && npm run typecheck && npm test`
2. Follow the existing code style and patterns
3. Add tests for new functionality
4. Update translations if adding user-facing strings
