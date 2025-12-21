import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Window } from 'happy-dom';
import { StateMachine } from '../src/state-machine.js';
import { KeybindHandler } from '../src/keybind.js';

describe('KeybindHandler', () => {
  let window: Window;
  let document: Document;
  let stateMachine: StateMachine;
  let keybindHandler: KeybindHandler;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    global.document = document as any;
    global.window = window as any;

    stateMachine = new StateMachine();
    keybindHandler = new KeybindHandler(stateMachine, 100); // Use short duration for tests
    keybindHandler.init();
  });

  afterEach(() => {
    keybindHandler.destroy();
  });

  it('should transition to holding on Cmd+G', () => {
    const event = new window.KeyboardEvent('keydown', {
      key: 'g',
      metaKey: true,
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe('holding');
  });

  it('should transition to holding on Ctrl+G', () => {
    const event = new window.KeyboardEvent('keydown', {
      key: 'G', // Test uppercase
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe('holding');
  });

  it('should transition to targeting after hold duration', async () => {
    const event = new window.KeyboardEvent('keydown', {
      key: 'g',
      metaKey: true,
    });

    document.dispatchEvent(event);
    expect(stateMachine.getState()).toBe('holding');

    // Wait for hold duration
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(stateMachine.getState()).toBe('targeting');
  });

  it('should reset to idle if key released before hold duration', async () => {
    const keydown = new window.KeyboardEvent('keydown', {
      key: 'g',
      metaKey: true,
    });
    document.dispatchEvent(keydown);

    expect(stateMachine.getState()).toBe('holding');

    // Release before hold duration completes
    await new Promise((resolve) => setTimeout(resolve, 50));

    const keyup = new window.KeyboardEvent('keyup', {
      key: 'g',
    });
    document.dispatchEvent(keyup);

    expect(stateMachine.getState()).toBe('idle');
  });

  it('should stay in targeting after hold duration even if key released', async () => {
    const keydown = new window.KeyboardEvent('keydown', {
      key: 'g',
      metaKey: true,
    });
    document.dispatchEvent(keydown);

    // Wait for hold duration
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(stateMachine.getState()).toBe('targeting');

    // Release key
    const keyup = new window.KeyboardEvent('keyup', {
      key: 'g',
    });
    document.dispatchEvent(keyup);

    // Should still be targeting
    expect(stateMachine.getState()).toBe('targeting');
  });

  it('should exit targeting on Escape', async () => {
    // Enter targeting mode
    const keydown = new window.KeyboardEvent('keydown', {
      key: 'g',
      metaKey: true,
    });
    document.dispatchEvent(keydown);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(stateMachine.getState()).toBe('targeting');

    // Press Escape
    const escape = new window.KeyboardEvent('keydown', {
      key: 'Escape',
    });
    document.dispatchEvent(escape);

    expect(stateMachine.getState()).toBe('idle');
  });

  it('should not respond to other keys', () => {
    const event = new window.KeyboardEvent('keydown', {
      key: 'a',
      metaKey: true,
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe('idle');
  });

  it('should not respond to G without modifier', () => {
    const event = new window.KeyboardEvent('keydown', {
      key: 'g',
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe('idle');
  });
});
