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
