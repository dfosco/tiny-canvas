import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import ResizableBlock from "./ResizableBlock";
import { CanvasContext } from "./CanvasContext";
import { authorizeCanvasChild } from "./canvasChild";
import { writeClipboardText } from "./clipboard";
import { getCanvasEnvironment } from "./PageSelector";
import useFrameLoadPolicy from "./useFrameLoadPolicy";
import {
  buildFrameDisplayRoute,
  buildFrameHref,
  buildFrameNavigationDisplayRoute,
  buildFrameOpenHref,
} from "./frameUrl";
import { scrollFrameToElement } from "./frameScroll";

const DEFAULT_MIN_WIDTH = 320;
const DEFAULT_MIN_HEIGHT = 240;
const DEFAULT_WIDTH = 1270;
const DEFAULT_HEIGHT = 776;

function Frame({
  route,
  title,
  description,
  prepend,
  append,
  apend,
  loadStrategy,
  snapshot,
  snapshotDark,
  interactLabel = "Click to interact",
  element,
  offset = 0,
  width,
  height,
  minWidth = DEFAULT_MIN_WIDTH,
  minHeight = DEFAULT_MIN_HEIGHT,
  onSizeChange,
  id,
  blockId,
  selected,
  onSelectionChange,
  className,
  style,
  ...blockProps
}) {
  const iframeRef = useRef(null);
  const canvas = useContext(CanvasContext);
  const navigationCleanupRef = useRef(null);
  const frameScrollCleanupRef = useRef(null);
  const interactButtonRef = useRef(null);
  const restoreInteractFocusRef = useRef(false);
  const environment = getCanvasEnvironment();
  const affixOptions = { prepend, append, apend, environment };
  const sourceKey = `${String(
    route
  )}\n${title}\n${environment}\n${JSON.stringify(prepend)}\n${JSON.stringify(
    append ?? apend
  )}`;
  const iframeSrc = useMemo(
    () => buildFrameHref(route, window.location.href, affixOptions),
    [apend, append, environment, prepend, route]
  );
  const initialNavigation = useMemo(
    () => ({
      sourceKey,
      title,
      route: buildFrameDisplayRoute(route, affixOptions),
      href: buildFrameOpenHref(iframeSrc, window.location.href, affixOptions),
    }),
    [apend, append, environment, iframeSrc, prepend, route, sourceKey, title]
  );
  const [navigation, setNavigation] = useState(initialNavigation);
  const [interactive, setInteractive] = useState(false);
  const [loadedFrameSrc, setLoadedFrameSrc] = useState(null);
  const [snapshotError, setSnapshotError] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const [hoveringGuard, setHoveringGuard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [captureStatus, setCaptureStatus] = useState("idle");
  const [linkCopied, setLinkCopied] = useState(false);
  const captureStatusTimeoutRef = useRef(null);
  const linkCopiedTimeoutRef = useRef(null);
  const {
    loadStrategy: resolvedLoadStrategy,
    shouldMountIframe,
    activate,
  } = useFrameLoadPolicy({ loadStrategy, snapshot });
  const currentNavigation =
    navigation.sourceKey === sourceKey ? navigation : initialNavigation;
  const usesInteractionGate = resolvedLoadStrategy === "interaction";
  const iframeLoaded = loadedFrameSrc === iframeSrc;
  const showPoster = Boolean(snapshot) && !iframeLoaded;

  useEffect(() => {
    setSnapshotError(false);
  }, [snapshot]);

  useEffect(() => {
    if (
      usesInteractionGate &&
      ((canvas && blockId && canvas.selectedBlockId !== blockId) ||
        selected === false)
    ) {
      setInteractive(false);
    }
  }, [blockId, canvas, canvas?.selectedBlockId, selected, usesInteractionGate]);

  useEffect(() => {
    if (
      !interactive &&
      restoreInteractFocusRef.current &&
      interactButtonRef.current
    ) {
      restoreInteractFocusRef.current = false;
      interactButtonRef.current.focus();
    }
  }, [interactive]);

  useEffect(
    () => () => {
      navigationCleanupRef.current?.();
      frameScrollCleanupRef.current?.();
      window.clearTimeout(captureStatusTimeoutRef.current);
      window.clearTimeout(linkCopiedTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (!hoveringGuard) return undefined;
    const handleKey = (event) => {
      if (event.key === "Alt") {
        setAltHeld(event.altKey);
      }
    };
    const handleBlur = () => setAltHeld(false);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
      window.removeEventListener("blur", handleBlur);
    };
  }, [hoveringGuard]);

  const copySnapshotToClipboard = useCallback(async () => {
    if (!snapshot) return;
    try {
      const response = await fetch(snapshot);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
    } catch (error) {
      console.error(
        `Unable to copy Frame "${currentNavigation.title}" thumbnail:`,
        error
      );
      setCopied(false);
    }
  }, [snapshot]);

  const stopInteraction = useCallback((restoreFocus = false) => {
    restoreInteractFocusRef.current = restoreFocus;
    setInteractive(false);
  }, []);

  const startInteraction = useCallback(() => {
    activate();
    setInteractive(true);
  }, [activate]);

  const refreshFrame = useCallback(() => {
    navigationCleanupRef.current?.();
    setLoadedFrameSrc(null);
    setNavigation(initialNavigation);
    activate();
    setReloadKey((key) => key + 1);
  }, [activate, initialNavigation]);

  const copyFrameLink = useCallback(async () => {
    const frameId = blockId ?? id;
    if (!frameId) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("tcFrame");
    const queryIndex = url.hash.indexOf("?");
    const hashPath =
      queryIndex === -1 ? url.hash : url.hash.slice(0, queryIndex);
    const hashParams = new URLSearchParams(
      queryIndex === -1 ? "" : url.hash.slice(queryIndex + 1)
    );
    hashParams.set("tcFrame", frameId);
    url.hash = `${hashPath || "#/"}?${hashParams.toString()}`;
    try {
      await writeClipboardText(url.href);
      setLinkCopied(true);
      window.clearTimeout(linkCopiedTimeoutRef.current);
      linkCopiedTimeoutRef.current = window.setTimeout(
        () => setLinkCopied(false),
        1600
      );
    } catch {
      setLinkCopied(false);
    }
  }, [blockId, id]);

  const captureFrameToClipboard = useCallback(async () => {
    const iframe = iframeRef.current;
    if (
      !navigator.clipboard?.write ||
      !window.ClipboardItem ||
      (showPoster ? !snapshot : !iframeLoaded)
    ) {
      setCaptureStatus("error");
      return;
    }

    setCaptureStatus("capturing");
    try {
      let blob;
      if (showPoster && snapshot) {
        const prefersDark = window.matchMedia?.(
          "(prefers-color-scheme: dark)"
        ).matches;
        const visibleSnapshot =
          prefersDark && snapshotDark ? snapshotDark : snapshot;
        const response = await fetch(visibleSnapshot);
        if (!response.ok) {
          throw new Error("Unable to load the frame thumbnail.");
        }
        blob = await response.blob();
      } else {
        const frameWindow = iframe.contentWindow;
        const frameDocument = iframe.contentDocument;
        const width = iframe.clientWidth;
        const height = iframe.clientHeight;
        if (!frameWindow || !frameDocument || width === 0 || height === 0) {
          throw new Error("Frame is not ready to capture.");
        }
        const { domToBlob } = await import("modern-screenshot");
        blob = await domToBlob(frameDocument.documentElement, {
          backgroundColor: null,
          features: { restoreScrollPosition: true },
          height,
          scale: window.devicePixelRatio || 1,
          timeout: 30_000,
          width,
          style: {
            height: `${height}px`,
            overflow: "hidden",
            width: `${width}px`,
          },
        });
      }
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type || "image/png"]: blob }),
      ]);
      setCaptureStatus("copied");
      window.clearTimeout(captureStatusTimeoutRef.current);
      captureStatusTimeoutRef.current = window.setTimeout(
        () => setCaptureStatus("idle"),
        1600
      );
    } catch (error) {
      console.error(`Unable to capture Frame "${currentNavigation.title}":`, error);
      setCaptureStatus("error");
    }
  }, [
    currentNavigation.title,
    iframeLoaded,
    showPoster,
    snapshot,
    snapshotDark,
  ]);

  const syncNavigation = () => {
    const iframe = iframeRef.current;
    try {
      const navigationHref = iframe.contentWindow.location.href;
      setNavigation({
        sourceKey,
        title: iframe.contentDocument?.title?.trim() || title,
        route: buildFrameNavigationDisplayRoute(
          navigationHref,
          affixOptions,
          window.location.href
        ),
        href: buildFrameOpenHref(
          navigationHref,
          window.location.href,
          affixOptions
        ),
      });
    } catch {
      // Keep the last same-origin navigation state.
    }
  };

  const observeNavigation = () => {
    navigationCleanupRef.current?.();
    syncNavigation();

    const iframe = iframeRef.current;
    try {
      const frameWindow = iframe.contentWindow;
      const frameDocument = iframe.contentDocument;
      const observerTarget =
        frameDocument.querySelector("title") || frameDocument.head;
      const observer = observerTarget
        ? new MutationObserver(syncNavigation)
        : null;
      const frameHistory = frameWindow.history;
      const pushState = frameHistory.pushState;
      const replaceState = frameHistory.replaceState;
      const observeHistory = (method) =>
        function observedHistory(...args) {
          const result = method.apply(this, args);
          syncNavigation();
          return result;
        };
      const observedPushState = observeHistory(pushState);
      const observedReplaceState = observeHistory(replaceState);
      const forwardWheelZoom = (event) => {
        if ((!event.ctrlKey && !event.metaKey) || !canvas?.zoomByWheel) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        const iframeRect = iframe.getBoundingClientRect();
        canvas.zoomByWheel(
          event.deltaY,
          iframeRect.left + event.clientX,
          iframeRect.top + event.clientY
        );
      };
      const stopOnEscape = (event) => {
        if (event.key === "Escape") {
          stopInteraction(true);
        }
      };
      frameHistory.pushState = observedPushState;
      frameHistory.replaceState = observedReplaceState;
      observer?.observe(observerTarget, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      frameWindow.addEventListener("hashchange", syncNavigation);
      frameWindow.addEventListener("popstate", syncNavigation);
      frameWindow.navigation?.addEventListener(
        "currententrychange",
        syncNavigation
      );
      frameDocument.addEventListener("wheel", forwardWheelZoom, {
        capture: true,
        passive: false,
      });
      frameDocument.addEventListener("keydown", stopOnEscape);

      navigationCleanupRef.current = () => {
        observer?.disconnect();
        if (frameHistory.pushState === observedPushState) {
          frameHistory.pushState = pushState;
        }
        if (frameHistory.replaceState === observedReplaceState) {
          frameHistory.replaceState = replaceState;
        }
        frameWindow.removeEventListener("hashchange", syncNavigation);
        frameWindow.removeEventListener("popstate", syncNavigation);
        frameWindow.navigation?.removeEventListener(
          "currententrychange",
          syncNavigation
        );
        frameDocument.removeEventListener("wheel", forwardWheelZoom, true);
        frameDocument.removeEventListener("keydown", stopOnEscape);
      };
    } catch {
      navigationCleanupRef.current = null;
    }
  };

  const showInteractionGuard =
    usesInteractionGate && (!interactive || !iframeLoaded);
  const interactionLoading =
    usesInteractionGate && shouldMountIframe && !iframeLoaded;
  const interactAccessibleLabel =
    typeof interactLabel === "string"
      ? `${interactLabel} with ${currentNavigation.title}`
      : `Interact with ${currentNavigation.title}`;

  return (
    <>
      <ResizableBlock
      {...blockProps}
      id={id}
      blockId={blockId}
      selected={selected}
      componentName="Frame"
      resizeLabel={`Resize ${currentNavigation.title}`}
      defaultWidth={DEFAULT_WIDTH}
      defaultHeight={DEFAULT_HEIGHT}
      width={width}
      height={height}
      minWidth={minWidth}
      minHeight={minHeight}
      onSizeChange={onSizeChange}
      className={["tc-frame-block", className].filter(Boolean).join(" ")}
      style={style}
      onSelectionChange={(nextSelected) => {
        if (!nextSelected) {
          stopInteraction();
        }
        onSelectionChange?.(nextSelected);
      }}
    >
      <section className="tc-frame">
        <div className="tc-frame-title-bar">
          <span className="tc-frame-heading">
            <span className="tc-frame-title">{currentNavigation.title}</span>
            {description ? (
              <span className="tc-frame-description">{description}</span>
            ) : null}
          </span>
          <span className="tc-frame-route">{currentNavigation.route}</span>
          <span className="tc-frame-actions">
            <button
              type="button"
              className="tc-frame-action tc-no-drag"
              onClick={copyFrameLink}
              disabled={!blockId && !id}
              aria-label={
                linkCopied
                  ? `Copied link to ${currentNavigation.title}`
                  : `Copy link to ${currentNavigation.title}`
              }
              title={linkCopied ? "Link copied" : "Copy link to frame"}
            >
              {linkCopied ? (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path
                    d="m3 8.5 3 3 7-7"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <rect
                    x="5.5"
                    y="5.5"
                    width="8"
                    height="8"
                    rx="1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3.5 10.5h-1v-8h8v1"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="tc-frame-action tc-no-drag"
              onClick={refreshFrame}
              aria-label={`Refresh ${currentNavigation.title}`}
              title="Refresh frame"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path
                  d="M13.5 3v3.5H10M13 6.5A5.5 5.5 0 1 0 13.1 10"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
            <button
              type="button"
              className="tc-frame-action tc-no-drag"
              onClick={captureFrameToClipboard}
              disabled={
                (showPoster ? !snapshot : !iframeLoaded) ||
                captureStatus === "capturing"
              }
              aria-label={
                captureStatus === "copied"
                  ? `Copied ${currentNavigation.title} frame`
                  : captureStatus === "error"
                  ? `Could not capture ${currentNavigation.title} frame`
                  : `Capture ${currentNavigation.title} frame`
              }
              title={
                showPoster
                  ? "Copy thumbnail to clipboard"
                  : captureStatus === "copied"
                  ? "Copied to clipboard"
                  : captureStatus === "error"
                  ? "Capture failed"
                  : "Capture frame to clipboard"
              }
            >
              {captureStatus === "copied" ? (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path
                    d="m3 8.5 3 3 7-7"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path
                    d="M5 4.5 6 3h4l1 1.5h1.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1H5Zm3 6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </button>
            <a
              className="tc-frame-action tc-no-drag"
              href={currentNavigation.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${currentNavigation.title} in new tab`}
              title="Open in new tab"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path
                  d="M9.5 2.5h4v4m0-4-6 6M7 4.5H3.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </a>
          </span>
        </div>
        <div className="tc-frame-viewport">
          {shouldMountIframe ? (
            <iframe
              key={reloadKey}
              ref={iframeRef}
              className="tc-frame-document"
              src={iframeSrc}
              title={currentNavigation.title}
              onLoad={(event) => {
                setLoadedFrameSrc(iframeSrc);
                observeNavigation();
                frameScrollCleanupRef.current?.();
                frameScrollCleanupRef.current = null;
                if (element) {
                  const scroll = scrollFrameToElement(
                    event.currentTarget,
                    element,
                    { offset }
                  );
                  if (scroll) {
                    frameScrollCleanupRef.current = scroll.cancel;
                  } else {
                    console.warn(
                      `Unable to scroll Frame "${currentNavigation.title}" to element "${element}".`
                    );
                  }
                }
              }}
            />
          ) : null}
          {showPoster ? (
            <div
              className="tc-frame-poster"
              data-loading={shouldMountIframe || undefined}
            >
              {snapshotError ? (
                <div className="tc-frame-snapshot-fallback" aria-hidden="true">
                  Preview unavailable
                </div>
              ) : (
                <picture className="tc-frame-snapshot-picture">
                  {snapshotDark ? (
                    <source
                      media="(prefers-color-scheme: dark)"
                      srcSet={snapshotDark}
                    />
                  ) : null}
                  <img
                    src={snapshot}
                    alt=""
                    draggable="false"
                    className="tc-frame-snapshot"
                    onError={() => setSnapshotError(true)}
                  />
                </picture>
              )}
              {shouldMountIframe && !usesInteractionGate ? (
                <span className="tc-frame-loading-status" role="status">
                  Loading {currentNavigation.title}…
                </span>
              ) : null}
            </div>
          ) : null}
          {showInteractionGuard ? (
            <div
              className="tc-frame-interaction-guard"
              data-loading={interactionLoading || undefined}
              onClick={(event) => {
                if (!interactionLoading && altHeld && snapshot) {
                  event.preventDefault();
                  event.stopPropagation();
                  copySnapshotToClipboard();
                  return;
                }
                startInteraction();
              }}
              onMouseEnter={() => setHoveringGuard(true)}
              onMouseLeave={() => {
                setHoveringGuard(false);
                setAltHeld(false);
                setCopied(false);
              }}
            >
              <button
                ref={interactButtonRef}
                type="button"
                className="tc-frame-interact-button tc-no-drag"
                aria-label={
                  interactionLoading
                    ? `Loading ${currentNavigation.title}`
                    : copied
                    ? `Copied ${currentNavigation.title} to clipboard`
                    : altHeld && snapshot
                    ? `Copy ${currentNavigation.title} to clipboard`
                    : interactAccessibleLabel
                }
                aria-busy={interactionLoading || undefined}
                disabled={interactionLoading}
              >
                {interactionLoading
                  ? "Loading…"
                  : copied
                  ? "Copied!"
                  : altHeld && snapshot
                  ? "Copy to clipboard"
                  : interactLabel}
              </button>
            </div>
          ) : null}
        </div>
      </section>
      </ResizableBlock>
      {captureStatus === "copied"
        ? createPortal(
            <div className="tc-frame-capture-toast" role="status">
              screenshot copied
            </div>,
            document.body
          )
        : null}
    </>
  );
}

Frame.displayName = "Frame";

export default authorizeCanvasChild(Frame);
