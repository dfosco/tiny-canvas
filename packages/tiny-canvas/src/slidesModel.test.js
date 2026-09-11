import { describe, expect, it } from "vitest";
import {
  buildSlidesFrameHref,
  nextSlidesState,
  previousSlidesState,
  resolveSlidesState,
  slidesCount,
} from "./slidesModel";

const deck = {
  id: "review",
  conclusion: "Done",
  slides: [
    {
      title: "Overview",
      description: "Start",
      url: "/stateful#view=overview",
      steps: [
        { type: "cursor", targetId: "view-toggle", scrollOffset: -16 },
        { type: "click", url: "/stateful#view=details" },
        { type: "cursor", targetId: "details" },
      ],
    },
    {
      title: "Finish",
      description: "End",
      url: "/stateful#view=done",
    },
  ],
};

describe("Slides state", () => {
  it("replays click steps while preserving cursor ordering", () => {
    expect(resolveSlidesState(deck, 0, 1).url).toBe(
      "/stateful#view=overview"
    );
    expect(resolveSlidesState(deck, 0, 2).url).toBe(
      "/stateful#view=details"
    );
    expect(resolveSlidesState(deck, 0, 3)).toMatchObject({
      url: "/stateful#view=details",
      activeStep: { type: "cursor", targetId: "details" },
    });
  });

  it("advances through steps before changing slides", () => {
    expect(nextSlidesState(deck, 0, undefined, true)).toEqual({
      slideIndex: 0,
      stepIndex: 1,
    });
    expect(nextSlidesState(deck, 0, 3, true)).toEqual({
      slideIndex: 1,
      stepIndex: undefined,
    });
    expect(nextSlidesState(deck, 0, undefined, false)).toEqual({
      slideIndex: 1,
      stepIndex: undefined,
    });
  });

  it("returns to the previous slide base and keeps conclusions in range", () => {
    expect(slidesCount(deck)).toBe(3);
    expect(previousSlidesState(deck, 2)).toEqual({
      slideIndex: 1,
      stepIndex: undefined,
    });
    expect(resolveSlidesState(deck, 2)).toMatchObject({
      conclusion: true,
      contentSlideIndex: 1,
    });
  });

  it("preserves Statefully hash values in iframe URLs", () => {
    const href = buildSlidesFrameHref(
      "/stateful#view=details&showActivity=false",
      "https://example.com/slides/review"
    );
    const url = new URL(href, "https://example.com");

    expect(url.searchParams.get("embedView")).toBe("1");
    expect(url.hash).toBe("#view=details&showActivity=false");
  });
});
