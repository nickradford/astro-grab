export { astroGrab } from "./integration.js";
export type { AstroGrabOptions, SnippetResponse } from "./shared/index.js";

// Re-export for production API routes
export {
  handleSnippetRequest,
  handleSnippetRequestFromContent,
} from "./server/index.js";
