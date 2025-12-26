import { describe, it, expect } from "vitest";
import { instrumentAstroFile } from "../src/parser.js";

describe("instrumentAstroFile", () => {
  it("should add data-astro-grab attributes to HTML elements", async () => {
    const code = `---
const title = "Hello";
---
<div class="container">
  <h1>{title}</h1>
</div>`;

    const result = await instrumentAstroFile(code, "test.astro");

    expect(result.code).toContain('data-astro-grab="test.astro:4:');
    expect(result.code).toContain('data-astro-grab="test.astro:5:');
  });

  it("should handle nested elements", async () => {
    const code = `<section>
  <div>
    <p>Text</p>
  </div>
</section>`;

    const result = await instrumentAstroFile(code, "nested.astro");

    // Should instrument all three elements
    expect(result.code.match(/data-astro-grab=/g)?.length).toBe(3);
  });

  it("should not instrument component tags (uppercase)", async () => {
    const code = `<div>
  <MyComponent prop="value" />
  <p>Text</p>
</div>`;

    const result = await instrumentAstroFile(code, "component.astro");

    // Should only instrument div and p, not MyComponent
    expect(result.code.match(/data-astro-grab=/g)?.length).toBe(2);
  });

  it("should preserve existing attributes", async () => {
    const code = `<div class="foo" id="bar">Content</div>`;

    const result = await instrumentAstroFile(code, "attrs.astro");

    expect(result.code).toContain("data-astro-grab");
    expect(result.code).toContain('class="foo"');
    expect(result.code).toContain('id="bar"');
  });

  it("should handle self-closing tags", async () => {
    const code = `<div>
  <img src="test.jpg" />
  <br />
</div>`;

    const result = await instrumentAstroFile(code, "selfclosing.astro");

    expect(result.code).toContain("data-astro-grab");
    expect(result.code.match(/data-astro-grab=/g)?.length).toBe(3);
  });

  it("should normalize Windows paths", async () => {
    const code = `<div>Test</div>`;

    const result = await instrumentAstroFile(
      code,
      "C:\\Users\\test\\project\\file.astro",
    );

    // Should use forward slashes
    expect(result.code).toContain(
      'data-astro-grab="C:/Users/test/project/file.astro:',
    );
  });

  it("should handle empty files gracefully", async () => {
    const code = "";

    const result = await instrumentAstroFile(code, "empty.astro");

    expect(result.code).toBe("");
  });

  it("should handle files with only frontmatter", async () => {
    const code = `---
const data = "test";
---`;

    const result = await instrumentAstroFile(code, "frontmatter.astro");

    // No HTML elements to instrument
    expect(result.code).toBe(code);
  });

  it("should handle parse errors gracefully", async () => {
    // @astrojs/compiler is quite forgiving, so this test just verifies
    // that instrumentAstroFile doesn't crash on unusual input
    const code = `<div><<>>></div>`;

    const result = await instrumentAstroFile(code, "invalid.astro");

    // Should return some result without crashing
    expect(result.code).toBeDefined();
    expect(typeof result.code).toBe("string");
  });

  it("should handle multiple attributes on same element", async () => {
    const code = `<button class="btn" type="submit" disabled>Click</button>`;

    const result = await instrumentAstroFile(code, "button.astro");

    expect(result.code).toContain("data-astro-grab");
    expect(result.code).toContain('class="btn"');
    expect(result.code).toContain('type="submit"');
    expect(result.code).toContain("disabled");
  });

  it("should instrument all elements in complex nested structure", async () => {
    const code = `<section id="demo" class="demo">
   <div class="container">
     <h2>Demo</h2>
     <div class="steps">
       <div class="step-card">
         <div class="icon">🎯</div>
         <h3>Hold <kbd>Cmd+G</kbd></h3>
         <p>Enter targeting mode</p>
       </div>
       <div class="step-card">
         <div class="icon">👆</div>
         <h3>Hover</h3>
         <p>See highlights</p>
       </div>
     </div>
   </div>
 </section>`;

    const result = await instrumentAstroFile(code, "complex.astro");

    // Should instrument all HTML elements: section, div.container, h2, div.steps, div.step-card (2), div.icon (2), h3 (2), kbd, p (2)
    const grabAttributes = result.code.match(/data-astro-grab=/g);
    expect(grabAttributes?.length).toBe(13);

    // Verify specific elements are instrumented
    expect(result.code).toContain('data-astro-grab="complex.astro:1:');
    expect(result.code).toContain('data-astro-grab="complex.astro:2:');
    expect(result.code).toContain('data-astro-grab="complex.astro:3:');
    expect(result.code).toContain('data-astro-grab="complex.astro:4:');
    expect(result.code).toContain('data-astro-grab="complex.astro:5:');
    expect(result.code).toContain('data-astro-grab="complex.astro:6:');
    expect(result.code).toContain('data-astro-grab="complex.astro:7:');
    expect(result.code).toContain('data-astro-grab="complex.astro:8:');
    expect(result.code).toContain('data-astro-grab="complex.astro:10:');
    expect(result.code).toContain('data-astro-grab="complex.astro:11:');
    expect(result.code).toContain('data-astro-grab="complex.astro:12:');
  });

  it("should instrument all elements in Hero.astro structure", async () => {
    const heroContent = `---
      // Hero component
      ---

      <section class="text-center py-16">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">astro-grab</h1>
          <p class="text-xl sm:text-2xl text-gray-700 mb-6 font-medium">Copy any Astro component's source code instantly</p>
          <p class="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto">
            Hold <kbd class="bg-gray-100 px-2 py-1 rounded border text-sm font-mono text-gray-900">Cmd+G</kbd> (Mac) or <kbd class="bg-gray-100 px-2 py-1 rounded border text-sm font-mono text-gray-900">Ctrl+G</kbd> (Windows/Linux) for 1 second to enter targeting mode,
            then click any element to copy its source code—perfect for AI assistants.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#installation" class="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors duration-200">Get Started</a>
            <a href="#try-it-now" class="bg-white text-black px-6 py-3 rounded-md font-medium border border-gray-300 hover:border-gray-900 transition-colors duration-200">Try Demo</a>
          </div>
        </div>
      </section>`;

    const result = await instrumentAstroFile(
      heroContent,
      "src/components/Hero.astro",
    );

    // Should instrument: section, div(max-w-2xl), h1, p(xl), p(base), kbd, kbd, div(flex), a, a = 10 total
    const grabAttributes = result.code.match(/data-astro-grab=/g);
    expect(grabAttributes?.length).toBe(10);

    // Verify specific missing elements are now instrumented
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:6:',
    );
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:7:',
    );
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:8:',
    );
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:9:',
    );
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:10:',
    );
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:13:',
    );
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:14:',
    );
    expect(result.code).toContain(
      'data-astro-grab="src/components/Hero.astro:15:',
    );
  });
});
