import { StateMachine } from "./state-machine.js";

export class Overlay {
  private container: HTMLDivElement | null = null;
  private highlightBox: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private toast: HTMLDivElement | null = null;
  private crosshair: HTMLDivElement | null = null;
  private readonly stateMachine: StateMachine;
  private hue: number;

  constructor(stateMachine: StateMachine, hue: number) {
    this.stateMachine = stateMachine;
    this.hue = hue;
  }

  init(): void {
    this.createElements();

    this.stateMachine.onEnter("targeting", () => this.show());
    this.stateMachine.onEnter("idle", () => this.hide());
  }

  private createElements(): void {
    this.container = document.createElement("div");
    this.container.id = "astro-grab-overlay";
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

    this.highlightBox = document.createElement("div");
    this.highlightBox.style.cssText = `
      position: absolute;
      border: 2px solid hsla(${this.hue}, 90%, 50%, 1);
      background: hsla(${this.hue}, 90%, 50%, 0.1);
      pointer-events: none;
      transition: all 0.1s ease;
      display: none;
    `;

    this.tooltip = document.createElement("div");
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

    this.toast = document.createElement("div");
    this.toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: hsla(${this.hue}, 80%, 45%, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      display: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 999999;
    `;

    this.crosshair = document.createElement("div");
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

    const lineTop = document.createElement("div");
    lineTop.className = "crosshair-line-top";
    lineTop.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 1px;
      height: 0;
      background: hsla(${this.hue}, 90%, 50%, 1);
    `;

    const lineBottom = document.createElement("div");
    lineBottom.className = "crosshair-line-bottom";
    lineBottom.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 1px;
      height: 0;
      background: hsla(${this.hue}, 90%, 50%, 1);
    `;

    const lineLeft = document.createElement("div");
    lineLeft.className = "crosshair-line-left";
    lineLeft.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 1px;
      background: hsla(${this.hue}, 90%, 50%, 1);
    `;

    const lineRight = document.createElement("div");
    lineRight.className = "crosshair-line-right";
    lineRight.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 1px;
      background: hsla(${this.hue}, 90%, 50%, 1);
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

  show(): void {
    if (this.container) {
      this.container.style.display = "block";
    }
    if (this.crosshair) {
      this.crosshair.style.display = "block";
    }
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = "none";
    }
    if (this.highlightBox) {
      this.highlightBox.style.display = "none";
    }
    if (this.tooltip) {
      this.tooltip.style.display = "none";
    }
    if (this.crosshair) {
      this.crosshair.style.display = "none";
    }
  }

  highlightElement(rect: DOMRect, sourceInfo: string | null): void {
    if (!this.highlightBox || !this.tooltip) {
      return;
    }

    // Update highlight box
    this.highlightBox.style.display = "block";
    this.highlightBox.style.top = `${rect.top}px`;
    this.highlightBox.style.left = `${rect.left}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;

    this.tooltip.style.display = "block";
    this.tooltip.textContent = sourceInfo || "No source info";

    const tooltipTop = rect.top - 34;
    const tooltipLeft = rect.left;

    this.tooltip.style.top = `${Math.max(10, tooltipTop)}px`;
    this.tooltip.style.left = `${tooltipLeft}px`;
  }

  clearHighlight(): void {
    if (this.highlightBox) {
      this.highlightBox.style.display = "none";
    }
    if (this.tooltip) {
      this.tooltip.style.display = "none";
    }
  }

  updateCrosshair(
    mouseX: number,
    mouseY: number,
    highlightRect: DOMRect | null,
  ): void {
    if (!this.crosshair) {
      return;
    }

    const lineTop = this.crosshair.querySelector(
      ".crosshair-line-top",
    ) as HTMLElement;
    const lineBottom = this.crosshair.querySelector(
      ".crosshair-line-bottom",
    ) as HTMLElement;
    const lineLeft = this.crosshair.querySelector(
      ".crosshair-line-left",
    ) as HTMLElement;
    const lineRight = this.crosshair.querySelector(
      ".crosshair-line-right",
    ) as HTMLElement;

    if (!lineTop || !lineBottom || !lineLeft || !lineRight) {
      return;
    }

    if (highlightRect) {
      lineTop.style.left = `${mouseX}px`;
      lineTop.style.top = "0";
      lineTop.style.height = `${highlightRect.top}px`;

      lineBottom.style.left = `${mouseX}px`;
      lineBottom.style.top = `${highlightRect.bottom + 2}px`;
      lineBottom.style.height = `${window.innerHeight - highlightRect.bottom - 2}px`;

      lineLeft.style.left = "0";
      lineLeft.style.top = `${mouseY}px`;
      lineLeft.style.width = `${highlightRect.left}px`;

      lineRight.style.left = `${highlightRect.right + 2}px`;
      lineRight.style.top = `${mouseY}px`;
      lineRight.style.width = `${window.innerWidth - highlightRect.right - 2}px`;
    } else {
      lineTop.style.left = `${mouseX}px`;
      lineTop.style.top = "0";
      lineTop.style.height = `${mouseY}px`;

      lineBottom.style.left = `${mouseX}px`;
      lineBottom.style.top = `${mouseY}px`;
      lineBottom.style.height = `${window.innerHeight - mouseY}px`;

      lineLeft.style.left = "0";
      lineLeft.style.top = `${mouseY}px`;
      lineLeft.style.width = `${mouseX}px`;

      lineRight.style.left = `${mouseX}px`;
      lineRight.style.top = `${mouseY}px`;
      lineRight.style.width = `${window.innerWidth - mouseX}px`;
    }
  }

  showToast(message: string, duration: number = 1000): void {
    if (!this.toast) {
      return;
    }

    this.toast.textContent = message;
    this.toast.style.display = "block";

    setTimeout(() => {
      if (this.toast) {
        this.toast.style.display = "none";
      }
    }, duration);
  }

  updateHue(newHue: number): void {
    this.hue = newHue;

    if (this.highlightBox) {
      this.highlightBox.style.borderColor = `hsla(${newHue}, 90%, 50%, 1)`;
      this.highlightBox.style.backgroundColor = `hsla(${newHue}, 90%, 50%, 0.1)`;
    }

    if (this.toast) {
      this.toast.style.backgroundColor = `hsla(${newHue}, 80%, 45%, 0.95)`;
    }

    if (this.crosshair) {
      const lineTop = this.crosshair.querySelector(
        ".crosshair-line-top",
      ) as HTMLElement;
      const lineBottom = this.crosshair.querySelector(
        ".crosshair-line-bottom",
      ) as HTMLElement;
      const lineLeft = this.crosshair.querySelector(
        ".crosshair-line-left",
      ) as HTMLElement;
      const lineRight = this.crosshair.querySelector(
        ".crosshair-line-right",
      ) as HTMLElement;

      if (lineTop) {
        lineTop.style.backgroundColor = `hsla(${newHue}, 90%, 50%, 1)`;
      }
      if (lineBottom) {
        lineBottom.style.backgroundColor = `hsla(${newHue}, 90%, 50%, 1)`;
      }
      if (lineLeft) {
        lineLeft.style.backgroundColor = `hsla(${newHue}, 90%, 50%, 1)`;
      }
      if (lineRight) {
        lineRight.style.backgroundColor = `hsla(${newHue}, 90%, 50%, 1)`;
      }
    }
  }

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
