// Main exports
export { astroGrabVitePlugin } from './vite-plugin.js';
export type { AstroGrabPluginOptions } from './vite-plugin.js';

// Export utilities for testing
export { instrumentAstroFile } from './parser.js';
export { transformAstroFile } from './transform.js';
export { handleSnippetRequest } from './snippet-handler.js';
