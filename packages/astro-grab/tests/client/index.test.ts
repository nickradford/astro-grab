import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { AstroGrab } from "../../src/client/index.js";

describe("AstroGrab", () => {
  let window: Window;
  let document: Document;
  let target: HTMLElement;
  let instance: AstroGrab | undefined;

  beforeEach(() => {
    window = new Window({ url: "http://localhost" });
    document = window.document;
    target = document.createElement("a");
    target.setAttribute("data-astro-grab", "src/pages/index.astro:1:1");
    document.body.appendChild(target);
    document.elementFromPoint = () => target;

    Object.assign(global, {
      window,
      document,
      HTMLElement: window.HTMLElement,
      CustomEvent: window.CustomEvent,
    });
  });

  afterEach(() => {
    instance?.destroy();
    window.close();
  });

  it("should keep persisted disabled clients inactive", async () => {
    let targetingStarts = 0;
    window.addEventListener("astro-grab:targeting-mode-started", () => {
      targetingStarts++;
    });
    instance = new AstroGrab({ enabled: false, holdDuration: 1 });

    instance.init();
    dispatchTriggerKey();
    await waitForTargeting();

    expect(targetingStarts).toBe(0);
    expect(document.querySelector("#astro-grab-overlay")).toBeNull();
  });

  it("should activate a client that started disabled", async () => {
    let targetingStarts = 0;
    window.addEventListener("astro-grab:targeting-mode-started", () => {
      targetingStarts++;
    });
    instance = new AstroGrab({ enabled: false, holdDuration: 1 });
    instance.init();

    dispatchToggle(true);
    dispatchTriggerKey();
    await waitForTargeting();

    expect(targetingStarts).toBe(1);
    expect(document.querySelector("#astro-grab-overlay")).not.toBeNull();
  });

  it("should stop intercepting clicks when disabled during targeting", async () => {
    instance = new AstroGrab({ holdDuration: 1 });
    instance.init();
    dispatchTriggerKey();
    await waitForTargeting();

    dispatchToggle(false);
    const clickEvent = new window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
    expect(document.querySelector("#astro-grab-overlay")).toBeNull();
  });

  it("should initialize idempotently", () => {
    instance = new AstroGrab();

    instance.init();
    instance.init();

    expect(document.querySelectorAll("#astro-grab-overlay")).toHaveLength(1);
  });

  const dispatchTriggerKey = (): void => {
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
      }),
    );
  };

  const dispatchToggle = (enabled: boolean): void => {
    window.dispatchEvent(
      new window.CustomEvent("astro-grab:toggle", {
        detail: { enabled },
      }),
    );
  };

  const waitForTargeting = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  };
});
