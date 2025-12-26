import type { APIRoute } from "astro";
import { handleSnippetRequest } from "astro-grab-server";
import { readdir, stat } from "fs/promises";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

async function logFileTree(
  dir: string,
  prefix = "",
  depth = 0,
): Promise<string> {
  let result = "";
  try {
    const items = await readdir(dir);
    for (const item of items) {
      if (item.startsWith(".") || item === "node_modules") continue;

      const fullPath = join(dir, item);
      const stats = await stat(fullPath);
      const isDir = stats.isDirectory();

      result += `${prefix}${isDir ? "📁" : "📄"} ${item}\n`;

      if (isDir) {
        result += await logFileTree(fullPath, prefix + "  ", depth + 1);
      }
    }
  } catch (error) {
    result += `${prefix}❌ Error reading directory: ${error}\n`;
  }
  return result;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const src = url.searchParams.get("src");
  const contextLinesParam = url.searchParams.get("contextLines");

  console.log("[astro-grab] API called with src:", src);

  if (!src) {
    return new Response(JSON.stringify({ error: "Missing src parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contextLines = contextLinesParam ? parseInt(contextLinesParam, 10) : 4;

  try {
    const cwd = process.cwd();
    console.log("[astro-grab] Current working directory:", cwd);

    // In Vercel serverless functions, we need to find the project root
    // Try common locations where Astro projects are deployed
    let root = cwd;

    // Check if we're in a Vercel environment and find the correct root
    const possibleRoots = [
      cwd,
      resolve(cwd, ".."),
      "/var/task",
      resolve(cwd, "../../.."), // Go up to find the actual project root
    ];

    // Also try to find root by traversing up from this API route
    const currentFilePath = fileURLToPath(import.meta.url);
    let apiRouteDir = dirname(currentFilePath);
    for (let i = 0; i < 10; i++) {
      possibleRoots.push(apiRouteDir);
      apiRouteDir = resolve(apiRouteDir, "..");
    }

    for (const candidateRoot of possibleRoots) {
      console.log("[astro-grab] Checking root candidate:", candidateRoot);
      const testPath = resolve(candidateRoot, "src/components/Hero.astro");
      console.log("[astro-grab] Testing file path:", testPath);

      try {
        await stat(testPath);
        console.log("[astro-grab] Found project root at:", candidateRoot);
        root = candidateRoot;
        break;
      } catch {
        console.log("[astro-grab] File not found at:", testPath);
      }
    }

    console.log("[astro-grab] Final root:", root);

    // Log the file tree starting from root
    const fileTree = await logFileTree(root);
    console.log("[astro-grab] File tree from root:");
    console.log(fileTree);

    // Try to resolve the file path
    const filePath = resolve(root, src);
    console.log("[astro-grab] Resolved file path:", filePath);

    const result = await handleSnippetRequest(src, {
      root,
      contextLines,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[astro-grab] Snippet handler error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
