import {
  CSSProperties,
  HTMLAttributes,
  ImgHTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasChange {
  component: string;
  index?: number;
  key?: string;
  pageId?: string;
  pageTitle?: string;
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/** Convert a Canvas page filename stem to its kebab-case URL segment. */
export declare function slugifyCanvasPageName(value: string): string;

type CanvasChild =
  | ReactElement<BlockProps, typeof Block>
  | ReactElement<FrameProps, typeof Frame>
  | ReactElement<NoteProps, typeof Note>
  | ReactElement<MarkProps, typeof Mark>
  | ReactElement<LinkProps, typeof Link>
  | ReactElement<ImageProps, typeof Image>;

export interface CanvasProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelectionChange"> {
  children?: CanvasChild | readonly CanvasChild[];
  /** Canvas page title. Overrides its filename in the page selector. */
  title?: string;
  /** Scrollable board width in pixels. Default: 10000 */
  canvasWidth?: number;
  /** Scrollable board height in pixels. Default: 10000 */
  canvasHeight?: number;
  /** Show dot background. Default: false */
  dotted?: boolean;
  /** Legacy alias for dotted. Default: false */
  grid?: boolean;
  /** Dot-grid spacing in pixels. Default: 36 */
  gridSize?: number;
  /** Color mode: 'auto' follows system preference, 'light' or 'dark' to override. Default: 'auto' */
  colorMode?: "auto" | "light" | "dark";
  /** Show the built-in Reset board button. Default: false */
  resettable?: boolean;
  /** Reset button content. Default: 'Reset board' */
  resetLabel?: ReactNode;
  /** Show Copy changes. Defaults to the value of resettable. */
  copyable?: boolean;
  /** Copy button content. Default: 'Copy changes' */
  copyLabel?: ReactNode;
  /** Copy-success button content. Default: 'Copied' */
  copiedLabel?: ReactNode;
  /** Called after persisted layout changes are copied. */
  onCopyChanges?: (changes: CanvasChange[], text: string) => void;
  /** Called when selection changes. Null means the canvas background is selected. */
  onSelectionChange?: (blockId: string | null) => void;
}

export declare function Canvas(props: CanvasProps): ReactElement;

export interface BlockProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelectionChange"> {
  children?: ReactNode;
  /** Optional stable persistence and DOM identifier. Canvas generates one when omitted. */
  id?: string;
  /** Initial horizontal position in pixels. A saved position takes precedence. Default: 0 */
  x?: number;
  /** Initial vertical position in pixels. A saved position takes precedence. Default: 0 */
  y?: number;
  /** Controls selection when provided. */
  selected?: boolean;
  onPositionChange?: (position: Position) => void;
  onSelectionChange?: (selected: boolean) => void;
}

export declare function Block(props: BlockProps): ReactElement;

export interface FramePathAffix {
  /** String added to the iframe URL. A leading ? adds query parameters. */
  value: string;
  /** Show this value in the Frame header route. */
  visible: boolean;
  /** Include this value when opening the Frame URL externally. Default: true */
  external?: boolean;
  /** Apply only during Vite development or production builds. Omit for both. */
  env?: "dev" | "prod";
}

export type FrameLoadStrategy = "eager" | "interaction";

export interface FrameProps extends Omit<BlockProps, "children"> {
  /** Same-origin URL, path, query, or hash route rendered inside the frame. */
  route: string | URL;
  /** Accessible frame title shown in the title bar. */
  title: string;
  /** Optional state description shown beside the title in smaller type. */
  description?: string;
  /** Iframe admission policy. Defaults to interaction when snapshot is set, otherwise eager. */
  loadStrategy?: FrameLoadStrategy;
  /** Browser-resolvable preview image. Required by the interaction strategy. */
  snapshot?: string;
  /** Optional dark-mode preview selected by the native picture element. */
  snapshotDark?: string;
  /** Interaction-gate button content. Default: 'Click to interact' */
  interactLabel?: ReactNode;
  /** ID of a same-origin element to reveal after the iframe first loads. */
  element?: string;
  /** Additional vertical scroll offset in pixels. Default: 0 */
  offset?: number;
  /** Ordered entries added before the iframe URL pathname. */
  prepend?: readonly FramePathAffix[];
  /** Ordered entries added after the iframe URL pathname. */
  append?: readonly FramePathAffix[];
  /** @deprecated Use append. Legacy objects and arrays remain accepted at runtime. */
  apend?: FramePathAffix | readonly FramePathAffix[];
  /** Initial frame width in pixels. A saved width takes precedence. Default: 1270 */
  width?: number;
  /** Initial frame height in pixels. A saved height takes precedence. Default: 776 */
  height?: number;
  /** Minimum resizable width in pixels. Default: 320 */
  minWidth?: number;
  /** Minimum resizable height in pixels. Default: 240 */
  minHeight?: number;
  /** Called while the frame is resized. */
  onSizeChange?: (size: Size) => void;
}

export declare function Frame(props: FrameProps): ReactElement;

export interface SlidesCursorStep {
  type: "cursor";
  targetId: string;
  scrollOffset?: number;
}

export interface SlidesClickStep {
  type: "click";
  url: string;
}

export type SlidesStep = SlidesCursorStep | SlidesClickStep;

export interface SlideDefinition {
  title: string;
  description: string;
  url: string;
  displayUrl?: string;
  steps?: readonly SlidesStep[];
  framePaddingPercent?: number;
}

export interface SlidesDeck {
  id: string;
  title?: string;
  conclusion?: string;
  conclusionTitle?: string;
  slides: readonly SlideDefinition[];
}

export interface ResolvedSlidesState {
  count: number;
  conclusion: boolean;
  contentSlideIndex: number;
  slideIndex: number;
  slide: SlideDefinition;
  steps: readonly SlidesStep[];
  stepIndex?: number;
  activeStep?: SlidesStep;
  url: string;
}

