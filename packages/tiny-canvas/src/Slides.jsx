import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MarkdownContent from "./MarkdownContent";
import { scrollFrameToElement } from "./frameScroll";
import {
  buildSlidesDisplayRoute,
  buildSlidesFrameHref,
  buildSlidesOpenHref,
  nextSlidesState,
  previousSlidesState,
  resolveSlidesState,
} from "./slidesModel";

const CLICK_SCROLL_RESTORE_MS = 1000;
const CURSOR_REVEAL_DELAY_MS = 180;

function isEditableTarget(target) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  );
}

function useControllableState(value, defaultValue, onChange) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;
  const setValue = useCallback(
    (nextValue) => {
      if (!controlled) setInternalValue(nextValue);
      onChange?.(nextValue);
    },
    [controlled, onChange]
  );
  return [currentValue, setValue];
}

function dispatchFrameNavigation(frameWindow) {
  frameWindow.dispatchEvent(new HashChangeEvent("hashchange"));
  frameWindow.dispatchEvent(new PopStateEvent("popstate"));
}

export default function Slides({
  deck,
  slideIndex,
  stepIndex,
  defaultSlideIndex = 0,
  defaultStepIndex,
  onSlideChange,
  onStepChange,
  stepsEnabled,
  defaultStepsEnabled = true,
  onStepsEnabledChange,
  className,
  style,
}) {
  const [activeSlideIndex, setActiveSlideIndex] = useControllableState(
    slideIndex,
    defaultSlideIndex,
    onSlideChange
  );
  const [activeStepIndex, setActiveStepIndex] = useControllableState(
    stepIndex,
    defaultStepIndex,
    onStepChange
  );
  const [showSteps, setShowSteps] = useControllableState(
    stepsEnabled,
    defaultStepsEnabled,
    onStepsEnabledChange
  );
  const [frameWindow, setFrameWindow] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const scrollCleanupRef = useRef(null);
  const restoreCleanupRef = useRef(null);
  const cursorTimeoutRef = useRef(null);
  const panelDragRef = useRef(null);

  const state = useMemo(
    () => resolveSlidesState(deck, activeSlideIndex, activeStepIndex),
    [activeSlideIndex, activeStepIndex, deck]
  );
  const frameHref = buildSlidesFrameHref(state.url);
  const baseFrameHref = buildSlidesFrameHref(state.slide.url);
  const openHref = buildSlidesOpenHref(state.url);
  const displayRoute = buildSlidesDisplayRoute(state.slide, state.url);
  const title = deck.title?.trim() || "Slides";
  const conclusionTitle = deck.conclusionTitle?.trim() || "Finished";
  const activeTitle = state.conclusion ? conclusionTitle : state.slide.title;
  const first = state.slideIndex === 0;
  const last = state.slideIndex === state.count - 1;
  const pendingStep =
    showSteps && (state.stepIndex ?? 0) < state.steps.length;

  const clearFrameWork = useCallback(() => {
    scrollCleanupRef.current?.();
    scrollCleanupRef.current = null;
    restoreCleanupRef.current?.();
    restoreCleanupRef.current = null;
    if (cursorTimeoutRef.current) {
      window.clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = null;
    }
    setCursorPosition(null);
  }, []);

  const setSlide = useCallback(
    (nextSlideIndex) => {
      clearFrameWork();
      setActiveStepIndex(undefined);
      setActiveSlideIndex(nextSlideIndex);
    },
    [clearFrameWork, setActiveSlideIndex, setActiveStepIndex]
  );

  const goNext = useCallback(() => {
    const next = nextSlidesState(
      deck,
      state.slideIndex,
      state.stepIndex,
      showSteps
    );
    if (next.slideIndex !== state.slideIndex) {
      setSlide(next.slideIndex);
    } else {
      setActiveStepIndex(next.stepIndex);
    }
  }, [
    deck,
    setActiveStepIndex,
    setSlide,
    showSteps,
    state.slideIndex,
    state.stepIndex,
  ]);

  const goPrevious = useCallback(() => {
    if (first) return;
    const previous = previousSlidesState(deck, state.slideIndex);
    setSlide(previous.slideIndex);
  }, [deck, first, setSlide, state.slideIndex]);

  const skipSteps = useCallback(() => {
    if (!last) setSlide(state.slideIndex + 1);
  }, [last, setSlide, state.slideIndex]);

  useEffect(() => {
    const handleKey = (event) => {
      if (isEditableTarget(event.target) || !event.metaKey || event.altKey) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "k" && event.shiftKey) {
        event.preventDefault();
        skipSteps();
      } else if (key === "k" && !event.shiftKey) {
        event.preventDefault();
        goNext();
      } else if (key === "j" && !event.shiftKey) {
        event.preventDefault();
        goPrevious();
      }
    };
    window.addEventListener("keydown", handleKey);
    frameWindow?.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      frameWindow?.removeEventListener("keydown", handleKey);
    };
  }, [frameWindow, goNext, goPrevious, skipSteps]);

  useEffect(
    () => () => {
      clearFrameWork();
    },
    [clearFrameWork]
  );

  useEffect(() => {
    clearFrameWork();
  }, [clearFrameWork, state.slideIndex, state.stepIndex]);

  useEffect(() => {
    if (
      state.conclusion ||
      !frameWindow ||
      frameRef.current?.contentWindow !== frameWindow ||
      frameWindow.location.href === new URL(frameHref, window.location.href).href
    ) {
      return;
    }

    const nextUrl = new URL(frameHref, window.location.href);
    if (frameWindow.location.origin !== nextUrl.origin) {
      frameWindow.location.replace(frameHref);
      return;
    }

    const scrollPosition = {
      left: frameWindow.scrollX,
      top: frameWindow.scrollY,
    };
    frameWindow.history.replaceState(null, "", frameHref);
    dispatchFrameNavigation(frameWindow);

    let requestId = 0;
    const restoreUntil =
      frameWindow.performance.now() + CLICK_SCROLL_RESTORE_MS;
    const restore = (currentTime) => {
      frameWindow.scrollTo(scrollPosition);
      if (currentTime < restoreUntil) {
        requestId = frameWindow.requestAnimationFrame(restore);
      }
    };
    frameWindow.scrollTo(scrollPosition);
    requestId = frameWindow.requestAnimationFrame(restore);
    restoreCleanupRef.current = () =>
      frameWindow.cancelAnimationFrame(requestId);
  }, [frameHref, frameWindow, state.conclusion]);

  useEffect(() => {
    if (!showSteps || state.activeStep?.type !== "cursor") return;
    const frame = frameRef.current;
    if (!frame) return;
    const scroll = scrollFrameToElement(frame, state.activeStep.targetId, {
      offset: state.activeStep.scrollOffset ?? 0,
    });
    if (!scroll) {
      console.warn(
        `Unable to scroll Slides frame to element "${state.activeStep.targetId}".`
      );
      return;
    }

    scrollCleanupRef.current = scroll.cancel;
    void scroll.finished.then((completed) => {
      if (!completed) return;
      cursorTimeoutRef.current = window.setTimeout(() => {
        const target = frame.contentDocument?.getElementById(
          state.activeStep.targetId
        );
        if (!target) return;
        const frameRect = frame.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        setCursorPosition({
          x: frameRect.left + Math.max(24, targetRect.left - 24),
          y:
            frameRect.top +
            targetRect.top +
            Math.min(targetRect.height / 2, 24),
        });
      }, CURSOR_REVEAL_DELAY_MS);
    });
  }, [frameWindow, showSteps, state.activeStep]);

  useEffect(() => {
    if (!showSteps && state.stepIndex) setActiveStepIndex(undefined);
  }, [setActiveStepIndex, showSteps, state.stepIndex]);

  const startPanelDrag = (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest("button, input, a")
    ) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    panelDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: panelOffset.x,
      originY: panelOffset.y,
    };
  };
  const movePanel = (event) => {
    const drag = panelDragRef.current;
    if (!drag) return;
    setPanelOffset({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };
  const stopPanelDrag = (event) => {
    panelDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <main
      className={["tc-slides", className].filter(Boolean).join(" ")}
      style={{
        "--tc-slides-frame-padding": `${
          state.slide.framePaddingPercent ?? 5
        }%`,
        ...style,
      }}
    >
      <section className="tc-slides-browser" aria-label={`${title}: ${activeTitle}`}>
        <header className="tc-slides-browser-bar">
          <span className="tc-slides-browser-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="tc-slides-browser-route">{displayRoute}</span>
          <a
            className="tc-slides-icon-button"
            href={openHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Open active slide in a new tab"
            title="Open active slide in a new tab"
          >
            ↗
          </a>
        </header>
        <div className="tc-slides-frame-viewport">
          <iframe
            key={`${deck.id}:${state.contentSlideIndex}`}
            ref={frameRef}
            className="tc-slides-frame"
            src={baseFrameHref}
            title={`${title}: ${activeTitle}`}
            onLoad={(event) => setFrameWindow(event.currentTarget.contentWindow)}
          />
        </div>
      </section>

      {state.conclusion ? (
        <div className="tc-slides-conclusion-scrim" aria-hidden="true" />
      ) : null}

      {!state.conclusion && showSteps && cursorPosition ? (
        <div
          className="tc-slides-cursor"
          style={{ left: cursorPosition.x, top: cursorPosition.y }}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className="tc-slides-panel"
        data-collapsed={panelCollapsed || undefined}
        style={{
          transform: `translate3d(${panelOffset.x}px, ${panelOffset.y}px, 0)`,
        }}
        aria-label={`${title}, slide ${state.slideIndex + 1} of ${state.count}`}
      >
        <header
          className="tc-slides-panel-header"
          onPointerDown={startPanelDrag}
          onPointerMove={movePanel}
          onPointerUp={stopPanelDrag}
          onPointerCancel={stopPanelDrag}
        >
          <span className="tc-slides-grabber" aria-hidden="true">
            ⠿
          </span>
          <strong>{activeTitle}</strong>
          {!state.conclusion && !panelCollapsed ? (
            <label className="tc-slides-steps-toggle">
              <input
                type="checkbox"
                checked={showSteps}
                onChange={(event) => setShowSteps(event.currentTarget.checked)}
              />
              <span>Steps</span>
            </label>
          ) : null}
          <button
            type="button"
            className="tc-slides-icon-button"
            aria-label={panelCollapsed ? "Expand slides panel" : "Collapse slides panel"}
            onClick={() => setPanelCollapsed((collapsed) => !collapsed)}
          >
            {panelCollapsed ? "⌃" : "⌄"}
          </button>
        </header>

        {!panelCollapsed ? (
          <div className="tc-slides-panel-body">
            {state.conclusion ? (
              <MarkdownContent className="tc-slides-conclusion">
                {deck.conclusion}
              </MarkdownContent>
            ) : (
              <>
                <div className="tc-slides-progress" aria-label="Slide progress">
                  {Array.from({ length: state.count }, (_, index) => (
                    <button
                      key={index}
                      type="button"
                      data-active={index === state.slideIndex || undefined}
                      data-complete={index < state.slideIndex || undefined}
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => setSlide(index)}
                    />
                  ))}
                </div>
                <p>{state.slide.description}</p>
              </>
            )}

            <div className="tc-slides-actions">
              <button type="button" disabled={first} onClick={goPrevious}>
                Previous
              </button>
              {state.conclusion ? (
                <button type="button" onClick={() => setSlide(0)}>
                  Restart
                </button>
              ) : (
                <button
                  type="button"
                  disabled={last && !pendingStep}
                  onClick={goNext}
                >
                  {pendingStep ? "Next step" : "Next"}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
