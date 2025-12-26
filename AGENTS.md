## Critical Operational Restrictions

- MUST: Never run git commands (add, commit, push, pull, etc.) unless explicitly asked to.
- MUST: Never run dev servers (bun dev, npm run dev, etc.) unless explicitly asked to.

## Build, Test, and Development Commands

### Monorepo Commands (Turbo)

- `bun run build` - Build all packages and apps
- `bun run dev` - Start development mode for all packages
- `bun run test` - Run all tests across the monorepo
- `bun run typecheck` - Type-check all TypeScript files
- `bun run clean` - Clean all build artifacts

### Individual Package Commands

- `bun run build:demo` - Build only the demo app
- `bun run test:watch` - Run tests in watch mode (vitest)
- `bun run lint` - Run oxlint on the entire codebase
- `bun run format` - Format code with Prettier

### Testing Commands

- Run all tests: `bun run test` (uses turbo to run tests in all packages)
- Run tests in watch mode: `bun run test:watch`
- Run tests for specific package: `cd packages/astro-grab-client && bun run test`
- Run single test file: `bun run vitest packages/astro-grab-client/tests/state-machine.test.ts`
- Run tests with coverage: Add `--coverage` flag when running vitest directly

### Development Workflow

- Build specific package: `cd packages/astro-grab-client && bun run build`
- Watch mode for package: `cd packages/astro-grab-client && bun run dev`
- Type-check specific package: `cd packages/astro-grab-client && bun run typecheck`

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2022, Module: ESNext, Strict mode enabled
- Use interfaces over types for object shapes
- Keep all type definitions in global scope (not nested)
- Use explicit return types for exported functions
- Use `const` assertions for immutable arrays/objects
- Prefer `Record<string, T>` over `{[key: string]: T}`
- Use union types for state machines and enums

### Naming Conventions

- Files: kebab-case (e.g., `keybind-handler.ts`, `state-machine.ts`)
- Variables: descriptive camelCase, avoid abbreviations
  - `innerElement` not `e`, `currentMousePosition` not `pos`
  - `didPositionChange` not `moved`, `normalizedFilePath` not `path`
- Functions: camelCase, start with verb (getUserData, calculateTotal)
- Classes: PascalCase with descriptive names (KeybindHandler, StateMachine)
- Interfaces: PascalCase with descriptive nouns (ClientConfig, SnippetResponse)
- Constants: UPPER_SNAKE_CASE for global constants

### Import Organization

```typescript
// External dependencies first
import { parse } from "@astrojs/compiler";

// Workspace packages
import { encodeSourceLocation } from "astro-grab-shared";

// Relative imports
import { StateMachine } from "./state-machine.js";
```

### Code Structure Patterns

- Use arrow functions for all function expressions
- Prefer early returns over nested if statements
- Use guard clauses to reduce nesting
- Destructure objects at function parameters when appropriate
- Use template literals over string concatenation
- Prefer `Array.prototype` methods over for loops when possible

### Error Handling

- Use try/catch blocks for operations that can fail
- Provide meaningful error messages with context
- Log errors with descriptive prefixes (e.g., `[astro-grab]`)
- Return early with default values when appropriate
- Avoid throwing errors in user-facing code unless critical

### Comments and Documentation

- Use JSDoc comments for public interfaces and complex functions
- Avoid inline comments unless code is genuinely confusing
- Prefix hack comments with `// HACK:` and explain the reason
- Document interfaces with clear descriptions and parameter types
- Use `@example` tags for complex usage patterns

### Testing Patterns

- Use Vitest with globals enabled (`describe`, `it`, `expect` available globally)
- Follow AAA pattern: Arrange, Act, Assert
- Use descriptive test names that explain the behavior
- Mock external dependencies with `vi.fn()`
- Test both success and error paths
- Use `beforeEach` for test setup
- Group related tests with nested `describe` blocks

### Performance Considerations

- Avoid unnecessary DOM queries in loops
- Use event delegation when possible
- Cache expensive computations
- Prefer `addEventListener` over inline event handlers
- Clean up event listeners in component destroy methods
- Use `requestAnimationFrame` for DOM manipulations in animations

### DOM Manipulation

- Use modern DOM APIs (`querySelector`, `addEventListener`)
- Prefer `classList` methods over direct className manipulation
- Use data attributes for custom element properties
- Avoid innerHTML when possible, prefer textContent or createElement
- Cache DOM element references when used multiple times