export interface SlidesNavigationState {
  slideIndex: number;
  stepIndex?: number;
}

export interface SlidesProps {
  deck: SlidesDeck;
  /** Controlled zero-based slide index. */
  slideIndex?: number;
  /** Controlled one-based intermediary step index. */
  stepIndex?: number;
  /** Initial zero-based slide index for uncontrolled use. Default: 0 */
  defaultSlideIndex?: number;
  /** Initial one-based intermediary step index for uncontrolled use. */
  defaultStepIndex?: number;
  onSlideChange?: (slideIndex: number) => void;
  onStepChange?: (stepIndex?: number) => void;
  /** Controlled cursor and click step visibility. */
  stepsEnabled?: boolean;
  /** Initial step visibility for uncontrolled use. Default: true */
  defaultStepsEnabled?: boolean;
  onStepsEnabledChange?: (enabled: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export declare function Slides(props: SlidesProps): ReactElement;

export declare function normalizeSlidesIndex(
  value: unknown,
  count: number
): number;
export declare function normalizeSlidesStep(
  value: unknown,
  stepCount: number
): number | undefined;
export declare function slidesCount(deck: SlidesDeck): number;
export declare function resolveSlidesState(
  deck: SlidesDeck,
  slideIndex?: number,
  stepIndex?: number
): ResolvedSlidesState;
export declare function nextSlidesState(
  deck: SlidesDeck,
  slideIndex: number,
  stepIndex?: number,
  stepsEnabled?: boolean
): SlidesNavigationState;
export declare function previousSlidesState(
  deck: SlidesDeck,
  slideIndex: number
): SlidesNavigationState;
export declare function buildSlidesFrameHref(
  url: string,
  currentHref?: string
): string;
export declare function buildSlidesOpenHref(
  url: string,
  currentHref?: string
): string;
export declare function buildSlidesDisplayRoute(
  slide: SlideDefinition,
  activeUrl: string,
  currentHref?: string
): string;

export type NoteColor =
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "purple"
  | "orange";

export interface NoteProps extends Omit<BlockProps, "children"> {
  /** Markdown text. May also be provided as string children. */
  text?: string;
  children?: string;
  /** Sticky-note palette color. Default: 'yellow' */
  color?: NoteColor;
  /** Initial width in pixels. Saved width takes precedence. Default: 270 */
  width?: number;
  /** Initial height in pixels. Saved height takes precedence. Default: 170 */
  height?: number;
  /** Minimum resizable width in pixels. Default: 180 */
  minWidth?: number;
  /** Minimum resizable height in pixels. Default: 60 */
  minHeight?: number;
  onSizeChange?: (size: Size) => void;
}

export declare function Note(props: NoteProps): ReactElement;

export interface MarkProps extends Omit<BlockProps, "children"> {
  /** Markdown text. May also be provided as string children. */
  content?: string;
  children?: string;
  /** Initial width in pixels. Saved width takes precedence. Default: 530 */
  width?: number;
  /** Initial height in pixels. Saved height takes precedence. */
  height?: number;
  /** Minimum resizable width in pixels. Default: 200 */
  minWidth?: number;
  /** Minimum resizable height in pixels. Default: 60 */
  minHeight?: number;
  onSizeChange?: (size: Size) => void;
}

export declare function Mark(props: MarkProps): ReactElement;

export interface LinkProps extends Omit<BlockProps, "children"> {
  /** Absolute HTTP(S) destination. Its origin supplies /favicon.ico. */
  url: string | URL;
  /** Link title shown in the card. */
  title: string;
  /** URL text shown under the title. */
  displayUrl: string;
  /** Static card width in pixels. Default: 320 */
  width?: number;
  /** Optional static card height in pixels. */
  height?: number;
}

export declare function Link(props: LinkProps): ReactElement;

export interface ImageProps
  extends Omit<BlockProps, "children" | "onLoad" | "onError"> {
  /** Browser-resolvable image URL or imported asset URL. */
  src: string;
  /** Accessible alternative text. Empty means decorative. Default: '' */
  alt?: string;
  /** Initial width in pixels. Saved width takes precedence. Default: 400 */
  width?: number;
  /** Initial height in pixels. Saved height takes precedence. Default: 300 */
  height?: number;
  /** Minimum resizable width in pixels. Default: 100 */
  minWidth?: number;
  /** Minimum resizable height in pixels. Default: 60 */
  minHeight?: number;
  /** Browser image loading behavior. Default: 'lazy' */
  loading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  /** Browser image decoding behavior. Default: 'async' */
  decoding?: ImgHTMLAttributes<HTMLImageElement>["decoding"];
  onLoad?: ImgHTMLAttributes<HTMLImageElement>["onLoad"];
  onError?: ImgHTMLAttributes<HTMLImageElement>["onError"];
  onSizeChange?: (size: Size) => void;
}

export declare function Image(props: ImageProps): ReactElement;

export type WidgetDefaults<Props> = Partial<Omit<Props, "id" | "children">>;

export interface TinyCanvasWidgetConfig {
  Block?: WidgetDefaults<BlockProps>;
  Frame?: WidgetDefaults<FrameProps>;
  Note?: WidgetDefaults<NoteProps>;
  Mark?: WidgetDefaults<MarkProps>;
  Link?: WidgetDefaults<LinkProps>;
  Image?: WidgetDefaults<ImageProps>;
}

export interface UseResetCanvasOptions {
  /** Reload the page after clearing state. Default: false */
  reload?: boolean;
}

/** Returns a function that clears all saved canvas layout state from localStorage. */
export declare function useResetCanvas(
  options?: UseResetCanvasOptions
): () => void;
