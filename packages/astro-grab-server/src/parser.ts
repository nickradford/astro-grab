import { parse } from '@astrojs/compiler';
import { encodeSourceLocation, normalizePath } from 'astro-grab-shared';

export interface InstrumentationResult {
  code: string;
}

interface Injection {
  offset: number;
  attribute: string;
}

/**
 * Instruments an Astro file by adding data-astro-grab attributes to HTML elements
 * @param code The source code of the .astro file
 * @param filePath The file path (for attribution)
 * @param root The project root directory (optional, for making paths relative)
 * @returns Instrumented code with data-astro-grab attributes
 */
export async function instrumentAstroFile(
  code: string,
  filePath: string,
  root?: string
): Promise<InstrumentationResult> {
  let ast: any;

  try {
    ast = await parse(code, { position: true });
  } catch (error) {
    // If parsing fails, return original code (don't break the build)
    console.error(`[astro-grab] Failed to parse ${filePath}:`, error);
    return { code };
  }

  // Helper: Calculate line and column from character offset
  const lines = code.split('\n');
  const getLineAndColumn = (offset: number): { line: number; column: number } => {
    let currentOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline
      const lineEnd = currentOffset + lineLength;

      if (offset < lineEnd || i === lines.length - 1) {
        const column = offset - currentOffset + 1;
        return {
          line: i + 1, // 1-based
          column,
        };
      }
      currentOffset += lineLength;
    }
    return { line: lines.length, column: 1 };
  };

  const injections: Injection[] = [];
  let normalizedPath = normalizePath(filePath);

  // Make path relative to project root if root is provided
  if (root) {
    const normalizedRoot = normalizePath(root);
    if (normalizedPath.startsWith(normalizedRoot)) {
      normalizedPath = normalizedPath.slice(normalizedRoot.length);
      // Remove leading slash if present
      if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.slice(1);
      }
    }
  }

  // Walk the AST to find HTML elements
  walkAst(ast.ast, (node: any) => {
    // Only process element nodes (not components)
    if (node.type === 'element' && node.position) {
      // Skip if it's a component (uppercase first letter)
      if (node.name && /^[A-Z]/.test(node.name)) {
        return;
      }

      // Skip script and style tags
      if (node.name === 'script' || node.name === 'style') {
        return;
      }

      // Calculate actual line and column from character offset
      const { line, column } = getLineAndColumn(node.position.start.offset);

      const loc = {
        file: normalizedPath,
        line,
        column,
      };

      const encoded = encodeSourceLocation(loc);

      // Find insertion point: after the tag name in the opening tag
      // e.g., <div class="foo"> -> <div data-astro-grab="..." class="foo">
      const tagStart = node.position.start.offset;
      const tagNameLength = node.name.length;

      // Position is right after the tag name: <div| class="foo">
      const insertOffset = tagStart + 1 + tagNameLength;

      injections.push({
        offset: insertOffset,
        attribute: ` data-astro-grab="${encoded}"`,
      });
    }
  });

  // Apply injections in reverse order to avoid offset issues
  injections.sort((a, b) => b.offset - a.offset);

  let instrumentedCode = code;
  for (const { offset, attribute } of injections) {
    instrumentedCode =
      instrumentedCode.slice(0, offset) +
      attribute +
      instrumentedCode.slice(offset);
  }

  return { code: instrumentedCode };
}

/**
 * Simple AST walker function
 */
function walkAst(node: any, callback: (node: any) => void) {
  if (!node || typeof node !== 'object') {
    return;
  }

  callback(node);

  // Walk children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      walkAst(child, callback);
    }
  }

  // Walk attributes if present
  if (node.attributes && Array.isArray(node.attributes)) {
    for (const attr of node.attributes) {
      walkAst(attr, callback);
    }
  }
}
