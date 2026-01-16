import { describe, it, expect } from "vitest";
import { formatSnippet } from "../../src/client/clipboard.js";
import type { SnippetResponse } from "../../src/shared/index.js";

describe("formatSnippet", () => {
  it("should format snippet with default template", () => {
    const data: SnippetResponse = {
      file: "src/components/Card.astro",
      snippet: 'const title = "Hello";\n<div>{title}</div>',
      startLine: 5,
      endLine: 7,
      targetLine: 6,
      language: "astro",
    };

    const formatted = formatSnippet(data);

    expect(formatted).toContain("Source: src/components/Card.astro:6");
    expect(formatted).toContain("```astro");
    expect(formatted).toContain('const title = "Hello";');
    expect(formatted).toContain("<div>{title}</div>");
    expect(formatted).toContain("```");
  });

  it("should handle multi-line snippets", () => {
    const data: SnippetResponse = {
      file: "test.astro",
      snippet: "line 1\nline 2\nline 3",
      startLine: 1,
      endLine: 3,
      targetLine: 2,
      language: "astro",
    };

    const formatted = formatSnippet(data);

    expect(formatted).toContain("line 1");
    expect(formatted).toContain("line 2");
    expect(formatted).toContain("line 3");
  });

  it("should handle empty snippets", () => {
    const data: SnippetResponse = {
      file: "empty.astro",
      snippet: "",
      startLine: 1,
      endLine: 1,
      targetLine: 1,
      language: "astro",
    };

    const formatted = formatSnippet(data);

    expect(formatted).toContain("Source: empty.astro:1");
    expect(formatted).toContain("```astro");
    expect(formatted).toContain("```");
  });

  it("should preserve code formatting in snippet", () => {
    const data: SnippetResponse = {
      file: "formatted.astro",
      snippet: "  <div>\n    <p>Indented</p>\n  </div>",
      startLine: 10,
      endLine: 12,
      targetLine: 11,
      language: "astro",
    };

    const formatted = formatSnippet(data);

    // Check that indentation is preserved
    expect(formatted).toContain("  <div>");
    expect(formatted).toContain("    <p>Indented</p>");
    expect(formatted).toContain("  </div>");
  });

  it("should handle special characters in file paths", () => {
    const data: SnippetResponse = {
      file: "src/pages/[slug].astro",
      snippet: "<div>Dynamic</div>",
      startLine: 1,
      endLine: 1,
      targetLine: 1,
      language: "astro",
    };

    const formatted = formatSnippet(data);

    expect(formatted).toContain("Source: src/pages/[slug].astro:1");
  });

  it("should use custom template when provided", () => {
    const data: SnippetResponse = {
      file: "src/components/Card.astro",
      snippet: "<div>Hello</div>",
      startLine: 5,
      endLine: 7,
      targetLine: 6,
      language: "astro",
    };

    const customTemplate = "File: {{file}}\nLines: {{startLine}}-{{endLine}}\n{{snippet}}";
    const formatted = formatSnippet(data, customTemplate);

    expect(formatted).toBe(
      "File: src/components/Card.astro\nLines: 5-7\n<div>Hello</div>"
    );
  });

  it("should replace all occurrences of template variables", () => {
    const data: SnippetResponse = {
      file: "test.astro",
      snippet: "code",
      startLine: 1,
      endLine: 5,
      targetLine: 3,
      language: "astro",
    };

    const customTemplate = "{{file}} | {{file}} | line {{targetLine}}";
    const formatted = formatSnippet(data, customTemplate);

    expect(formatted).toBe("test.astro | test.astro | line 3");
  });
});
