import { describe, expect, it, vi } from "vitest";
import {
  animateFrameWindowScroll,
  frameElementScrollTop,
  scrollFrameToElement,
} from "./frameScroll";

describe("frame scrolling", () => {
  it("applies top context and positive or negative offsets", () => {
    const frameWindow = { scrollY: 100 };
    const target = {
      getBoundingClientRect: () => ({ top: 300 }),
    };

    expect(frameElementScrollTop(frameWindow, target, 48)).toBe(424);
    expect(frameElementScrollTop(frameWindow, target, -72)).toBe(304);
  });

  it("finishes immediately when already aligned", async () => {
    const scrollTo = vi.fn();
    const frameWindow = {
      scrollY: 100,
      scrollTo,
      cancelAnimationFrame: vi.fn(),
      performance: { now: () => 0 },
    };
    const scroll = animateFrameWindowScroll(frameWindow, 100);

    await expect(scroll.finished).resolves.toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 100 });
  });

  it("returns null when a configured target is missing", () => {
    expect(
      scrollFrameToElement(
        {
          contentWindow: {},
          contentDocument: { getElementById: () => null },
        },
        "missing"
      )
    ).toBeNull();
  });
});
