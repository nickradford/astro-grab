import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Window } from "happy-dom";
import { StateMachine } from "../../src/client/state-machine.js";
import { KeybindHandler } from "../../src/client/keybind.js";

describe("KeybindHandler", () => {
  let window: Window;
  let document: Document;
  let stateMachine: StateMachine;
  let keybindHandler: KeybindHandler;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    Object.assign(global, { document, window });

    stateMachine = new StateMachine();
    keybindHandler = new KeybindHandler(stateMachine, 100); // Use short duration for tests
    keybindHandler.init();
  });

  afterEach(() => {
    keybindHandler.destroy();
  });

  it("should transition to holding on Cmd+G", () => {
    const event = new window.KeyboardEvent("keydown", {
      key: "g",
      metaKey: true,
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe("holding");
  });

  it("should transition to holding on Ctrl+G", () => {
    const event = new window.KeyboardEvent("keydown", {
      key: "G",
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe("holding");
  });

  it("should transition to targeting after hold duration", async () => {
    const event = new window.KeyboardEvent("keydown", {
      key: "g",
      metaKey: true,
    });

    document.dispatchEvent(event);
    expect(stateMachine.getState()).toBe("holding");

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(stateMachine.getState()).toBe("targeting");
  });

  it("should reset to idle if key released before hold duration", async () => {
    const keydown = new window.KeyboardEvent("keydown", {
      key: "g",
      metaKey: true,
    });
    document.dispatchEvent(keydown);

    expect(stateMachine.getState()).toBe("holding");

    await new Promise((resolve) => setTimeout(resolve, 50));

    const keyup = new window.KeyboardEvent("keyup", {
      key: "g",
    });
    document.dispatchEvent(keyup);

    expect(stateMachine.getState()).toBe("idle");
  });

  it("should stay in targeting after hold duration even if key released", async () => {
    const keydown = new window.KeyboardEvent("keydown", {
      key: "g",
      metaKey: true,
    });
    document.dispatchEvent(keydown);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(stateMachine.getState()).toBe("targeting");

    const keyup = new window.KeyboardEvent("keyup", {
      key: "g",
    });
    document.dispatchEvent(keyup);

    expect(stateMachine.getState()).toBe("targeting");
  });

  it("should exit targeting on Escape", async () => {
    // Enter targeting mode
    const keydown = new window.KeyboardEvent("keydown", {
      key: "g",
      metaKey: true,
    });
    document.dispatchEvent(keydown);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(stateMachine.getState()).toBe("targeting");

    const escape = new window.KeyboardEvent("keydown", {
      key: "Escape",
    });
    document.dispatchEvent(escape);

    expect(stateMachine.getState()).toBe("idle");
  });

  it("should not respond to other keys", () => {
    const event = new window.KeyboardEvent("keydown", {
      key: "a",
      metaKey: true,
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe("idle");
  });

  it("should not respond to G without modifier", () => {
    const event = new window.KeyboardEvent("keydown", {
      key: "g",
    });

    document.dispatchEvent(event);

    expect(stateMachine.getState()).toBe("idle");
  });

  describe("repeated activation", () => {
    it("should always call preventDefault on Cmd+G even during key repeat", async () => {
      // First activation
      const keydown1 = new window.KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
      });
      document.dispatchEvent(keydown1);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(stateMachine.getState()).toBe("targeting");

      stateMachine.reset();
      expect(stateMachine.getState()).toBe("idle");

      const keydown2 = new window.KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
        repeat: true,
      });

      let preventDefaultCalled = false;
      keydown2.preventDefault = () => {
        preventDefaultCalled = true;
      };

      document.dispatchEvent(keydown2);

      expect(preventDefaultCalled).toBe(true);
    });

    it("should re-enter targeting when pressing G again after state reset", async () => {
      // First activation - complete the full flow
      const keydown1 = new window.KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
      });
      document.dispatchEvent(keydown1);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(stateMachine.getState()).toBe("targeting");

      stateMachine.reset();
      expect(stateMachine.getState()).toBe("idle");

      const keyup = new window.KeyboardEvent("keyup", { key: "g" });
      document.dispatchEvent(keyup);

      const keydown2 = new window.KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
        repeat: false,
      });
      document.dispatchEvent(keydown2);

      expect(stateMachine.getState()).toBe("targeting");
    });

    it("should ignore repeat keydown events without entering new state", async () => {
      const keydown = new window.KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
      });
      document.dispatchEvent(keydown);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(stateMachine.getState()).toBe("targeting");

      stateMachine.reset();

      const repeatEvent = new window.KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
        repeat: true,
      });
      document.dispatchEvent(repeatEvent);

      expect(stateMachine.getState()).toBe("idle");
    });
  });
});
