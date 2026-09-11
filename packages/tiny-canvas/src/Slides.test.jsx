/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Slides from "./Slides";

const deck = {
  id: "stateful-review",
  title: "Statefully review",
  conclusion: "Finished.",
  slides: [
    {
      title: "Review",
      description: "Show the exact review state.",
      url: "/stateful#view=overview",
      steps: [
        {
          type: "click",
          url: "/stateful#view=details&showActivity=false",
        },
      ],
    },
  ],
};

describe("Slides", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("applies click steps inside the mounted iframe without replacing it", async () => {
    const { container } = render(<Slides deck={deck} />);
    const iframe = container.querySelector("iframe");
    iframe.contentWindow.scrollTo = () => {};
    fireEvent.load(iframe);

    fireEvent.click(screen.getByRole("button", { name: "Next step" }));

    await waitFor(() =>
      expect(iframe.contentWindow.location.hash).toBe(
        "#view=details&showActivity=false"
      )
    );
    expect(container.querySelector("iframe")).toBe(iframe);
  });

  it("keeps the final iframe mounted beneath the conclusion", () => {
    const { container } = render(
      <Slides deck={{ ...deck, slides: [{ ...deck.slides[0], steps: [] }] }} />
    );
    const iframe = container.querySelector("iframe");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Finished.")).toBeTruthy();
    expect(container.querySelector(".tc-slides-conclusion-scrim")).toBeTruthy();
    expect(container.querySelector("iframe")).toBe(iframe);
  });
});
