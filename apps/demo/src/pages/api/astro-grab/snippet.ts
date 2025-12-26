import type { APIRoute } from "astro";
import { handleSnippetRequest } from "astro-grab-server";
import { readdir, stat } from "fs/promises";
import { resolve, join } from "path";

async function logFileTree(
  dir: string,
  prefix = "",
  depth = 0,
): Promise<string> {
  if (depth > 3) return ""; // Limit depth to avoid too much output

  let result = "";
  try {
    const items = await readdir(dir);
    for (const item of items) {
      if (item.startsWith(".") || item === "node_modules") continue;

      const fullPath = join(dir, item);
      const stats = await stat(fullPath);
      const isDir = stats.isDirectory();

      result += `${prefix}${isDir ? "📁" : "📄"} ${item}\n`;

      if (isDir && depth < 2) {
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
    const root = process.cwd();
    console.log("[astro-grab] Using root:", root);

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
