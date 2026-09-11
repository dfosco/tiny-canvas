/**
 * @vitest-environment jsdom
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Canvas from "./Canvas.jsx";
import Frame from "./Frame.jsx";
import { domToBlob } from "modern-screenshot";

vi.mock("modern-screenshot", () => ({
  domToBlob: vi.fn(),
}));

function setPageManifest(widgets = {}) {
  const script = document.createElement("script");
  script.id = "tiny-canvas-pages";
  script.type = "application/json";
  script.textContent = JSON.stringify({
    pages: [],
    widgets,
    environment: "prod",
  });
  document.head.append(script);
}

describe("Frame load strategies", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: vi.fn().mockResolvedValue(undefined),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    window.ClipboardItem = class ClipboardItem {
      constructor(data) {
        this.data = data;
      }
    };
  });

  afterEach(() => {
    cleanup();
    document.getElementById("tiny-canvas-pages")?.remove();
    window.history.replaceState({}, "", "/");
  });

  it("keeps existing Frames eager by default", () => {
    const { container } = render(
      <Canvas>
        <Frame route="/settings" title="Settings" />
      </Canvas>
    );

    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      "/settings?embedView=1"
    );
    expect(
      screen.queryByRole("button", { name: /Click to interact with/ })
    ).toBeNull();
  });

  it("requires a snapshot for explicit interaction loading", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(
        <Canvas>
          <Frame
            route="/settings"
            title="Settings"
            loadStrategy="interaction"
          />
        </Canvas>
      )
    ).toThrow(
      'Frame loadStrategy="interaction" requires a non-empty snapshot.'
    );
  });

  it("does not create an iframe until a snapshot gate is activated", async () => {
    const { container } = render(
      <Canvas>
        <Frame
          id="settings"
          route="/settings"
          title="Settings"
          snapshot="/settings.png"
        />
      </Canvas>
    );
    const button = screen.getByRole("button", {
      name: "Click to interact with Settings",
    });
    const guard = container.querySelector(".tc-frame-interaction-guard");

    expect(container.querySelector("iframe")).toBeNull();
    expect(
      container.querySelector(".tc-frame-snapshot").getAttribute("src")
    ).toBe("/settings.png");

    fireEvent.pointerDown(button);
    fireEvent.click(guard);

    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("/settings?embedView=1");
    expect(
      screen
        .getByRole("button", { name: "Loading Settings" })
        .hasAttribute("disabled")
    ).toBe(true);

    fireEvent.load(iframe);
    expect(container.querySelector(".tc-frame-poster")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Click to interact with Settings" })
    ).toBeNull();

    iframe.contentDocument.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape" })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Click to interact with Settings",
        })
      ).toBe(document.activeElement)
    );
    expect(container.querySelector("iframe")).toBe(iframe);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Click to interact with Settings",
      })
    );
    fireEvent.pointerDown(container.querySelector(".tc-canvas"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Click to interact with Settings",
        })
      ).toBeTruthy()
    );
    expect(container.querySelector("iframe")).toBe(iframe);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Click to interact with Settings",
      })
    );
    expect(container.querySelector("iframe")).toBe(iframe);
  });

  it("uses a native dark picture source when provided", () => {
    const { container } = render(
      <Canvas>
        <Frame
          route="/settings"
          title="Settings"
          snapshot="/settings.png"
          snapshotDark="/settings-dark.png"
        />
      </Canvas>
    );

    expect(
      container
        .querySelector('source[media="(prefers-color-scheme: dark)"]')
        ?.getAttribute("srcset")
    ).toBe("/settings-dark.png");
    expect(container.querySelector("picture img")?.getAttribute("src")).toBe(
      "/settings.png"
    );
  });

  it("keeps all snapshot-gated Frames dormant during startup", () => {
    const { container } = render(
      <Canvas>
        {Array.from({ length: 12 }, (_, index) => (
          <Frame
            key={index}
            route={`/screen-${index}`}
            title={`Screen ${index}`}
            snapshot={`/screen-${index}.png`}
          />
        ))}
      </Canvas>
    );

    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(container.querySelectorAll(".tc-frame-snapshot")).toHaveLength(12);
  });

  it("supports eager widget defaults, instance overrides, and snapshot fallback", () => {
    setPageManifest({
      Frame: {
        loadStrategy: "eager",
      },
    });
    const { container } = render(
      <Canvas>
        <Frame route="/eager" title="Eager" snapshot="/eager.png" />
        <Frame
          route="/gated"
          title="Gated"
          snapshot="/gated.png"
          loadStrategy="interaction"
        />
      </Canvas>
    );

    expect(container.querySelector('iframe[title="Eager"]')).toBeTruthy();
    expect(container.querySelector('iframe[title="Gated"]')).toBeNull();

    fireEvent.error(container.querySelector('img[src="/gated.png"]'));
    expect(screen.getByText("Preview unavailable")).toBeTruthy();
    expect(container.querySelector('iframe[title="Gated"]')).toBeNull();
  });

  it("copies the visible thumbnail while a snapshot-backed Frame is dormant", async () => {
    const blob = new Blob(["thumbnail"], { type: "image/png" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => blob })
    );

    render(
      <Canvas>
        <Frame
          route="/settings"
          title="Settings"
          snapshot="/settings.png"
        />
      </Canvas>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Capture Settings frame" })
    );

    await waitFor(() =>
      expect(navigator.clipboard.write).toHaveBeenCalledOnce()
    );
    expect(screen.getByRole("status").textContent).toBe("screenshot copied");
    expect(fetch).toHaveBeenCalledWith("/settings.png");
    expect(domToBlob).not.toHaveBeenCalled();
  });

  it("copies a board link that focuses the current Frame", async () => {
    window.history.replaceState({}, "", "/board");
    render(
      <Canvas>
        <Frame id="settings" route="/settings" title="Settings" />
      </Canvas>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Copy link to Settings" })
    );

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledOnce()
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "http://localhost:3000/board#/?tcFrame=settings"
    );
  });

  it("focuses a Frame addressed by a copied board link", async () => {
    window.history.replaceState({}, "", "/board#/canvas?tcFrame=settings");
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    render(
      <Canvas>
        <Frame id="settings" route="/settings" title="Settings" />
      </Canvas>
    );

    await waitFor(() =>
      expect(document.getElementById("settings")).toBe(document.activeElement)
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
      inline: "center",
    });
  });

  it("captures the iframe viewport without using browser screen capture", async () => {
    const blob = new Blob(["frame"], { type: "image/png" });
    domToBlob.mockResolvedValue(blob);
    const { container } = render(
      <Canvas>
        <Frame route="/settings" title="Settings" />
      </Canvas>
    );
    const iframe = container.querySelector("iframe");
    Object.defineProperties(iframe, {
      clientWidth: { configurable: true, value: 640 },
      clientHeight: { configurable: true, value: 360 },
    });
    fireEvent.load(iframe);

    fireEvent.click(
      screen.getByRole("button", { name: "Capture Settings frame" })
    );

    await waitFor(() => expect(domToBlob).toHaveBeenCalledOnce());
    expect(domToBlob).toHaveBeenCalledWith(
      iframe.contentDocument.documentElement,
      expect.objectContaining({
        width: 640,
        height: 360,
        features: { restoreScrollPosition: true },
      })
    );
    expect(navigator.clipboard.write).toHaveBeenCalledOnce();
    expect(navigator.mediaDevices?.getDisplayMedia).toBeUndefined();
  });

  it("scrolls a loaded Frame to its configured element and offset", async () => {
    const { container } = render(
      <Canvas>
        <Frame
          route="/settings"
          title="Settings"
          element="advanced-settings"
          offset={24}
        />
      </Canvas>
    );
    const iframe = container.querySelector("iframe");
    iframe.contentDocument.open();
    iframe.contentDocument.write("<!doctype html><html><body></body></html>");
    iframe.contentDocument.close();
    const target = iframe.contentDocument.createElement("div");
    target.id = "advanced-settings";
    target.getBoundingClientRect = () => ({ top: 300 });
    iframe.contentDocument.body.append(target);
    Object.defineProperty(iframe.contentWindow, "scrollY", {
      configurable: true,
      value: 100,
    });
    iframe.contentWindow.scrollTo = vi.fn();
    iframe.contentWindow.requestAnimationFrame = (callback) => {
      callback(iframe.contentWindow.performance.now() + 1000);
      return 1;
    };

    fireEvent.load(iframe);

    expect(iframe.contentWindow.scrollTo).toHaveBeenLastCalledWith({
      top: 400,
    });
  });
});
