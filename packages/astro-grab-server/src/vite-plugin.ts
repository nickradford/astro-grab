import type { Plugin } from 'vite';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { transformAstroFile } from './transform.js';
import { handleSnippetRequest } from './snippet-handler.js';

export interface AstroGrabPluginOptions {
  contextLines?: number;
}

/**
 * Vite plugin that instruments .astro files and provides snippet endpoint
 */
export function astroGrabVitePlugin(
  options: AstroGrabPluginOptions = {}
): Plugin {
  const { contextLines: defaultContextLines = 4 } = options;
  let root: string;

  return {
    name: 'astro-grab',
    enforce: 'pre', // Run before Astro's transform

    // Store the project root
    configResolved(config) {
      root = config.root;
    },

    // Load hook to get original source before Astro compiles it
    async load(id) {
      if (!id.endsWith('.astro') || id.includes('node_modules')) {
        return null;
      }

      try {
        const { readFile } = await import('fs/promises');
        const code = await readFile(id, 'utf-8');

        // Don't use addWatchFile - the file is already watched by Astro
        // Using it causes race conditions with HMR

        // Instrument the original source
        const result = await transformAstroFile(code, id, root);

        if (!result) {
          return null;
        }

        return {
          code: result.code,
          map: null,
        };
      } catch (error) {
        console.error(`[astro-grab] Error in load hook for ${id}:`, error);
        return null;
      }
    },

    // Handle hot updates - force full reload to avoid race conditions
    handleHotUpdate({ file, modules, server }) {
      if (file.endsWith('.astro')) {
        // Invalidate all modules to clear cache
        for (const mod of modules) {
          server.moduleGraph.invalidateModule(mod);
        }

        // Force full reload and return empty array to prevent Astro from also handling it
        // This avoids race conditions where Astro's HMR runs after ours
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });

        // Return empty array to signal we handled it (don't let it propagate to Astro)
        return [];
      }
      // Return undefined to use default behavior for non-.astro files
    },

    // Configure dev server middleware for snippet endpoint and client bundle
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Serve client bundle
        if (req.url === '/__astro_grab_client/auto.js') {
          try {
            const __dirname = dirname(fileURLToPath(import.meta.url));
            const clientPath = join(__dirname, '../../astro-grab-client/dist/auto.js');
            const content = await readFile(clientPath, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/javascript');
            res.end(content);
            return;
          } catch (error) {
            console.error('[astro-grab] Failed to serve client bundle:', error);
            res.statusCode = 500;
            res.end('// Failed to load astro-grab client');
            return;
          }
        }

        // Handle snippet endpoint
        if (!req.url?.startsWith('/__astro_grab/snippet')) {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const src = url.searchParams.get('src');

          if (!src) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing src parameter' }));
            return;
          }

          // Read contextLines from query param, fallback to default
          const contextLinesParam = url.searchParams.get('contextLines');
          const contextLines = contextLinesParam
            ? parseInt(contextLinesParam, 10)
            : defaultContextLines;

          const result = await handleSnippetRequest(src, {
            root,
            contextLines,
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (error) {
          console.error('[astro-grab] Snippet handler error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    },
  };
}
