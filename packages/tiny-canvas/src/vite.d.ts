/// <reference path="./virtual.d.ts" />

import type { Plugin } from 'vite';
import type { TinyCanvasWidgetConfig } from './index';

export interface TinyCanvasPageRouteContext {
  /** Absolute TSX filename. */
  file: string;
  /** TSX filename relative to pagesPath. */
  relativePath: string;
  /** Route inferred from routeBase and relativePath. */
  defaultRoute: `/${string}`;
  /** Configured route base. */
  routeBase: `/${string}`;
}

export interface TinyCanvasDocumentRouteContext {
  /** Absolute JSONL filename. */
  file: string;
  /** JSONL filename relative to documentsPath. */
  relativePath: string;
  /** Route inferred from routeBase and relativePath. */
  defaultRoute: `/${string}`;
  /** Configured browser route prefix. */
  routeBase: `/${string}`;
}

export interface TinyCanvasViteOptions {
  /** @deprecated Use routeBase. */
  pagesDir?: `/${string}`;
  /** Filesystem directory containing Canvas TSX pages, relative to the Vite root or absolute. Default: src/pages/<routeBase> */
  pagesPath?: string;
  /** Browser route prefix for discovered pages. Default: '/canvas' */
  routeBase?: `/${string}`;
  /** Override the browser route inferred for a discovered page. */
  resolveRoute?: (page: TinyCanvasPageRouteContext) => `/${string}`;
  /** Filesystem directory containing .canvas.jsonl documents. Default: 'src/canvas'. */
  documentsPath?: string;
  /** Override the browser route inferred for a discovered JSONL document. */
  resolveDocumentRoute?: (
    document: TinyCanvasDocumentRouteContext
  ) => `/${string}`;
  /** Optional route-to-title overrides. */
  titles?: Readonly<Record<string, string>>;
  /** Optional default props keyed by exported widget type. */
  widgets?: Readonly<TinyCanvasWidgetConfig>;
}

export default function tinyCanvas(options?: TinyCanvasViteOptions): Plugin;
