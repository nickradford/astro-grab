import type { Plugin } from "vite";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { transformAstroFile } from "./transform.js";
import { handleSnippetRequest } from "./snippet-handler.js";

export interface AstroGrabPluginOptions {
  contextLines?: number;
  hue?: number;
}

export const astroGrabVitePlugin = (
  options: AstroGrabPluginOptions = {},
): Plugin => {
  const { contextLines: defaultContextLines = 4, hue = 30 } = options;
  let root: string;

  return {
    name: "astro-grab",
    enforce: "pre",

    configResolved(config) {
      root = config.root;
    },

    async load(id) {
      if (!id.endsWith(".astro") || id.includes("node_modules")) {
        return null;
      }

      try {
        const { readFile } = await import("fs/promises");
        const code = await readFile(id, "utf-8");

        // HACK: Don't use addWatchFile - causes race conditions with HMR
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

    handleHotUpdate({ file, modules, server }) {
      if (file.endsWith(".astro")) {
        for (const mod of modules) {
          server.moduleGraph.invalidateModule(mod);
        }

        // HACK: Force full reload to avoid race conditions with Astro's HMR
        server.ws.send({
          type: "full-reload",
          path: "*",
        });

        return [];
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/__astro_grab_client/auto.js") {
          try {
            const __dirname = dirname(fileURLToPath(import.meta.url));
            const clientPath = join(
              __dirname,
              "../../astro-grab-client/dist/auto.js",
            );
            const content = await readFile(clientPath, "utf-8");

            const configScript = `window.__ASTRO_GRAB_CONFIG__ = { hue: ${hue} };\n`;

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/javascript");
            res.end(configScript + content);
            return;
          } catch (error) {
            console.error("[astro-grab] Failed to serve client bundle:", error);
            res.statusCode = 500;
            res.end("// Failed to load astro-grab client");
            return;
          }
        }

        if (!req.url?.startsWith("/__astro_grab/snippet")) {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const src = url.searchParams.get("src");

          if (!src) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing src parameter" }));
            return;
          }

          const contextLinesParam = url.searchParams.get("contextLines");
          const contextLines = contextLinesParam
            ? parseInt(contextLinesParam, 10)
            : defaultContextLines;

          const result = await handleSnippetRequest(src, {
            root,
            contextLines,
          });

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } catch (error) {
          console.error("[astro-grab] Snippet handler error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
    },
  };
};
