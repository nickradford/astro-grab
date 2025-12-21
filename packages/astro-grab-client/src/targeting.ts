import { StateMachine } from './state-machine.js';
import { Overlay } from './overlay.js';
import { copyToClipboard, formatSnippet } from './clipboard.js';
import type { SnippetResponse } from 'astro-grab-shared';

/**
 * Handles targeting mode interactions
 * Tracks mouse movement, highlights elements, and handles clicks
 */
export class TargetingHandler {
  private readonly stateMachine: StateMachine;
  private readonly overlay: Overlay;
  private readonly contextLines: number;
  private currentTarget: HTMLElement | null = null;

  constructor(stateMachine: StateMachine, overlay: Overlay, contextLines: number = 4) {
    this.stateMachine = stateMachine;
    this.overlay = overlay;
    this.contextLines = contextLines;
  }

  /**
   * Initialize targeting handlers
   */
  init(): void {
    this.stateMachine.onEnter('targeting', () => this.enable());
    this.stateMachine.onEnter('idle', () => this.disable());
  }

  /**
   * Enable targeting mode
   */
  private enable(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick, true);
  }

  /**
   * Disable targeting mode
   */
  private disable(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick, true);
    this.currentTarget = null;
    this.overlay.clearHighlight();
  }

  /**
   * Handle mouse movement - highlight hovered element
   */
  private handleMouseMove = (e: MouseEvent): void => {
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;

    if (!target) {
      this.overlay.clearHighlight();
      this.overlay.updateCrosshair(e.clientX, e.clientY, null);
      this.currentTarget = null;
      return;
    }

    // Find nearest element with data-astro-grab attribute
    const elementWithSource = this.findElementWithSource(target);

    if (elementWithSource) {
      this.currentTarget = elementWithSource;
      const rect = elementWithSource.getBoundingClientRect();
      const sourceInfo = elementWithSource.getAttribute('data-astro-grab');
      this.overlay.highlightElement(rect, sourceInfo);
      this.overlay.updateCrosshair(e.clientX, e.clientY, rect);
    } else {
      this.overlay.clearHighlight();
      this.overlay.updateCrosshair(e.clientX, e.clientY, null);
      this.currentTarget = null;
    }
  };

  /**
   * Handle click - fetch and copy snippet
   */
  private handleClick = async (e: MouseEvent): Promise<void> => {
    if (this.stateMachine.getState() !== 'targeting') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (this.currentTarget) {
      const src = this.currentTarget.getAttribute('data-astro-grab');
      if (src) {
        await this.fetchAndCopySnippet(src);
      }
    }

    // Exit targeting mode after click
    this.stateMachine.reset();
  };

  /**
   * Fetch snippet from server and copy to clipboard
   */
  private async fetchAndCopySnippet(src: string): Promise<void> {
    try {
      const response = await fetch(
        `/__astro_grab/snippet?src=${encodeURIComponent(src)}&contextLines=${this.contextLines}`
      );

      if (!response.ok) {
        console.error('[astro-grab] Failed to fetch snippet:', response.statusText);
        this.overlay.showToast('Failed to fetch snippet', 2000);
        return;
      }

      const data: SnippetResponse = await response.json();
      const formatted = formatSnippet(data);
      await copyToClipboard(formatted);

      console.log(`[astro-grab] Copied snippet from ${data.file}:${data.targetLine}`);
      this.overlay.showToast('Copied!', 1000);
    } catch (error) {
      console.error('[astro-grab] Error fetching snippet:', error);
      this.overlay.showToast('Error copying snippet', 2000);
    }
  }

  /**
   * Find the nearest ancestor (or self) with data-astro-grab attribute
   */
  private findElementWithSource(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      if (current.hasAttribute('data-astro-grab')) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }
}
