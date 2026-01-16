import { DEFAULT_TEMPLATE, type SnippetResponse } from "../shared/index.js";

export const formatSnippet = (
  data: SnippetResponse,
  template: string = DEFAULT_TEMPLATE
): string => {
  return template
    .replace(/\{\{file\}\}/g, data.file)
    .replace(/\{\{snippet\}\}/g, data.snippet)
    .replace(/\{\{startLine\}\}/g, String(data.startLine))
    .replace(/\{\{endLine\}\}/g, String(data.endLine))
    .replace(/\{\{targetLine\}\}/g, String(data.targetLine))
    .replace(/\{\{language\}\}/g, data.language);
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
