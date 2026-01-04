# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro Grab is a dev-only tool that provides visual element targeting for Astro projects. Hold Cmd/Ctrl+G to target any element and copy its source code to clipboard. This is a Bun monorepo using Turborepo for builds and task orchestration.

## Common Commands

### Development

```bash
bun run dev           # Start all package watchers + demo app with hot reload
bun run build         # Build all packages with Turborepo (respects dependency order)
bun run build:demo    # Build just the demo app
```

### Testing

```bash
bun run test          # Run all tests
bun run test:watch    # Run tests in watch mode
bun run typecheck     # Run TypeScript type checking across all packages
```

### Package Management

```bash
# Build/test specific packages using Turborepo filters
bun run turbo run build --filter astro-grab-shared
bun run turbo run test --filter astro-grab-client
```

### Other

```bash
bun run lint          # Lint with oxlint
bun run format        # Format with Prettier
bun run clean         # Clean all build artifacts
```

## Architecture

### Monorepo Structure

The project is organized as a Bun workspace monorepo:

- **packages/astro-grab**: Main Astro integration package (published to npm)
  - Entry point users install and configure in astro.config.mjs
  - Orchestrates the server plugin, client injection, and toolbar integration

- **packages/astro-grab-server**: Vite dev server integration
  - Vite plugin that transforms .astro files to add data-astro-grab attributes
  - Middleware endpoint (/\_\_astro_grab/snippet) for fetching source snippets
  - AST parsing and code transformation logic

- **packages/astro-grab-client**: Browser-side logic
  - State machine for idle → holding → targeting → grabbed states
  - Keybind handler for Cmd/Ctrl+G detection
  - Overlay rendering and element highlighting
  - Targeting logic and clipboard operations

- **packages/astro-grab-shared**: Shared types and utilities
  - TypeScript types used across packages
  - Shared utility functions

- **packages/astro-grab-toolbar**: Astro dev toolbar integration
  - Configuration UI in the Astro dev toolbar
  - Settings for holdDuration, hue, contextLines

- **apps/demo**: Demo Astro site for testing the integration

### Build System

Uses Turborepo with dependency-aware task orchestration:

- Build tasks run in topological order (shared → server/client → integration)
- Caching enabled for builds (outputs stored in dist/)
- Dev and watch tasks run persistently without caching
- Path aliases defined in root tsconfig.json for monorepo imports

### Key Architecture Patterns

**Instrumentation Flow**: Vite plugin → transform .astro files → add data-astro-grab="file:line:col" attributes → serve via dev server

**Client Flow**: User holds Cmd/Ctrl+G → state machine transitions → overlay renders → user clicks element → fetch snippet from /\_\_astro_grab/snippet → copy to clipboard

**Configuration**: Integration options set in astro.config.mjs → passed to Vite plugin and client script → client can be reconfigured at runtime via toolbar

**Production Mode**: Dev-only by default, can force enable with ASTRO_GRAB_DANGEROUSLY_FORCE_ENABLE=true env var (exposes source code to users)

## Environment Variables

- `ASTRO_GRAB_DANGEROUSLY_FORCE_ENABLE=true`: Force-enable in production builds (security risk - only use for demo sites)
- `ASTRO_GRAB_API_BASE_URL`: Override API base URL for production builds (when force-enabled)

## Code Style Guidelines

### TypeScript Conventions

- Use interfaces over types for object shapes
- Keep all type definitions in global scope (not nested)
- Use explicit return types for exported functions
- Use `const` assertions for immutable arrays/objects
- Prefer `Record<string, T>` over `{[key: string]: T}`
- Avoid type casting (`as`) unless absolutely necessary
- Target: ES2022, Module: ESNext, Strict mode enabled

### Naming Conventions

- Files: kebab-case (e.g., `keybind-handler.ts`, `state-machine.ts`)
- Variables: descriptive camelCase, avoid abbreviations
  - `innerElement` not `e`, `currentMousePosition` not `pos`
  - `didPositionChange` not `moved`, `normalizedFilePath` not `path`
- Functions: camelCase, start with verb (getUserData, calculateTotal)
- Classes: PascalCase (KeybindHandler, StateMachine)
- Interfaces: PascalCase (ClientConfig, SnippetResponse)
- Constants: UPPER_SNAKE_CASE for global constants

### Code Structure

- Use arrow functions over function declarations
- Prefer early returns over nested if statements
- Use guard clauses to reduce nesting
- Destructure objects at function parameters when appropriate
- Use template literals over string concatenation
- Prefer `Array.prototype` methods over for loops
- Remove unused code and don't repeat yourself
- Use consistent indentation (2 spaces, no tabs)
- Use single quotes for strings, double quotes for JSX attributes
- Add trailing commas in multi-line objects/arrays

### Comments

- Avoid inline comments unless code is genuinely confusing
- Prefix hack comments with `// HACK:` and explain the reason
- Use JSDoc for public interfaces and complex functions

### Import Organization

```typescript
// External dependencies first
import { parse } from "@astrojs/compiler";

// Workspace packages
import { encodeSourceLocation } from "astro-grab-shared";

// Relative imports
import { StateMachine } from "./state-machine.js";
```

### Testing Patterns

- Use Vitest with globals enabled (`describe`, `it`, `expect`)
- Follow AAA pattern: Arrange, Act, Assert
- Use descriptive test names that explain the behavior
- Test both success and error paths
- Group related tests with nested `describe` blocks

## Commit Message Conventions

Follow these patterns when committing:

- `fix:` - Bug fixes and corrections
- `feat:` - New features and enhancements
- `chore:` - Maintenance tasks, refactoring, cleanup
- `test:` - Test additions and modifications
- `docs:` - Documentation changes
- `perf:` - Performance improvements

Messages should be concise (1-2 sentences) and focus on "what" and "why".

Examples:

- `fix: ensure all elements are instrumented in Astro transform`
- `feat: add hue customization, debug logging, and instant re-activation`
