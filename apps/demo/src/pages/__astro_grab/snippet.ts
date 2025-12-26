import { handleSnippetRequest } from "astro-grab";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  // Only enable when explicitly force-enabled for production demos
  if (process.env.ASTRO_GRAB_DANGEROUSLY_FORCE_ENABLE !== "true") {
    return new Response("Astro Grab not enabled", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    const url = new URL(request.url);
    const src = url.searchParams.get("src");

    if (!src) {
      return new Response("Missing 'src' parameter", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Reuse existing snippet handler - zero duplication
    const result = await handleSnippetRequest(decodeURIComponent(src), {
      root: process.cwd(),
      contextLines: 4, // Default value matching integration
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow client-side requests
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch (error) {
    console.error("[astro-grab-api] Error:", error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }
};
