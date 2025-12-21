import type { SnippetResponse } from "astro-grab-shared";

export const formatSnippet = (data: SnippetResponse): string => {
  return `Astro Grab (alpha)

Source: ${data.file}:${data.targetLine}:1

\`\`\`astro
${data.snippet}
\`\`\``;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (execError) {
      console.error("[astro-grab] Failed to copy to clipboard:", execError);
      throw new Error("Clipboard copy failed");
    } finally {
      document.body.removeChild(textarea);
    }
  }
};
