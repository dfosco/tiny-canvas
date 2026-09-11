export interface SnapshotFrame {
  id: string | null;
  title: string;
  route: string;
  width: number;
  height: number;
  element: string | null;
  offset: number;
  hasSnapshot: boolean;
  hasSnapshotDark: boolean;
  start: number;
  end: number;
  indent: string;
}

export declare function parseSnapshotFrames(
  sourceText: string,
  filename?: string
): SnapshotFrame[];
export declare function snapshotFrameName(
  frame: SnapshotFrame,
  index: number
): string;
export declare function snapshotPublicUrl(
  outputDirectory: string,
  boardSlug: string,
  filename: string
): string;
export declare function rewriteSnapshotProps(
  sourceText: string,
  frames: readonly SnapshotFrame[],
  options: { outputDirectory: string; boardSlug: string }
): string;
export declare function scrollPageToElement(
  page: {
    evaluate<T, A>(
      callback: (argument: A) => T | Promise<T>,
      argument: A
    ): Promise<T>;
  },
  element: string | null,
  offset?: number
): Promise<void>;
