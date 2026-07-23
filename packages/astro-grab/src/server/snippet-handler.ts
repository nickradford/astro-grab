import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { decodeSourceLocation, extractSnippet } from '../shared/index.js';
import type { SnippetResponse } from '../shared/index.js';

export interface SnippetHandlerOptions {
  root: string;
  contextLines?: number;
}

export const handleSnippetRequest = async (
  src: string,
  options: SnippetHandlerOptions,
): Promise<SnippetResponse> => {
  const { root, contextLines = 4 } = options;

  let loc;
  try {
    loc = decodeSourceLocation(src);
  } catch (error) {
    throw new Error(
      `Invalid source location: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let filePath: string;
  let content: string;
  try {
    filePath = await resolveSourceFile(root, loc.file);
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof SourceOutsideRootError) {
      throw error;
    }

    throw new Error(
      `Failed to read file "${loc.file}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }

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
    language: 'astro',
  };
};

class SourceOutsideRootError extends Error {
  constructor(file: string) {
    super(`Source file must be inside project root: "${file}"`);
    this.name = 'SourceOutsideRootError';
  }
}

const resolveSourceFile = async (
  root: string,
  sourceFile: string,
): Promise<string> => {
  const resolvedRoot = await realpath(root);
  const candidatePath = resolve(resolvedRoot, sourceFile);

  if (!isPathInsideRoot(resolvedRoot, candidatePath)) {
    throw new SourceOutsideRootError(sourceFile);
  }

  const resolvedFile = await realpath(candidatePath);
  if (!isPathInsideRoot(resolvedRoot, resolvedFile)) {
    throw new SourceOutsideRootError(sourceFile);
  }

  return resolvedFile;
};

const isPathInsideRoot = (root: string, file: string): boolean => {
  const relativePath = relative(root, file);
  return (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
};
