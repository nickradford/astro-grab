import { StateMachine } from "./state-machine.js";

export class KeybindHandler {
  private holdTimer: number | null = null;
  private holdDuration: number;
  private readonly stateMachine: StateMachine;
  private isKeyDown = false;
  private hasActivatedOnce = false;
  private currentMouseX = 0;
  private currentMouseY = 0;

  constructor(stateMachine: StateMachine, holdDuration: number = 1000) {
    this.stateMachine = stateMachine;
    this.holdDuration = holdDuration;
  }

  init(): void {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    document.addEventListener("keydown", this.handleEscape);
    document.addEventListener("mousemove", this.trackMousePosition);
  }

  destroy(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("keydown", this.handleEscape);
    document.removeEventListener("mousemove", this.trackMousePosition);
    this.clearTimer();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const isTriggerKey =
      e.key.toLowerCase() === "g" && (e.metaKey || e.ctrlKey);

    if (!isTriggerKey || this.isKeyDown) {
      return;
    }

    e.preventDefault();
    this.isKeyDown = true;

    if (this.hasActivatedOnce) {
      this.stateMachine.transition("targeting");
    } else {
      this.stateMachine.transition("holding");
      this.holdTimer = window.setTimeout(() => {
        this.stateMachine.transition("targeting");
        this.hasActivatedOnce = true;
      }, this.holdDuration);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (
      e.key.toLowerCase() === "g" ||
      e.key === "Meta" ||
      e.key === "Control"
    ) {
      this.isKeyDown = false;
      this.clearTimer();

      if (this.stateMachine.getState() === "holding") {
        // Track early release (didn't hold long enough)
        window.dispatchEvent(new CustomEvent("astro-grab:keypress-too-short"));
        this.stateMachine.reset();
      }
    }
  };

  private handleEscape = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && this.stateMachine.getState() === "targeting") {
      e.preventDefault();
      // Track escape/cancel
      window.dispatchEvent(new CustomEvent("astro-grab:targeting-cancelled"));
      this.stateMachine.reset();
    }
  };

  private clearTimer(): void {
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  private trackMousePosition = (e: MouseEvent): void => {
    this.currentMouseX = e.clientX;
    this.currentMouseY = e.clientY;
  };

  getMousePosition(): { x: number; y: number } {
    return { x: this.currentMouseX, y: this.currentMouseY };
  }

  updateHoldDuration(newDuration: number): void {
    this.holdDuration = newDuration;
  }
}
