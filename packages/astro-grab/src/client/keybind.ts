import { StateMachine } from "./state-machine.js";
import {
  DEFAULT_TRIGGER_KEY,
  normalizeTriggerKey,
  parseTriggerKey,
} from "../shared/shortcut.js";

export class KeybindHandler {
  private holdTimer: number | null = null;
  private holdDuration: number;
  private triggerKey: string;
  private readonly stateMachine: StateMachine;
  private hasActivatedOnce = false;
  private currentMouseX = 0;
  private currentMouseY = 0;

  constructor(
    stateMachine: StateMachine,
    holdDuration: number = 1000,
    triggerKey: string = DEFAULT_TRIGGER_KEY,
  ) {
    this.stateMachine = stateMachine;
    this.holdDuration = holdDuration;
    this.triggerKey = normalizeTriggerKey(triggerKey);
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
    const pressedKey = parseTriggerKey(e.key);
    const isTriggerKey =
      pressedKey === this.triggerKey && (e.metaKey || e.ctrlKey);

    if (!isTriggerKey) {
      return;
    }

    e.preventDefault();

    if (e.repeat) {
      return;
    }

    const currentState = this.stateMachine.getState();
    if (currentState !== "idle") {
      return;
    }

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
    const pressedKey = parseTriggerKey(e.key);
    if (
      pressedKey === this.triggerKey ||
      e.key === "Meta" ||
      e.key === "Control"
    ) {
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

  updateKey(newKey: string): void {
    this.triggerKey = normalizeTriggerKey(newKey);
  }
}
