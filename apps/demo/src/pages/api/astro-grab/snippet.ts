import type { APIRoute } from "astro";
import { handleSnippetRequest } from "astro-grab-server";

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
    const root = process.cwd(); // Use current working directory as root
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
