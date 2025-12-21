import { StateMachine } from './state-machine.js';

/**
 * Handles keyboard input for activating grab mode
 * Detects Cmd+G (Mac) or Ctrl+G (Windows/Linux) held for specified duration
 */
export class KeybindHandler {
  private holdTimer: number | null = null;
  private readonly holdDuration: number;
  private readonly stateMachine: StateMachine;
  private isKeyDown = false;

  constructor(stateMachine: StateMachine, holdDuration: number = 1000) {
    this.stateMachine = stateMachine;
    this.holdDuration = holdDuration;
  }

  /**
   * Initialize keyboard listeners
   */
  init(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    // Also listen for Escape to exit targeting mode
    document.addEventListener('keydown', this.handleEscape);
  }

  /**
   * Clean up listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('keydown', this.handleEscape);
    this.clearTimer();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Check for Cmd+G (Mac) or Ctrl+G (Windows/Linux)
    const isTriggerKey = e.key.toLowerCase() === 'g' && (e.metaKey || e.ctrlKey);

    if (!isTriggerKey || this.isKeyDown) {
      return;
    }

    e.preventDefault();
    this.isKeyDown = true;
    this.stateMachine.transition('holding');

    // Start hold timer
    this.holdTimer = window.setTimeout(() => {
      this.stateMachine.transition('targeting');
    }, this.holdDuration);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    // Reset on release of either G, Meta, or Control
    if (
      e.key.toLowerCase() === 'g' ||
      e.key === 'Meta' ||
      e.key === 'Control'
    ) {
      this.isKeyDown = false;
      this.clearTimer();

      // Only reset if we're not already targeting
      // (once targeting starts, we want to stay there until click or Escape)
      if (this.stateMachine.getState() !== 'targeting') {
        this.stateMachine.reset();
      }
    }
  };

  private handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.stateMachine.getState() === 'targeting') {
      e.preventDefault();
      this.stateMachine.reset();
    }
  };

  private clearTimer(): void {
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }
}
