/**
 * Represents a source location in a file with line and column information
 */
export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

/**
 * Response format for snippet extraction endpoint
 */
export interface SnippetResponse {
  file: string;
  snippet: string;
  startLine: number;
  endLine: number;
  targetLine: number;
  language: string;
}

/**
 * Configuration options for the client-side grab functionality
 */
export interface ClientConfig {
  /** Whether to automatically start the grab functionality on page load */
  autoStart?: boolean;
  /** Duration in milliseconds to hold the keybind before activating targeting mode */
  holdDuration?: number;
  /** Number of lines of context to include around the target line */
  contextLines?: number;
}

/**
 * Client-side state machine states
 */
export type ClientState = 'idle' | 'holding' | 'targeting';

/**
 * Options for configuring the Astro Grab integration
 */
export interface AstroGrabOptions {
  /** Enable/disable the integration (default: true in dev mode) */
  enabled?: boolean;
  /** Duration in milliseconds to hold keybind (default: 1000) */
  holdDuration?: number;
  /** Number of lines of context around target (default: 40) */
  contextLines?: number;
}
