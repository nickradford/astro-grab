import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { handleSnippetRequest } from '../src/snippet-handler.js';
import { tmpdir } from 'node:os';

describe('handleSnippetRequest', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `astro-grab-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  it('should extract snippet with correct line numbers', async () => {
    const content = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n');
    const testFile = join(testDir, 'test.astro');
    await writeFile(testFile, content);

    const result = await handleSnippetRequest('test.astro:50:1', {
      root: testDir,
      contextLines: 5,
    });

    expect(result.file).toBe('test.astro');
    expect(result.targetLine).toBe(50);
    expect(result.startLine).toBe(45);
    expect(result.endLine).toBe(55);
    expect(result.language).toBe('astro');
    expect(result.snippet).toContain('line 50');
  });

  it('should use default context lines (4)', async () => {
    const content = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n');
    const testFile = join(testDir, 'test.astro');
    await writeFile(testFile, content);

    const result = await handleSnippetRequest('test.astro:50:1', {
      root: testDir,
    });

    expect(result.startLine).toBe(46); // 50 - 40
    expect(result.endLine).toBe(54); // 50 + 40
  });

  it('should throw error for invalid source location format', async () => {
    await expect(
      handleSnippetRequest('invalid', { root: testDir })
    ).rejects.toThrow('Invalid source location');
  });

  it('should throw error for non-existent file', async () => {
    await expect(
      handleSnippetRequest('nonexistent.astro:1:1', { root: testDir })
    ).rejects.toThrow('Failed to read file');
  });

  it('should throw error for line out of bounds', async () => {
    const content = 'line 1\nline 2\nline 3';
    const testFile = join(testDir, 'small.astro');
    await writeFile(testFile, content);

    await expect(
      handleSnippetRequest('small.astro:10:1', {
        root: testDir,
        contextLines: 5,
      })
    ).rejects.toThrow('out of bounds');
  });

  it('should handle nested paths', async () => {
    const nestedDir = join(testDir, 'src', 'components');
    await mkdir(nestedDir, { recursive: true });

    const content = 'test content\nline 2\nline 3';
    const testFile = join(nestedDir, 'Component.astro');
    await writeFile(testFile, content);

    const result = await handleSnippetRequest('src/components/Component.astro:2:1', {
      root: testDir,
      contextLines: 1,
    });

    expect(result.file).toBe('src/components/Component.astro');
    expect(result.snippet).toContain('line 2');
  });

  it('should handle URL-encoded source locations', async () => {
    const content = 'line 1\nline 2\nline 3';
    const testFile = join(testDir, 'test.astro');
    await writeFile(testFile, content);

    const encoded = encodeURIComponent('test.astro:2:1');
    const result = await handleSnippetRequest(encoded, {
      root: testDir,
      contextLines: 1,
    });

    expect(result.targetLine).toBe(2);
    expect(result.snippet).toContain('line 2');
  });

  it('should handle files at file boundaries', async () => {
    const content = 'line 1\nline 2\nline 3';
    const testFile = join(testDir, 'small.astro');
    await writeFile(testFile, content);

    // Request first line
    const result1 = await handleSnippetRequest('small.astro:1:1', {
      root: testDir,
      contextLines: 10,
    });
    expect(result1.startLine).toBe(1);

    // Request last line
    const result2 = await handleSnippetRequest('small.astro:3:1', {
      root: testDir,
      contextLines: 10,
    });
    expect(result2.endLine).toBe(3);
  });
});
