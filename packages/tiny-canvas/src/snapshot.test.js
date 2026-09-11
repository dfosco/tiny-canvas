import { describe, expect, it, vi } from "vitest";
import {
  parseSnapshotFrames,
  rewriteSnapshotProps,
  scrollPageToElement,
} from "./snapshot";

describe("snapshot tooling", () => {
  it("parses static Frame metadata with target offsets", () => {
    const frames = parseSnapshotFrames(`
      const route = "/stateful#view=details";
      const target = "review-list";
      <Frame
        id="review"
        route={route}
        title="Review"
        width={900}
        height={600}
        element={target}
        offset={-48}
      />
    `);

    expect(frames).toEqual([
      expect.objectContaining({
        id: "review",
        route: "/stateful#view=details",
        width: 900,
        height: 600,
        element: "review-list",
        offset: -48,
      }),
    ]);
  });

  it("rejects dynamic routes instead of capturing the wrong screen", () => {
    expect(() =>
      parseSnapshotFrames("<Frame route={step.route} title=\"Review\" />")
    ).toThrow("Frame route must be a static string or local constant");
  });

  it("adds deterministic public snapshot props", () => {
    const source =
      '<Frame id="review" route="/stateful" title="Review" element="target" />';
    const frames = parseSnapshotFrames(source);
    const rewritten = rewriteSnapshotProps(source, frames, {
      outputDirectory: "/repo/demo/public/tiny-canvas/snapshots",
      boardSlug: "review-board",
    });

    expect(rewritten).toContain(
      'snapshot="/tiny-canvas/snapshots/review-board/review.png"'
    );
    expect(rewritten).toContain(
      'snapshotDark="/tiny-canvas/snapshots/review-board/review-dark.png"'
    );
    expect(rewritten).toContain('loadStrategy="interaction"');
    expect(rewritten).toContain('\n  snapshot="/tiny-canvas/');
  });

  it("fails capture when a configured target is absent", async () => {
    const page = { evaluate: vi.fn().mockResolvedValue(false) };
    await expect(
      scrollPageToElement(page, "missing", 12)
    ).rejects.toThrow('Snapshot scroll element "missing" was not found.');
  });
});
