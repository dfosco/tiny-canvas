import {
  buildFrameDisplayRoute,
  buildFrameHref,
  buildFrameOpenHref,
} from "./frameUrl";

export function normalizeSlidesIndex(value, count) {
  const requested = Number(value);
  if (!Number.isFinite(requested) || count <= 0) return 0;
  return Math.min(Math.max(Math.trunc(requested), 0), count - 1);
}

export function normalizeSlidesStep(value, stepCount) {
  const requested = Number(value);
  if (
    !Number.isFinite(requested) ||
    requested <= 0 ||
    requested > stepCount
  ) {
    return undefined;
  }
  return Math.trunc(requested);
}

export function slidesCount(deck) {
  return deck.slides.length + (deck.conclusion?.trim() ? 1 : 0);
}

export function resolveSlidesState(deck, slideIndex = 0, stepIndex) {
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    throw new TypeError("Slides requires a deck with at least one slide.");
  }

  const count = slidesCount(deck);
  const normalizedSlideIndex = normalizeSlidesIndex(slideIndex, count);
  const conclusion =
    Boolean(deck.conclusion?.trim()) &&
    normalizedSlideIndex === deck.slides.length;
  const contentSlideIndex = Math.min(
    normalizedSlideIndex,
    deck.slides.length - 1
  );
  const slide = deck.slides[contentSlideIndex];
  const steps = conclusion ? [] : slide.steps ?? [];
  const activeStepIndex = normalizeSlidesStep(stepIndex, steps.length);
  let url = slide.url;

  for (let index = 0; index < (activeStepIndex ?? 0); index += 1) {
    const step = steps[index];
    if (step?.type === "click") url = step.url;
  }

  return {
    count,
    conclusion,
    contentSlideIndex,
    slideIndex: normalizedSlideIndex,
    slide,
    steps,
    stepIndex: activeStepIndex,
    activeStep: activeStepIndex
      ? steps[activeStepIndex - 1]
      : undefined,
    url,
  };
}

export function nextSlidesState(deck, slideIndex, stepIndex, stepsEnabled = true) {
  const state = resolveSlidesState(deck, slideIndex, stepIndex);
  const nextStep = (state.stepIndex ?? 0) + 1;
  if (stepsEnabled && nextStep <= state.steps.length) {
    return { slideIndex: state.slideIndex, stepIndex: nextStep };
  }
  return {
    slideIndex: Math.min(state.slideIndex + 1, state.count - 1),
    stepIndex: undefined,
  };
}

export function previousSlidesState(deck, slideIndex) {
  const state = resolveSlidesState(deck, slideIndex);
  return {
    slideIndex: Math.max(state.slideIndex - 1, 0),
    stepIndex: undefined,
  };
}

export function buildSlidesFrameHref(
  url,
  currentHref = window.location.href
) {
  return buildFrameHref(url, currentHref);
}

export function buildSlidesOpenHref(
  url,
  currentHref = window.location.href
) {
  return buildFrameOpenHref(
    buildSlidesFrameHref(url, currentHref),
    currentHref
  );
}

export function buildSlidesDisplayRoute(
  slide,
  activeUrl,
  currentHref = window.location.href
) {
  if (activeUrl === slide.url && slide.displayUrl) {
    return slide.displayUrl;
  }
  return buildFrameDisplayRoute(activeUrl, {}, currentHref);
}
