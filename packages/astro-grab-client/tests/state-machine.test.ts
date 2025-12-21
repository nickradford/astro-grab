import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateMachine } from '../src/state-machine.js';

describe('StateMachine', () => {
  let stateMachine: StateMachine;

  beforeEach(() => {
    stateMachine = new StateMachine();
  });

  it('should start in idle state', () => {
    expect(stateMachine.getState()).toBe('idle');
  });

  it('should transition to new states', () => {
    stateMachine.transition('holding');
    expect(stateMachine.getState()).toBe('holding');

    stateMachine.transition('targeting');
    expect(stateMachine.getState()).toBe('targeting');
  });

  it('should not trigger transition if already in that state', () => {
    const callback = vi.fn();
    stateMachine.onEnter('idle', callback);

    stateMachine.transition('idle');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should notify listeners when entering a state', () => {
    const callback = vi.fn();
    stateMachine.onEnter('targeting', callback);

    stateMachine.transition('targeting');

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should support multiple listeners for the same state', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    stateMachine.onEnter('targeting', callback1);
    stateMachine.onEnter('targeting', callback2);

    stateMachine.transition('targeting');

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should allow removing listeners', () => {
    const callback = vi.fn();

    stateMachine.onEnter('targeting', callback);
    stateMachine.offEnter('targeting', callback);

    stateMachine.transition('targeting');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should reset to idle state', () => {
    stateMachine.transition('holding');
    stateMachine.transition('targeting');

    stateMachine.reset();

    expect(stateMachine.getState()).toBe('idle');
  });

  it('should handle state transitions in sequence', () => {
    const idleCallback = vi.fn();
    const holdingCallback = vi.fn();
    const targetingCallback = vi.fn();

    stateMachine.onEnter('idle', idleCallback);
    stateMachine.onEnter('holding', holdingCallback);
    stateMachine.onEnter('targeting', targetingCallback);

    stateMachine.transition('holding');
    expect(holdingCallback).toHaveBeenCalledTimes(1);

    stateMachine.transition('targeting');
    expect(targetingCallback).toHaveBeenCalledTimes(1);

    stateMachine.reset();
    expect(idleCallback).toHaveBeenCalledTimes(1);
  });
});
