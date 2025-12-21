import { describe, it, expect } from "vitest";
import {
  encodeSourceLocation,
  decodeSourceLocation,
  normalizePath,
  extractSnippet,
} from "../src/utils.js";
import type { SourceLocation } from "../src/types.js";

describe("encodeSourceLocation", () => {
  it("should encode a source location correctly", () => {
    const loc: SourceLocation = {
      file: "src/pages/index.astro",
      line: 42,
      column: 8,
    };

    const encoded = encodeSourceLocation(loc);
    expect(encoded).toBe("src/pages/index.astro:42:8");
  });

  it("should handle paths with special characters", () => {
    const loc: SourceLocation = {
      file: "src/components/my-component.astro",
      line: 1,
      column: 1,
    };

    const encoded = encodeSourceLocation(loc);
    expect(encoded).toBe("src/components/my-component.astro:1:1");
  });
});

describe("decodeSourceLocation", () => {
  it("should decode a valid source location string", () => {
    const encoded = "src/pages/index.astro:42:8";
    const decoded = decodeSourceLocation(encoded);

    expect(decoded).toEqual({
      file: "src/pages/index.astro",
      line: 42,
      column: 8,
    });
  });

  it("should handle Windows absolute paths", () => {
    const encoded = "C:/Users/name/project/src/pages/index.astro:42:8";
    const decoded = decodeSourceLocation(encoded);

    expect(decoded).toEqual({
      file: "C:/Users/name/project/src/pages/index.astro",
      line: 42,
      column: 8,
    });
  });

  it("should handle paths with multiple colons", () => {
    const encoded = "src/components/time:12:30.astro:42:8";
    const decoded = decodeSourceLocation(encoded);

    expect(decoded).toEqual({
      file: "src/components/time:12:30.astro",
      line: 42,
      column: 8,
    });
  });

  it("should throw error for invalid format (too few parts)", () => {
    expect(() => decodeSourceLocation("invalid:42")).toThrow("Invalid source location format");
  });

  it("should throw error for non-numeric line", () => {
    expect(() => decodeSourceLocation("file.astro:abc:8")).toThrow("Invalid line number");
  });

  it("should throw error for non-numeric column", () => {
    expect(() => decodeSourceLocation("file.astro:42:xyz")).toThrow("Invalid column number");
  });

  it("should throw error for line less than 1", () => {
    expect(() => decodeSourceLocation("file.astro:0:8")).toThrow("Invalid line number");
  });

  it("should throw error for column less than 1", () => {
    expect(() => decodeSourceLocation("file.astro:42:0")).toThrow("Invalid column number");
  });

  it("should throw error for non-.astro files", () => {
    expect(() => decodeSourceLocation("file.tsx:42:8")).toThrow("File must be an .astro file");
  });

  it("should throw error for empty file path", () => {
    expect(() => decodeSourceLocation(":42:8")).toThrow("File path is empty");
  });

  it("should perform round-trip encode/decode correctly", () => {
    const original: SourceLocation = {
      file: "src/layouts/BaseLayout.astro",
      line: 123,
      column: 45,
    };

    const encoded = encodeSourceLocation(original);
    const decoded = decodeSourceLocation(encoded);

    expect(decoded).toEqual(original);
  });
});

describe("normalizePath", () => {
  it("should convert backslashes to forward slashes", () => {
    const windowsPath = "src\\components\\Header.astro";
    const normalized = normalizePath(windowsPath);

    expect(normalized).toBe("src/components/Header.astro");
  });

  it("should leave forward slashes unchanged", () => {
    const unixPath = "src/components/Header.astro";
    const normalized = normalizePath(unixPath);

    expect(normalized).toBe("src/components/Header.astro");
  });

  it("should handle mixed slashes", () => {
    const mixedPath = "src\\components/nested\\Header.astro";
    const normalized = normalizePath(mixedPath);

    expect(normalized).toBe("src/components/nested/Header.astro");
  });
});

describe("extractSnippet", () => {
  const createContent = (numLines: number): string => {
    return Array.from({ length: numLines }, (_, i) => `line ${i + 1}`).join("\n");
  };

  it("should extract snippet with context around target line", () => {
    const content = createContent(100);
    const result = extractSnippet(content, 50, 5);

    expect(result.startLine).toBe(45);
    expect(result.endLine).toBe(55);
    expect(result.snippet).toContain("line 45");
    expect(result.snippet).toContain("line 50");
    expect(result.snippet).toContain("line 55");
  });

  it("should handle target line near start of file", () => {
    const content = createContent(100);
    const result = extractSnippet(content, 3, 5);

    expect(result.startLine).toBe(1); // Can't go below 1
    expect(result.endLine).toBe(8);
  });

  it("should handle target line near end of file", () => {
    const content = createContent(100);
    const result = extractSnippet(content, 98, 5);

    expect(result.startLine).toBe(93);
    expect(result.endLine).toBe(100); // Can't go beyond total lines
  });

  it("should handle default context lines (4)", () => {
    const content = createContent(100);
    const result = extractSnippet(content, 50);

    expect(result.startLine).toBe(46); // 50 - 40
    expect(result.endLine).toBe(54); // 50 + 40
  });

  it("should handle small files with large context", () => {
    const content = createContent(10);
    const result = extractSnippet(content, 5, 50);

    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(10);
    expect(result.snippet.split("\n")).toHaveLength(10);
  });

  it("should throw error for target line below 1", () => {
    const content = createContent(10);
    expect(() => extractSnippet(content, 0, 5)).toThrow("out of bounds");
  });

  it("should throw error for target line beyond file length", () => {
    const content = createContent(10);
    expect(() => extractSnippet(content, 11, 5)).toThrow("out of bounds");
  });

  it("should handle single-line file", () => {
    const content = "only line";
    const result = extractSnippet(content, 1, 5);

    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(1);
    expect(result.snippet).toBe("only line");
  });

  it("should preserve empty lines in snippet", () => {
    const content = "line 1\n\nline 3\n\nline 5";
    const result = extractSnippet(content, 3, 2);

    expect(result.snippet).toBe("line 1\n\nline 3\n\nline 5");
  });

  it("should handle zero context lines (only target line)", () => {
    const content = createContent(10);
    const result = extractSnippet(content, 5, 0);

    expect(result.startLine).toBe(5);
    expect(result.endLine).toBe(5);
    expect(result.snippet).toBe("line 5");
  });
});
