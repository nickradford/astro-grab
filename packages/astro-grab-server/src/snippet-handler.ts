import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decodeSourceLocation, extractSnippet } from 'astro-grab-shared';
import type { SnippetResponse } from 'astro-grab-shared';

export interface SnippetHandlerOptions {
  root: string;
  contextLines?: number;
}

export const handleSnippetRequest = async (
   src: string,
   options: SnippetHandlerOptions
 ): Promise<SnippetResponse> => {
   const { root, contextLines = 4 } = options;

   let loc;
   try {
     loc = decodeSourceLocation(decodeURIComponent(src));
   } catch (error) {
     throw new Error(`Invalid source location: ${error instanceof Error ? error.message : String(error)}`);
   }

   const filePath = resolve(root, loc.file);

   let content: string;
   try {
     content = await readFile(filePath, 'utf-8');
   } catch (error) {
     throw new Error(`Failed to read file "${loc.file}": ${error instanceof Error ? error.message : String(error)}`);
   }

   const { snippet, startLine, endLine } = extractSnippet(
     content,
     loc.line,
     contextLines
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
