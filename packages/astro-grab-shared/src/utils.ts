import type { SourceLocation } from './types.js';

/**
 * Encodes a source location into the format "file:line:column"
 */
export function encodeSourceLocation(loc: SourceLocation): string {
  return `${loc.file}:${loc.line}:${loc.column}`;
}

/**
 * Decodes a source location string in the format "file:line:column"
 * @throws {Error} If the format is invalid or parts are missing/malformed
 */
export function decodeSourceLocation(encoded: string): SourceLocation {
  // Split by colon, but need to handle Windows paths (C:/ etc)
  // Strategy: split by : and then reconstruct the file path
  const parts = encoded.split(':');

  if (parts.length < 3) {
    throw new Error(`Invalid source location format: "${encoded}". Expected "file:line:column"`);
  }

  // Handle Windows paths: if second part is a single letter followed by a slash, it's a drive letter
  let file: string;
  let lineStr: string;
  let columnStr: string;

  if (parts.length === 3) {
    // Simple case: no colons in path
    [file, lineStr, columnStr] = parts;
  } else if (parts.length === 4 && parts[0].length === 0 && parts[1].length === 1) {
    // Windows absolute path: C:/...
    file = parts[0] + ':' + parts[1];
    lineStr = parts[2];
    columnStr = parts[3];
  } else {
    // Multiple colons - assume last two are line:column
    columnStr = parts.pop()!;
    lineStr = parts.pop()!;
    file = parts.join(':');
  }

  const line = parseInt(lineStr, 10);
  const column = parseInt(columnStr, 10);

  if (isNaN(line) || line < 1) {
    throw new Error(`Invalid line number: "${lineStr}"`);
  }

  if (isNaN(column) || column < 1) {
    throw new Error(`Invalid column number: "${columnStr}"`);
  }

  if (!file) {
    throw new Error('File path is empty');
  }

  // Validate it's an .astro file
  if (!file.endsWith('.astro')) {
    throw new Error(`File must be an .astro file, got: "${file}"`);
  }

  return { file, line, column };
}

/**
 * Normalizes a file path to use forward slashes (POSIX style)
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Extracts a snippet of code from the given content around a target line
 * @param content The full file content
 * @param targetLine The line number to extract around (1-based)
 * @param contextLines Number of lines to include before and after the target (default: 4)
 * @returns Object containing the snippet, start line, and end line
 */
export function extractSnippet(
  content: string,
  targetLine: number,
  contextLines: number = 4
): { snippet: string; startLine: number; endLine: number } {
  const lines = content.split('\n');
  const totalLines = lines.length;

  if (targetLine < 1 || targetLine > totalLines) {
    throw new Error(`Target line ${targetLine} is out of bounds (file has ${totalLines} lines)`);
  }

  // Calculate start and end lines (1-based)
  const startLine = Math.max(1, targetLine - contextLines);
  const endLine = Math.min(totalLines, targetLine + contextLines);

  // Extract snippet (convert to 0-based indexing for array)
  const snippetLines = lines.slice(startLine - 1, endLine);
  const snippet = snippetLines.join('\n');

  return { snippet, startLine, endLine };
}
