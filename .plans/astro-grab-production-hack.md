# Astro Grab Demo Source Embedding Plan

## Overview

Implement a simple build-time source embedding solution specifically for the demo deployment, enabling snippet extraction in production without affecting the main astro-grab package.

- **Purpose**: Enable demo users to try astro-grab without local installation
- **Scope**: Demo app only (`apps/demo/`)
- **Files**: Only `.astro` files in `src/` directory
- **Generation**: Build-time only, not committed to git
- **Usage**: Production/demo context only

## Current Problem

The demo deployment cannot access source files at runtime in serverless environments, preventing snippet extraction from working.

## Solution: Simple Build-Time JSON Generation

### 1. Build Script for Source Collection

**File:** `apps/demo/scripts/generate-demo-sources.mjs`

```javascript
import { glob } from "glob";
import { readFile, writeFile } from "fs/promises";
import { relative } from "path";

console.log("🔍 Scanning .astro files in src/...");

const astroFiles = await glob("src/**/*.astro", {
  cwd: process.cwd(),
  absolute: true,
});

const sources = {};

for (const filePath of astroFiles) {
  try {
    const content = await readFile(filePath, "utf-8");
    const relativePath = relative(process.cwd(), filePath);
    sources[relativePath] = content;
    console.log(`📄 Processed ${relativePath}`);
  } catch (error) {
    console.warn(`⚠️ Failed to read ${filePath}:`, error.message);
  }
}

await writeFile("src/demo-sources.json", JSON.stringify(sources, null, 2));
console.log(
  `✅ Generated demo-sources.json with ${Object.keys(sources).length} files`,
);
```

### 2. Build Integration

**File:** `apps/demo/package.json` (add script)

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-demo-sources.mjs"
  }
}
```

### 3. Content-Based Snippet Handler

**File:** `packages/astro-grab-server/src/snippet-handler-content.ts`

```typescript
import { decodeSourceLocation, extractSnippet } from "astro-grab-shared";
import type { SnippetResponse } from "astro-grab-shared";

export interface SnippetHandlerOptions {
  contextLines?: number;
}

export async function handleSnippetRequestFromContent(
  src: string,
  content: string,
  options: SnippetHandlerOptions = {},
): Promise<SnippetResponse> {
  const { contextLines = 4 } = options;

  const loc = decodeSourceLocation(decodeURIComponent(src));

  const { snippet, startLine, endLine } = extractSnippet(
    content,
    loc.line,
    contextLines,
  );

  return {
    file: loc.file,
    snippet,
    startLine,
    endLine,
    targetLine: loc.line,
    language: "astro",
  };
}
```

### 4. Updated API Route with Hybrid Loading

**File:** `apps/demo/src/pages/api/astro-grab/snippet.ts`

```typescript
import { handleSnippetRequest } from "astro-grab-server";
import { handleSnippetRequestFromContent } from "astro-grab-server/snippet-handler-content";

// Import demo sources (only works in production build)
let demoSources: Record<string, string> | null = null;
if (process.env.NODE_ENV === "production") {
  try {
    demoSources = await import("./demo-sources.json");
  } catch {
    // Sources not available, will use filesystem fallback
  }
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const src = url.searchParams.get("src");
  const contextLinesParam = url.searchParams.get("contextLines");

  if (!src) {
    return new Response(JSON.stringify({ error: "Missing src parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contextLines = contextLinesParam ? parseInt(contextLinesParam, 10) : 4;

  try {
    let result: SnippetResponse;

    // Try embedded sources first (production/demo)
    if (demoSources && demoSources[src]) {
      result = await handleSnippetRequestFromContent(src, demoSources[src], {
        contextLines,
      });
    } else {
      // Fallback to filesystem (development)
      const root = process.cwd();
      result = await handleSnippetRequest(src, { root, contextLines });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[astro-grab] Snippet extraction failed:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
```

## Implementation Benefits

### ✅ Simplicity

- **One-off script**: Simple Node.js script, minimal maintenance
- **Clear scope**: Only affects demo app, no impact on main package
- **Straightforward logic**: JSON import with filesystem fallback

### ✅ Performance

- **Small bundle impact**: Demo has ~10 .astro files, minimal size increase
- **Build-time only**: No runtime performance cost
- **Conditional loading**: Only imports sources in production

### ✅ Safety

- **Demo-only**: No risk to main astro-grab functionality
- **Gitignored**: Generated file not committed to repository
- **Production-only**: Only activates in production environment

## File Structure Changes

```
apps/demo/
├── scripts/
│   └── generate-demo-sources.mjs    # NEW: Build-time source collector
├── src/
│   ├── demo-sources.json            # GENERATED: Source content (gitignored)
│   └── pages/api/astro-grab/
│       └── snippet.ts               # MODIFIED: Hybrid loading logic
└── package.json                     # MODIFIED: Add prebuild script

packages/astro-grab-server/
└── src/
    └── snippet-handler-content.ts   # NEW: Content-based snippet extraction
```

## Implementation Order

1. **Create content-based snippet handler** (`packages/astro-grab-server/src/snippet-handler-content.ts`)
2. **Create build script** (`apps/demo/scripts/generate-demo-sources.mjs`)
3. **Update package.json** with prebuild script
4. **Update API route** with hybrid loading
5. **Add demo-sources.json to .gitignore**
6. **Test build process** and verify sources are generated
7. **Test development mode** (filesystem fallback)
8. **Test production mode** (embedded sources)

## Safety & Maintenance

- **Zero impact on main package**: All changes isolated to demo
- **Build-time generation**: No ongoing processes or services needed
- **Easy removal**: Can be completely removed without affecting functionality
- **Clear logging**: Build script shows progress and any issues</content>
  <parameter name="filePath">.plans/astro-grab-production-hack.md
