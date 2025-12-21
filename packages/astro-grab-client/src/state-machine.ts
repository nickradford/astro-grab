import type { ClientState } from 'astro-grab-shared';

type StateListener = () => void;

/**
 * State machine for managing client-side grab functionality
 * States: idle → holding → targeting → idle
 */
export class StateMachine {
  private state: ClientState = 'idle';
  private listeners: Map<ClientState, Set<StateListener>> = new Map();

  constructor() {
    // Initialize listener sets for each state
    this.listeners.set('idle', new Set());
    this.listeners.set('holding', new Set());
    this.listeners.set('targeting', new Set());
  }

  /**
   * Get the current state
   */
  getState(): ClientState {
    return this.state;
  }

  /**
   * Transition to a new state and notify listeners
   */
  transition(newState: ClientState): void {
    if (this.state === newState) {
      return;
    }

    console.log(`[astro-grab] State: ${this.state} → ${newState}`);
    this.state = newState;

    // Notify listeners for the new state
    const callbacks = this.listeners.get(newState);
    if (callbacks) {
      callbacks.forEach((cb) => cb());
    }
  }

  /**
   * Register a callback for when a state is entered
   */
  onEnter(state: ClientState, callback: StateListener): void {
    const callbacks = this.listeners.get(state);
    if (callbacks) {
      callbacks.add(callback);
    }
  }

  /**
   * Unregister a callback
   */
  offEnter(state: ClientState, callback: StateListener): void {
    const callbacks = this.listeners.get(state);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Reset to idle state
   */
  reset(): void {
    this.transition('idle');
  }
}
