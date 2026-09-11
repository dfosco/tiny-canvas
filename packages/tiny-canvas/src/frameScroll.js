export const FRAME_SCROLL_TOP_OFFSET = 24;
export const FRAME_SCROLL_DURATION_MS = 900;

export function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function frameElementScrollTop(
  frameWindow,
  target,
  offset = 0,
  topOffset = FRAME_SCROLL_TOP_OFFSET
) {
  if (!Number.isFinite(offset)) {
    throw new TypeError("Frame offset must be a finite number.");
  }

  return Math.max(
    0,
    target.getBoundingClientRect().top +
      frameWindow.scrollY -
      topOffset +
      offset
  );
}

export function animateFrameWindowScroll(
  frameWindow,
  top,
  duration = FRAME_SCROLL_DURATION_MS
) {
  const startTop = frameWindow.scrollY;
  const distance = top - startTop;
  let requestId = 0;
  let cancelled = false;
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    if (requestId) frameWindow.cancelAnimationFrame(requestId);
    resolveFinished(false);
  };

  if (Math.abs(distance) < 1 || duration === 0) {
    frameWindow.scrollTo({ top });
    resolveFinished(true);
    return { cancel, finished };
  }

  const startTime = frameWindow.performance.now();
  const step = (currentTime) => {
    if (cancelled) return;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    frameWindow.scrollTo({
      top: startTop + distance * easeInOutCubic(progress),
    });
    if (progress < 1) {
      requestId = frameWindow.requestAnimationFrame(step);
    } else {
      resolveFinished(true);
    }
  };
  requestId = frameWindow.requestAnimationFrame(step);

  return { cancel, finished };
}

export function scrollFrameToElement(
  frame,
  element,
  {
    offset = 0,
    topOffset = FRAME_SCROLL_TOP_OFFSET,
    duration = FRAME_SCROLL_DURATION_MS,
  } = {}
) {
  const frameWindow = frame?.contentWindow;
  const target = frame?.contentDocument?.getElementById(element);
  if (!frameWindow || !target) return null;

  return animateFrameWindowScroll(
    frameWindow,
    frameElementScrollTop(frameWindow, target, offset, topOffset),
    duration
  );
}
