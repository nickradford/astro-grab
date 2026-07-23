import { parse } from '@astrojs/compiler';
import type { ElementNode, Node } from '@astrojs/compiler/types';
import { encodeSourceLocation, normalizePath } from '../shared/index.js';

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
  root?: string,
): Promise<InstrumentationResult> => {
  try {
    const ast = await parse(code, { position: true });
    return instrumentAst(ast.ast, code, filePath, root);
  } catch (error) {
    console.error(`[astro-grab] Failed to parse ${filePath}:`, error);
    return { code };
  }
};

const instrumentAst = (
  ast: Node,
  code: string,
  filePath: string,
  root?: string,
): InstrumentationResult => {
  const lineStartOffsets = getLineStartOffsets(code);
  const injections: Injection[] = [];
  const injectionOffsets = new Set<number>();
  const normalizedPath = getRelativeFilePath(filePath, root);
  const bodyNode = findBody(ast);
  const rootToWalk = bodyNode ?? ast;

  walkAst(rootToWalk, (node) => {
    const isInspectableElement =
      node.type === 'element' || node.type === 'custom-element';

    if (!isInspectableElement || !node.position) {
      return;
    }

    if (/^[A-Z]/.test(node.name)) {
      return;
    }

    if (
      node.type === 'element' &&
      ['body', 'script', 'style'].includes(node.name)
    ) {
      return;
    }

    const { line, column } = node.position.start;
    const tagStart = getCharacterOffset(lineStartOffsets, line, column);
    const tagPrefix = `<${node.name}`;

    if (code.slice(tagStart, tagStart + tagPrefix.length) !== tagPrefix) {
      return;
    }

    const insertOffset = tagStart + tagPrefix.length;
    if (injectionOffsets.has(insertOffset)) {
      return;
    }

    const encoded = encodeSourceLocation({
      file: normalizedPath,
      line,
      column,
    });

    injectionOffsets.add(insertOffset);
    injections.push({
      offset: insertOffset,
      attribute: ` data-astro-grab="${encoded}"`,
    });
  });

  injections.sort(
    (firstInjection, secondInjection) =>
      secondInjection.offset - firstInjection.offset,
  );

  const instrumentedCode = injections.reduce(
    (currentCode, injection) =>
      currentCode.slice(0, injection.offset) +
      injection.attribute +
      currentCode.slice(injection.offset),
    code,
  );

  return { code: instrumentedCode };
};

const getLineStartOffsets = (code: string): number[] => {
  const lineStartOffsets = [0];

  for (let characterIndex = 0; characterIndex < code.length; characterIndex++) {
    if (code[characterIndex] === '\n') {
      lineStartOffsets.push(characterIndex + 1);
    }
  }

  return lineStartOffsets;
};

const getCharacterOffset = (
  lineStartOffsets: number[],
  line: number,
  column: number,
): number => {
  const lineStartOffset = lineStartOffsets[line - 1];
  if (lineStartOffset === undefined) {
    return -1;
  }

  return lineStartOffset + column - 1;
};

const getRelativeFilePath = (filePath: string, root?: string): string => {
  let normalizedPath = normalizePath(filePath);

  if (!root) {
    return normalizedPath;
  }

  const normalizedRoot = normalizePath(root);
  if (!normalizedPath.startsWith(normalizedRoot)) {
    return normalizedPath;
  }

  normalizedPath = normalizedPath.slice(normalizedRoot.length);
  return normalizedPath.startsWith('/')
    ? normalizedPath.slice(1)
    : normalizedPath;
};

const findBody = (node: Node): ElementNode | null => {
  if (node.type === 'element' && node.name === 'body') {
    return node;
  }

  if (!('children' in node)) {
    return null;
  }

  for (const childNode of node.children) {
    const bodyNode = findBody(childNode);
    if (bodyNode) {
      return bodyNode;
    }
  }

  return null;
};

const walkAst = (node: Node, callback: (node: Node) => void): void => {
  callback(node);

  if (!('children' in node)) {
    return;
  }

  node.children.forEach((childNode) => walkAst(childNode, callback));
};
