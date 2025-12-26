# Astro Grab (Alpha)

**Visual element targeting for Astro projects** - Hold Cmd/Ctrl+G to target any element and copy its source code to your clipboard.

## Project Status

This monorepo uses Turborepo for efficient builds and caching. Package builds automatically respect dependency ordering and cache results locally.

## What is Astro Grab?

Astro Grab is a dev-only tool that helps you quickly locate and grab source code from your Astro components. Simply hold Cmd+G (Mac) or Ctrl+G (Windows/Linux) for one second, then click any element to copy its source snippet to your clipboard - perfect for pasting into AI assistants like Claude.

## Features (Alpha)

- 🎯 **Visual targeting mode**: Hold Cmd/Ctrl+G to enter targeting mode with visual highlights
- 📋 **Instant clipboard copy**: Click any element to copy its source code snippet
- 🔍 **Source attribution**: Automatically tracks elements to their .astro files
- ⚡ **Dev-only**: Zero impact on production builds
- 🎨 **Non-intrusive**: Overlay doesn't interfere with page interaction

## Quick Start

### Installation

```bash
bun install
```

### Development

Start all package watchers and the demo app:

```bash
bun run dev
```

This will:

- Build and watch all packages in `packages/`
- Start the Astro dev server for the demo in `apps/demo`
- Enable hot reload for client code changes

Builds are optimized with Turborepo:
- Automatic parallel execution when dependencies allow
- Local caching speeds up subsequent builds
- Dependency graph ensures correct build order

Visit `http://localhost:4321` and try the targeting mode:

1. Hold Cmd+G (Mac) or Ctrl+G (Win/Linux) for 1 second
2. Move your mouse over elements to see them highlighted
3. Click an element to copy its source code
4. Press Escape to exit targeting mode

### Building

Build all packages with Turborepo:

```bash
bun run build
```

Turborepo automatically:
- Builds packages in dependency order (shared → server/client → integration)
- Caches build outputs for faster rebuilds
- Runs packages in parallel when dependencies allow

Build specific packages:

```bash
bun run turbo run build --filter astro-grab-shared
```

### Testing

Run all tests:

```bash
bun run test
```

Watch mode:

```bash
bun run test:watch
```

Run tests in specific package:

```bash
bun run turbo run test --filter astro-grab-shared
```

## Project Structure

This is a Bun monorepo with the following packages:

- **`packages/astro-grab`**: Main Astro integration (what users install)
- **`packages/astro-grab-client`**: Client-side overlay and keybind logic
- **`packages/astro-grab-server`**: Vite dev server middleware and snippet endpoint
- **`packages/astro-grab-shared`**: Shared types and utilities
- **`apps/demo`**: Demo Astro site for testing

## Usage in Your Project

1. Install the integration:

```bash
bun add astro-grab
```

2. Add to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import { astroGrab } from 'astro-grab';

export default defineConfig({
  integrations: [
    astroGrab({
      enabled: true,        // Enable in dev mode (default: true)
      holdDuration: 1000,   // Hold time in ms (default: 1000)
      contextLines: 40,     // Lines of context around target (default: 40)
    }),
  ],
});
```

3. Run your dev server:

```bash
npm run dev
```

4. Hold Cmd/Ctrl+G and click elements to grab their source!

## How It Works

1. **Instrumentation**: During dev, the Vite plugin transforms `.astro` files to add `data-astro-grab="file:line:col"` attributes to HTML elements
2. **Client injection**: The integration automatically injects a client script that listens for Cmd/Ctrl+G
3. **Targeting mode**: Holding the keybind for 1s activates an overlay that highlights elements under the cursor
4. **Snippet extraction**: Clicking an element fetches a code snippet from the dev server and copies it to clipboard

## Known Limitations (Alpha)

- **HMR**: Client changes require page reload; server/integration changes require dev server restart
- **Parser**: Only `.astro` files (no `.jsx`, `.vue`, etc.)
- **Snippets**: Fixed context window (±40 lines), no dependency resolution
- **Browser**: Requires modern browser with Clipboard API (HTTPS or localhost)

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development instructions, architecture notes, and contribution guidelines.

## License

MIT
