import type { AstroIntegration } from 'astro';
import { astroGrabVitePlugin } from 'astro-grab-server';
import type { AstroGrabOptions } from 'astro-grab-shared';

/**
 * Astro Grab integration
 * Enables visual element targeting in dev mode for copying source snippets
 */
export function astroGrab(options: AstroGrabOptions = {}): AstroIntegration {
  const {
    enabled = true,
    holdDuration = 1000,
    contextLines = 4,
  } = options;

  return {
    name: 'astro-grab',

    hooks: {
      'astro:config:setup': ({ updateConfig, injectScript, command }) => {
        // Only run in dev mode
        if (command !== 'dev' || !enabled) {
          return;
        }

        console.log('[astro-grab] Initializing...');

        // Add Vite plugin for instrumentation and snippet endpoint
        updateConfig({
          vite: {
            plugins: [astroGrabVitePlugin({ contextLines })],
          },
        });

        console.log('[astro-grab] Ready - Hold Cmd/Ctrl+G to target elements');
      },
    },
  };
}
