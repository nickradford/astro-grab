import { instrumentAstroFile } from './parser.js';

/**
 * Transforms an Astro file to add data-astro-grab attributes
 * @param code The source code
 * @param id The file ID/path from Vite
 * @param root The project root directory
 * @returns Transformed code or null if not applicable
 */
export async function transformAstroFile(
  code: string,
  id: string,
  root?: string
): Promise<{ code: string } | null> {
  // Only transform .astro files
  if (!id.endsWith('.astro')) {
    return null;
  }

  // Skip node_modules
  if (id.includes('node_modules')) {
    return null;
  }

  try {
    return await instrumentAstroFile(code, id, root);
  } catch (error) {
    console.error(`[astro-grab] Error transforming ${id}:`, error);
    // Return original code on error
    return { code };
  }
}
