declare module 'virtual:tiny-canvas-pages' {
  export interface TinyCanvasPageModule {
    default?: import('react').ComponentType;
    [exportName: string]: unknown;
  }

  export interface TinyCanvasPage {
    id: `/${string}`;
    title: string;
    href: string;
    load: () => Promise<TinyCanvasPageModule>;
  }

  export const pages: readonly TinyCanvasPage[];
  export default pages;
}

declare module 'virtual:tiny-canvas-documents' {
  export interface TinyCanvasDocument {
    /** Stable route identity for this document. */
    id: `/${string}`;
    title: string;
    /** Vite-base-aware browser URL. */
    href: `/${string}`;
    /** Vite base prefix for resolving prototype routes. */
    appBase: string;
    /** Vite-base-aware directory for relative local resources. */
    resourceBase: `/${string}`;
    /** Current JSONL text, imported through Vite's raw asset pipeline. */
    source: string;
    /** Vite-managed static URLs keyed by paths relative to this document. */
    assets: Readonly<Record<string, string>>;
  }

  export const documents: readonly TinyCanvasDocument[];
  export default documents;
}
