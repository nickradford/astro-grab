import { AstroGrab } from './index.js';

/**
 * Auto-start entry point
 * This file self-executes on load to automatically initialize AstroGrab
 */
if (typeof window !== 'undefined') {
  const instance = new AstroGrab();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => instance.init());
  } else {
    instance.init();
  }
}
