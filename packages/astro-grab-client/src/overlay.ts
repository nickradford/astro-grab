import { StateMachine } from './state-machine.js';

/**
 * Visual overlay for targeting mode
 * Shows highlight around hovered element, tooltip with source info, and toast notifications
 */
export class Overlay {
  private container: HTMLDivElement | null = null;
  private highlightBox: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private toast: HTMLDivElement | null = null;
  private crosshair: HTMLDivElement | null = null;
  private readonly stateMachine: StateMachine;

  constructor(stateMachine: StateMachine) {
    this.stateMachine = stateMachine;
  }

  /**
   * Initialize overlay and state listeners
   */
  init(): void {
    this.createElements();

    this.stateMachine.onEnter('targeting', () => this.show());
    this.stateMachine.onEnter('idle', () => this.hide());
  }

  /**
   * Create overlay DOM elements
   */
  private createElements(): void {
    // Container
    this.container = document.createElement('div');
    this.container.id = 'astro-grab-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;

    // Highlight box
    this.highlightBox = document.createElement('div');
    this.highlightBox.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      border-radius: 4px;
      transition: all 0.1s ease;
      display: none;
    `;

    // Tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      pointer-events: none;
      white-space: nowrap;
      display: none;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    // Toast
    this.toast = document.createElement('div');
    this.toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(34, 197, 94, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      display: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Crosshair - create 4 separate lines that will stop at the highlighted element
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: none;
      z-index: 999998;
    `;

    // Create 4 crosshair lines (top, bottom, left, right)
    const lineTop = document.createElement('div');
    lineTop.className = 'crosshair-line-top';
    lineTop.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 1px;
      height: 0;
      background: #3b82f6;
    `;

    const lineBottom = document.createElement('div');
    lineBottom.className = 'crosshair-line-bottom';
    lineBottom.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 1px;
      height: 0;
      background: #3b82f6;
    `;

    const lineLeft = document.createElement('div');
    lineLeft.className = 'crosshair-line-left';
    lineLeft.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 1px;
      background: #3b82f6;
    `;

    const lineRight = document.createElement('div');
    lineRight.className = 'crosshair-line-right';
    lineRight.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 1px;
      background: #3b82f6;
    `;

    this.crosshair.appendChild(lineTop);
    this.crosshair.appendChild(lineBottom);
    this.crosshair.appendChild(lineLeft);
    this.crosshair.appendChild(lineRight);

    this.container.appendChild(this.highlightBox);
    this.container.appendChild(this.tooltip);
    this.container.appendChild(this.toast);
    this.container.appendChild(this.crosshair);
    document.body.appendChild(this.container);
  }

  /**
   * Show overlay
   */
  show(): void {
    if (this.container) {
      this.container.style.display = 'block';
    }
    if (this.crosshair) {
      this.crosshair.style.display = 'block';
    }
  }

  /**
   * Hide overlay
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
    if (this.highlightBox) {
      this.highlightBox.style.display = 'none';
    }
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
    if (this.crosshair) {
      this.crosshair.style.display = 'none';
    }
  }

  /**
   * Highlight an element at the given rect
   */
  highlightElement(rect: DOMRect, sourceInfo: string | null): void {
    if (!this.highlightBox || !this.tooltip) {
      return;
    }

    // Update highlight box
    this.highlightBox.style.display = 'block';
    this.highlightBox.style.top = `${rect.top}px`;
    this.highlightBox.style.left = `${rect.left}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;

    // Update tooltip
    this.tooltip.style.display = 'block';
    this.tooltip.textContent = sourceInfo || 'No source info';

    // Position tooltip near cursor (above the element)
    const tooltipTop = rect.top - 30;
    const tooltipLeft = rect.left;

    this.tooltip.style.top = `${Math.max(10, tooltipTop)}px`;
    this.tooltip.style.left = `${tooltipLeft}px`;
  }

  /**
   * Hide highlight and tooltip
   */
  clearHighlight(): void {
    if (this.highlightBox) {
      this.highlightBox.style.display = 'none';
    }
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  /**
   * Update crosshair position based on mouse and highlighted element
   */
  updateCrosshair(mouseX: number, mouseY: number, highlightRect: DOMRect | null): void {
    if (!this.crosshair) {
      return;
    }

    const lineTop = this.crosshair.querySelector('.crosshair-line-top') as HTMLDivElement;
    const lineBottom = this.crosshair.querySelector('.crosshair-line-bottom') as HTMLDivElement;
    const lineLeft = this.crosshair.querySelector('.crosshair-line-left') as HTMLDivElement;
    const lineRight = this.crosshair.querySelector('.crosshair-line-right') as HTMLDivElement;

    if (!lineTop || !lineBottom || !lineLeft || !lineRight) {
      return;
    }

    if (highlightRect) {
      // Vertical line (top): from top of viewport to top of highlighted element
      lineTop.style.left = `${mouseX}px`;
      lineTop.style.top = '0';
      lineTop.style.height = `${highlightRect.top}px`;

      // Vertical line (bottom): from bottom of highlighted element to bottom of viewport
      lineBottom.style.left = `${mouseX}px`;
      lineBottom.style.top = `${highlightRect.bottom}px`;
      lineBottom.style.height = `${window.innerHeight - highlightRect.bottom}px`;

      // Horizontal line (left): from left of viewport to left of highlighted element
      lineLeft.style.left = '0';
      lineLeft.style.top = `${mouseY}px`;
      lineLeft.style.width = `${highlightRect.left}px`;

      // Horizontal line (right): from right of highlighted element to right of viewport
      lineRight.style.left = `${highlightRect.right}px`;
      lineRight.style.top = `${mouseY}px`;
      lineRight.style.width = `${window.innerWidth - highlightRect.right}px`;
    } else {
      // No highlight - show full crosshair lines
      lineTop.style.left = `${mouseX}px`;
      lineTop.style.top = '0';
      lineTop.style.height = `${mouseY}px`;

      lineBottom.style.left = `${mouseX}px`;
      lineBottom.style.top = `${mouseY}px`;
      lineBottom.style.height = `${window.innerHeight - mouseY}px`;

      lineLeft.style.left = '0';
      lineLeft.style.top = `${mouseY}px`;
      lineLeft.style.width = `${mouseX}px`;

      lineRight.style.left = `${mouseX}px`;
      lineRight.style.top = `${mouseY}px`;
      lineRight.style.width = `${window.innerWidth - mouseX}px`;
    }
  }

  /**
   * Show a toast notification
   */
  showToast(message: string, duration: number = 1000): void {
    if (!this.toast) {
      return;
    }

    this.toast.textContent = message;
    this.toast.style.display = 'block';

    setTimeout(() => {
      if (this.toast) {
        this.toast.style.display = 'none';
      }
    }, duration);
  }

  /**
   * Clean up overlay
   */
  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.highlightBox = null;
      this.tooltip = null;
      this.toast = null;
      this.crosshair = null;
    }
  }
}
