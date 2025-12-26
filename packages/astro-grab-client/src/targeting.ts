import { StateMachine } from "./state-machine.js";
import { Overlay } from "./overlay.js";
import { copyToClipboard, formatSnippet } from "./clipboard.js";
import type { SnippetResponse } from "astro-grab-shared";

/**
 * Handles targeting mode interactions
 * Tracks mouse movement, highlights elements, and handles clicks
 */
export class TargetingHandler {
  private readonly stateMachine: StateMachine;
  private readonly overlay: Overlay;
  private contextLines: number;
  private apiBaseUrl: string | undefined;
  private currentTarget: HTMLElement | null = null;
  private currentMouseX = 0;
  private currentMouseY = 0;

  constructor(
    stateMachine: StateMachine,
    overlay: Overlay,
    contextLines: number = 4,
    apiBaseUrl?: string,
  ) {
    this.stateMachine = stateMachine;
    this.overlay = overlay;
    this.contextLines = contextLines;
    this.apiBaseUrl = apiBaseUrl;
    this.trackMousePosition();
  }

  /**
   * Initialize targeting handlers
   */
  init(keybindHandler?: {
    getMousePosition(): { x: number; y: number };
  }): void {
    this.stateMachine.onEnter("targeting", () => {
      const mousePos = keybindHandler?.getMousePosition() ?? { x: 0, y: 0 };
      this.enable(mousePos.x, mousePos.y);
    });
    this.stateMachine.onEnter("idle", () => this.disable());
  }

  private trackMousePosition = (e?: MouseEvent): void => {
    if (e) {
      this.currentMouseX = e.clientX;
      this.currentMouseY = e.clientY;
    }
  };

  /**
   * Enable targeting mode with optional initial cursor position
   */
  private enable(cursorX?: number, cursorY?: number): void {
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mousemove", this.trackMousePosition);
    document.addEventListener("click", this.handleClick, true);

    if (cursorX !== undefined && cursorY !== undefined) {
      this.currentMouseX = cursorX;
      this.currentMouseY = cursorY;
    }

    this.detectCurrentTarget();
  }

  /**
   * Disable targeting mode
   */
  private disable(): void {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mousemove", this.trackMousePosition);
    document.removeEventListener("click", this.handleClick, true);
    this.currentTarget = null;
    this.overlay.clearHighlight();
  }

  private detectCurrentTarget(): void {
    const element = document.elementFromPoint(
      this.currentMouseX,
      this.currentMouseY,
    );
    const target = element instanceof HTMLElement ? element : null;

    if (!target) {
      this.overlay.clearHighlight();
      this.overlay.updateCrosshair(
        this.currentMouseX,
        this.currentMouseY,
        null,
      );
      this.currentTarget = null;
      return;
    }

    const elementWithSource = this.findElementWithSource(target);

    if (elementWithSource) {
      this.currentTarget = elementWithSource;
      const rect = elementWithSource.getBoundingClientRect();
      const sourceInfo = elementWithSource.getAttribute("data-astro-grab");
      this.overlay.highlightElement(rect, sourceInfo);
      this.overlay.updateCrosshair(
        this.currentMouseX,
        this.currentMouseY,
        rect,
      );
    } else {
      this.overlay.clearHighlight();
      this.overlay.updateCrosshair(
        this.currentMouseX,
        this.currentMouseY,
        null,
      );
      this.currentTarget = null;
    }
  }

  /**
   * Get current mouse position (for external access)
   */
  getMousePosition(): { x: number; y: number } {
    return { x: this.currentMouseX, y: this.currentMouseY };
  }

  /**
   * Get current target element (for external access)
   */
  getCurrentTarget(): HTMLElement | null {
    return this.currentTarget;
  }

  private handleMouseMove = (e: MouseEvent): void => {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const target = element instanceof HTMLElement ? element : null;

    if (!target) {
      this.overlay.clearHighlight();
      this.overlay.updateCrosshair(e.clientX, e.clientY, null);
      this.currentTarget = null;
      return;
    }

    const elementWithSource = this.findElementWithSource(target);

    if (elementWithSource) {
      this.currentTarget = elementWithSource;
      const rect = elementWithSource.getBoundingClientRect();
      const sourceInfo = elementWithSource.getAttribute("data-astro-grab");
      this.overlay.highlightElement(rect, sourceInfo);
      this.overlay.updateCrosshair(e.clientX, e.clientY, rect);
    } else {
      this.overlay.clearHighlight();
      this.overlay.updateCrosshair(e.clientX, e.clientY, null);
      this.currentTarget = null;
    }
  };

  private handleClick = async (e: MouseEvent): Promise<void> => {
    if (this.stateMachine.getState() !== "targeting") {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (this.currentTarget) {
      const src = this.currentTarget.getAttribute("data-astro-grab");
      if (src) {
        await this.fetchAndCopySnippet(src);
      }
    }

    this.stateMachine.reset();
  };

  private async fetchAndCopySnippet(src: string): Promise<void> {
    const primaryEndpoint = this.apiBaseUrl
      ? `${this.apiBaseUrl}/snippet`
      : "/__astro_grab/snippet";
    const fallbackEndpoint = "/__astro_grab/snippet";

    const tryEndpoint = async (endpoint: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `${endpoint}?src=${encodeURIComponent(src)}&contextLines=${this.contextLines}`,
        );

        if (!response.ok) {
          console.error(
            `[astro-grab] Failed to fetch snippet from ${endpoint}:`,
            response.statusText,
          );
          return false;
        }

        const data: SnippetResponse = await response.json();
        const formatted = formatSnippet(data);
        await copyToClipboard(formatted);

        console.log(
          `[astro-grab] Copied snippet from ${data.file}:${data.targetLine}`,
        );
        this.overlay.showToast("Copied!", 1000);

        window.dispatchEvent(new CustomEvent("astro-grab:component-targeted"));
        return true;
      } catch (error) {
        console.error(
          `[astro-grab] Error fetching snippet from ${endpoint}:`,
          error,
        );
        return false;
      }
    };

    // Try primary endpoint first
    const primarySuccess = await tryEndpoint(primaryEndpoint);
    if (primarySuccess) {
      return;
    }

    // If primary failed and we have a custom apiBaseUrl, try fallback
    if (this.apiBaseUrl && primaryEndpoint !== fallbackEndpoint) {
      console.log("[astro-grab] Primary endpoint failed, trying fallback...");
      const fallbackSuccess = await tryEndpoint(fallbackEndpoint);
      if (fallbackSuccess) {
        return;
      }
    }

    // Both endpoints failed
    this.overlay.showToast("Error copying snippet", 2000);
  }

  private findElementWithSource(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      if (current.hasAttribute("data-astro-grab")) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  updateContextLines(newContextLines: number): void {
    this.contextLines = newContextLines;
  }
}
