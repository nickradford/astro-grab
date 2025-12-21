# Development Guide

This document provides detailed information about developing and contributing to Astro Grab.

## Project Structure

Astro Grab is a Bun monorepo with the following packages:

```
astro-grab-v2/
├── packages/
│   ├── astro-grab-shared/    # Types and utilities shared across packages
│   ├── astro-grab-server/    # Vite plugin for instrumentation + snippet endpoint
│   ├── astro-grab-client/    # Browser client (overlay, keybind, targeting)
│   └── astro-grab/           # Main Astro integration
└── apps/
    └── demo/                 # Demo Astro application
```

### Package Dependencies

```
astro-grab (integration)
  ├─ astro-grab-server (Vite plugin)
  │   └─ astro-grab-shared
  ├─ astro-grab-client (browser client)
  │   └─ astro-grab-shared
  └─ astro-grab-shared
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 18 (for compatibility)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd astro-grab-v2

# Install dependencies
bun install

# Build all packages
bun run build:packages
```

## Development Workflow

### Running the Demo in Dev Mode

The recommended development workflow is to run the demo app with all packages in watch mode:

```bash
# Terminal 1: Watch all packages and run demo
bun run dev
```

This command uses `concurrently` to:

1. Build and watch all packages (`astro-grab-shared`, `astro-grab-server`, `astro-grab-client`, `astro-grab`)
2. Run the Astro dev server for the demo app

### HMR Behavior (Alpha)

**What hot reloads:**

- Client code changes (`packages/astro-grab-client/src/*`) - triggers browser page reload
- Demo `.astro` files - Astro's built-in HMR

**What requires restart:**

- Server package changes (`packages/astro-grab-server/src/*`)
- Integration changes (`packages/astro-grab/src/*`)
- Adding/removing dependencies

To restart:

```bash
# Ctrl+C to stop
bun run dev
```

### Building Individual Packages

Packages must be built in dependency order:

```bash
# Build in order
bun run --filter astro-grab-shared build
bun run --filter astro-grab-server build
bun run --filter astro-grab-client build
bun run --filter astro-grab build
```

Or use the helper script:

```bash
bun run build:packages
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Test specific package
cd packages/astro-grab-shared
bun test
```

### Type Checking

```bash
# Check types across all packages
bun run typecheck
```

## Architecture

### How It Works

1. **Instrumentation** (`astro-grab-server`):
   - Vite plugin transforms `.astro` files during dev
   - Uses `@astrojs/compiler` to parse and walk AST
   - Injects `data-astro-grab="file:line:col"` attributes on HTML elements
   - Only lowercase tags (not components) are instrumented

2. **Client Injection** (`astro-grab`):
   - Integration uses `injectScript('page', ...)` to inject client bundle
   - Client auto-initializes on page load
   - Creates overlay, keybind listeners, and targeting handlers

3. **Targeting Mode** (`astro-grab-client`):
   - State machine: `idle → holding → targeting → idle`
   - Cmd/Ctrl+G held for 1000ms → enter targeting
   - Mouse tracking highlights elements with source attribution
   - Click fetches snippet from server and copies to clipboard

4. **Snippet Endpoint** (`astro-grab-server`):
   - Dev server middleware at `/__astro_grab/snippet?src=<encoded>`
   - Parses source location, reads file, extracts ±40 lines
   - Returns JSON with snippet and metadata

### Key Files

**Server Package:**

- `parser.ts` - AST parsing and instrumentation logic
- `vite-plugin.ts` - Main Vite plugin + middleware
- `snippet-handler.ts` - Snippet extraction endpoint

**Client Package:**

- `state-machine.ts` - Core state management
- `keybind.ts` - Cmd/Ctrl+G detection with hold timer
- `overlay.ts` - Visual overlay (highlight, tooltip, toast)
- `targeting.ts` - Mouse tracking and click handling
- `auto.ts` - Auto-initialization entry point

**Integration:**

- `integration.ts` - Astro `astro:config:setup` hook

