import type { ClientState } from "@astro-grab/shared";

export interface StateListener {
  (): void;
}

export class StateMachine {
  private state: ClientState = "idle";
  private listeners: Map<ClientState, Set<StateListener>> = new Map();

  constructor() {
    this.listeners.set("idle", new Set());
    this.listeners.set("holding", new Set());
    this.listeners.set("targeting", new Set());
  }

  getState(): ClientState {
    return this.state;
  }

  transition(newState: ClientState): void {
    if (this.state === newState) {
      return;
    }

    console.log(`[astro-grab] State: ${this.state} → ${newState}`);
    this.state = newState;

    const callbacks = this.listeners.get(newState);
    if (callbacks) {
      callbacks.forEach((cb) => cb());
    }
  }

  onEnter(state: ClientState, callback: StateListener): void {
    const callbacks = this.listeners.get(state);
    if (callbacks) {
      callbacks.add(callback);
    }
  }

  offEnter(state: ClientState, callback: StateListener): void {
    const callbacks = this.listeners.get(state);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  reset(): void {
    this.transition("idle");
  }
}
