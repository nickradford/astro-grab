import { parse } from '@astrojs/compiler';
import { encodeSourceLocation, normalizePath } from 'astro-grab-shared';

export interface InstrumentationResult {
  code: string;
}

interface Injection {
  offset: number;
  attribute: string;
}

export const instrumentAstroFile = async (
  code: string,
  filePath: string,
  root?: string
): Promise<InstrumentationResult> => {
  let ast: any;

  try {
    ast = await parse(code, { position: true });
  } catch (error) {
    console.error(`[astro-grab] Failed to parse ${filePath}:`, error);
    return { code };
  }

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

  if (root) {
    const normalizedRoot = normalizePath(root);
    if (normalizedPath.startsWith(normalizedRoot)) {
      normalizedPath = normalizedPath.slice(normalizedRoot.length);
      if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.slice(1);
      }
    }
  }

  let bodyNode: any = null;
  const findBody = (node: any): any => {
    if (node.type === 'element' && node.name === 'body') {
      return node;
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = findBody(child);
        if (found) return found;
      }
    }
    return null;
  };
  bodyNode = findBody(ast.ast);

  const rootToWalk = bodyNode || ast.ast;

  walkAst(rootToWalk, (node: any) => {
    if (node.type === 'element' && node.position) {
      if (node.name && /^[A-Z]/.test(node.name)) {
        return;
      }

      if (node.name === 'script' || node.name === 'style') {
        return;
      }

      if (node.name === 'body') {
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

      // Find insertion point more carefully by looking at the actual code
      // We need to find the position after the tag name but before any attributes
      const tagStart = node.position.start.offset;

      // Find the end of the opening tag to search within
      let searchEnd = tagStart;
      let depth = 0;
      for (let i = tagStart; i < code.length; i++) {
        if (code[i] === '<') depth++;
        if (code[i] === '>') {
          depth--;
          if (depth === 0) {
            searchEnd = i;
            break;
          }
        }
      }

      // Search for the tag name within the opening tag
      const openingTagContent = code.slice(tagStart, searchEnd + 1);
      const tagPattern = new RegExp(`^<${node.name}([\\s>])`);
      const match = openingTagContent.match(tagPattern);

      if (match) {
        // Insert right after the tag name (before the space or >)
        const insertOffset = tagStart + match[0].length - 1;
        injections.push({
          offset: insertOffset,
          attribute: ` data-astro-grab="${encoded}"`,
        });
      }
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
};

const walkAst = (node: any, callback: (node: any) => void): void => {
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
};
