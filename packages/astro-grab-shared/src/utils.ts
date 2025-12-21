import type { SourceLocation } from './types.js';

export const encodeSourceLocation = (loc: SourceLocation): string => {
  return `${loc.file}:${loc.line}:${loc.column}`;
};

export const decodeSourceLocation = (encoded: string): SourceLocation => {
  const parts = encoded.split(':');

  if (parts.length < 3) {
    throw new Error(`Invalid source location format: "${encoded}". Expected "file:line:column"`);
  }

  let file: string;
  let lineStr: string;
  let columnStr: string;

  if (parts.length === 3) {
    [file, lineStr, columnStr] = parts;
  } else if (parts.length === 4 && parts[0].length === 0 && parts[1].length === 1) {
    file = parts[0] + ':' + parts[1];
    lineStr = parts[2];
    columnStr = parts[3];
  } else {
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

  if (!file.endsWith('.astro')) {
    throw new Error(`File must be an .astro file, got: "${file}"`);
  }

  return { file, line, column };
};

export const normalizePath = (path: string): string => {
  return path.replace(/\\/g, '/');
};

export const extractSnippet = (
  content: string,
  targetLine: number,
  contextLines: number = 4
): { snippet: string; startLine: number; endLine: number } => {
  const lines = content.split('\n');
  const totalLines = lines.length;

  if (targetLine < 1 || targetLine > totalLines) {
    throw new Error(`Target line ${targetLine} is out of bounds (file has ${totalLines} lines)`);
  }

  const startLine = Math.max(1, targetLine - contextLines);
  const endLine = Math.min(totalLines, targetLine + contextLines);

  const snippetLines = lines.slice(startLine - 1, endLine);
  const snippet = snippetLines.join('\n');

  return { snippet, startLine, endLine };
};