### Astro-Specific Patterns

- Use `.astro` files for component templates
- Leverage Astro's scoped styling automatically
- Use TypeScript in script blocks
- Import client-side components with `client:` directives when needed
- Structure components with clear separation of logic and presentation

### Package Architecture

- Use `tsup` for building individual packages
- Export both CommonJS and ESM formats
- Include TypeScript declaration files
- Use workspace dependencies for internal packages
- Structure packages with clear entry points (`index.ts`, `client.ts`)

### State Management

- Use simple state machines for complex UI states
- Prefer immutable state updates
- Centralize state logic in dedicated classes/modules
- Use events/callbacks for state change notifications
- Validate state transitions when appropriate

### Security Best Practices

- Validate all user inputs
- Sanitize data before DOM insertion
- Use HTTPS-only APIs in production
- Avoid eval() and Function constructors
- Implement proper CORS handling
- Log sensitive operations without exposing secrets

## Coding Style Rules

- MUST: Use TypeScript interfaces over types.
- MUST: Keep all types in the global scope.
- MUST: Use arrow functions over function declarations
- MUST: Never comment unless absolutely necessary.
  - If the code is a hack (like a setTimeout or potentially confusing code), it must be prefixed with // HACK: reason for hack
- MUST: Use kebab-case for files
- MUST: Use descriptive names for variables (avoid shorthands, or 1-2 character names).
  - Example: for .map(), you can use `innerX` instead of `x`
  - Example: instead of `moved` use `didPositionChange`
- MUST: Frequently re-evaluate and refactor variable names to be more accurate and descriptive.
- MUST: Do not type cast ("as") unless absolutely necessary
- MUST: Remove unused code and don't repeat yourself.
- MUST: Always search the codebase, think of many solutions, then implement the most _elegant_ solution.
- MUST: Use consistent indentation (2 spaces, no tabs)
- MUST: Use single quotes for strings, double quotes for JSX attributes
- MUST: Add trailing commas in multi-line objects/arrays
- MUST: Use 80 character line limit, break long lines appropriately
- MUST: Group related functions together in modules
- MUST: Prefer functional programming patterns over imperative loops

## Copywriting Rules

- Active voice.
- Instead of "The CLI will be installed," say "Install the CLI."
- Headings & buttons use Title Case (Chicago). On marketing pages, use sentence case.
- Be clear & concise. Use as few words as possible.
- Prefer & over and.
- Action-oriented language.
- Instead of "You will need the CLI…" say "Install the CLI…".
- Keep nouns consistent. Introduce as few unique terms as possible.
- Write in second person. Avoid first person.
- Use consistent placeholders.
- Strings: YOUR_API_TOKEN_HERE. Numbers: 0123456789.
- Use numerals for counts.
- Instead of "eight deployments" say "8 deployments".
- Consistent currency formatting. In any given context, display currency with either 0 or 2 decimal places, never mix both.
- Separate numbers & units with a space.
- Instead of 10MB say 10 MB.
- Use a non-breaking space e.g., 10&nbsp;MB.
- Default to positive language. Frame messages in an encouraging, problem-solving way, even for errors.
- Instead of "Your deployment failed," say "Something went wrong—try again or contact support."
- Error messages guide the exit. Don't just state what went wrong—tell the user how to fix it.
- Instead of "Invalid API key," say "Your API key is incorrect or expired. Generate a new key in your account settings."
- Avoid ambiguity. Labels are clear & specific.
- Instead of the button label "Continue" say "Save API Key".

## Commit Message Conventions

When committing changes, follow these patterns:

- `fix:` - Bug fixes and corrections
- `feat:` - New features and enhancements
- `chore:` - Maintenance tasks, refactoring, cleanup
- `test:` - Test additions and modifications
- `docs:` - Documentation changes
- `perf:` - Performance improvements
- Messages should be concise (1-2 sentences) and focus on "what" and "why"
- Examples: "fix: ensure all elements are instrumented in Astro transform", "feat: add hue customization, debug logging, and instant re-activation"

## Environment Setup

- Node.js runtime with Bun package manager
- TypeScript with strict configuration
- Vitest for testing with happy-dom environment for DOM tests
- Oxlint for fast linting
- Prettier with Astro and Tailwind CSS plugins
- Turbo for monorepo task orchestration