## Testing

### Unit Tests

Tests use Vitest with the following patterns:

**Shared Package:**

- Encode/decode source locations
- Snippet extraction with boundaries
- Path normalization

**Server Package:**

- Parser instrumentation (simple, nested, edge cases)
- Snippet handler with fixture files
- Error handling

**Client Package:**

- State machine transitions
- Keybind detection (Cmd+G, Ctrl+G, timing)
- Clipboard formatting

DOM tests use `happy-dom` for lightweight browser environment.

### Manual Testing Checklist

Test in the demo app (`bun run dev`):

- [ ] Hold Cmd+G (Mac) or Ctrl+G (Win/Linux) for 1s → targeting mode activates
- [ ] Blue highlight follows cursor over elements
- [ ] Tooltip shows `data-astro-grab` value
- [ ] Click element → "Copied!" toast appears
- [ ] Clipboard contains formatted snippet with source info
- [ ] Escape key exits targeting mode
- [ ] Release key before 1s → no targeting mode
- [ ] No console errors

## Debugging

### Enable Verbose Logging

The client logs state transitions to console:

```
[astro-grab] State: idle → holding
[astro-grab] State: holding → targeting
```

### Inspect Instrumented HTML

In dev tools, inspect elements to see `data-astro-grab` attributes:

```html
<div data-astro-grab="src/components/Card.astro:10:1" class="card">
```

### Check Snippet Endpoint

Test the endpoint directly:

```bash
curl "http://localhost:4321/__astro_grab/snippet?src=src/pages/index.astro:10:1"
```

### Common Issues

**Client script not loading:**

- Check browser console for import errors
- Verify packages are built: `bun run build:packages`
- Check `astro.config.mjs` has the integration enabled

**No data attributes in HTML:**

- Ensure Vite plugin is running (check server logs)
- Verify `.astro` file is in project (not `node_modules`)
- Check for parser errors in terminal

**Targeting not working:**

- Verify client script loaded (check Network tab)
- Check console for JavaScript errors
- Ensure elements have `data-astro-grab` attributes

## Known Limitations (Alpha)

### HMR

- Client changes require full page reload (not true HMR)
- Server/integration changes require dev server restart
- Package interdependencies may require manual `bun install`

### Parser

- Only `.astro` files (no `.jsx`, `.vue`, `.svelte`)
- Only HTML elements (not component tags with uppercase names)
- Client-rendered content not instrumented

### Snippets

- Fixed context window (±40 lines by default)
- No syntax highlighting in output
- No dependency resolution or related files

### Browser Support

- Requires modern browser with Clipboard API
- HTTPS or localhost required for clipboard access
- Tested on Chrome, Firefox, Safari (latest)

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing patterns (state machines, composition)
- Write tests for new features
- Keep functions small and focused
- Document public APIs with JSDoc

### Pull Request Process

1. Create a feature branch
2. Make changes with tests
3. Run `bun test` and `bun run typecheck`
4. Update documentation if needed
5. Submit PR with description

### Release Process (Future)

1. Update version in all package.json files
2. Run `bun run build`
3. Run `bun test`
4. Create git tag: `git tag v0.1.0`
5. Publish to npm: `bun run publish` (not implemented yet)

## Troubleshooting

### Build Fails with Type Errors

Ensure packages are built in dependency order:

```bash
bun run --filter astro-grab-shared build
bun run --filter astro-grab-server build
bun run --filter astro-grab-client build
bun run --filter astro-grab build
```

### Tests Fail After Changes

Clear test cache and rebuild:

```bash
bun run clean
bun install
bun run build:packages
bun test
```

### Demo Won't Start

Ensure all packages are built:

```bash
bun run build:packages
cd apps/demo
bun run dev
```

## Resources

- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/)
- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
- [@astrojs/compiler](https://github.com/withastro/compiler)
- [Bun Workspaces](https://bun.sh/docs/install/workspaces)
- [tsup](https://tsup.egoist.dev/)

## License

MIT
