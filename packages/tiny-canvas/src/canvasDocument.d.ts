/// <reference path="./virtual.d.ts" />

import type { ComponentType, CSSProperties, JSX } from 'react';

export interface CanvasDocumentSource {
  id: string;
  source: string;
  title?: string;
  href?: string;
  appBase?: string;
  resourceBase?: string;
  assets?: Readonly<Record<string, string>>;
}

export interface CanvasDocumentProps extends CanvasDocumentSource {
  sourceExports?: Record<string, ComponentType>;
  className?: string;
  style?: CSSProperties;
}

declare function CanvasDocument(props: CanvasDocumentProps): JSX.Element;
export default CanvasDocument;
