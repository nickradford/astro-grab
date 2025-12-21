import type { SnippetResponse } from 'astro-grab-shared';

/**
 * Format a snippet response for clipboard
 */
export function formatSnippet(data: SnippetResponse): string {
  return `Astro Grab (alpha)

Source: ${data.file}:${data.targetLine}:1

\`\`\`astro
${data.snippet}
\`\`\``;
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    // Modern Clipboard API
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
    } catch (execError) {
      console.error('[astro-grab] Failed to copy to clipboard:', execError);
      throw new Error('Clipboard copy failed');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
