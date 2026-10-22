import {
  geometryBasis,
  normalizeGeometry,
  resolveDocumentGeometry,
} from './canvasDocumentLayout';

const DEFAULT_SIZES = {
  'sticky-note': { width: 270, height: 170 },
  markdown: { width: 530, height: 240 },
  image: { width: 400, height: 300 },
  link: { width: 320, height: 96 },
  prototype: { width: 1270, height: 776 },
};

const KNOWN_TYPES = new Set(Object.keys(DEFAULT_SIZES));
const NOTE_COLORS = new Set([
  'yellow',
  'blue',
  'green',
  'pink',
  'purple',
  'orange',
]);

function diagnostic(code, message, itemId) {
  return { code, message, ...(itemId ? { itemId } : {}) };
}

function resolveUrl(value, appBase, resourceBase, resource = false, assets = {}) {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return null;

  if (resource) {
    const assetPath = value.replace(/^\.\//, '');
    const assetUrl = assets[value] || assets[assetPath] || assets[`./${assetPath}`];
    if (assetUrl) return assetUrl;
    if (!value.startsWith('/')) return null;
  }

  const basePath = resource ? resourceBase : appBase;
  if (value.startsWith('/')) {
    const prefix = String(appBase || '/').replace(/\/?$/, '/');
    return `${prefix}${value.replace(/^\/+/, '')}`;
  }
  const prefix = String(basePath || '/').replace(/\/?$/, '/');
  return `${prefix}${value.replace(/^\.\//, '')}`;
}

function geometryFor(widget, defaults) {
  const width = widget.props?.width ?? defaults.width;
  const height = widget.props?.height ?? defaults.height;
  return normalizeGeometry({
    position: widget.position,
    width,
    height,
  });
}

export function projectCanvasDocument(
  state,
  {
    appBase = '/',
    resourceBase = '/',
    assets = {},
    sourceExports = {},
    overrides = {},
  } = {}
) {
  const diagnostics = [];
  const items = [];
  for (const widget of state.widgets || []) {
    if (!KNOWN_TYPES.has(widget.type)) {
      diagnostics.push(
        diagnostic(
          'unsupported_widget',
          `Widget "${widget.id}" uses unsupported type "${widget.type}".`,
          widget.id
        )
      );
      continue;
    }

    const sourceGeometry = geometryFor(widget, DEFAULT_SIZES[widget.type]);
    if (!sourceGeometry || sourceGeometry.x < 0 || sourceGeometry.y < 0) {
      diagnostics.push(
        diagnostic(
          'unsupported_geometry',
          `Widget "${widget.id}" has geometry Tiny Canvas cannot represent.`,
          widget.id
        )
      );
      continue;
    }
    const geometry = resolveDocumentGeometry(
      sourceGeometry,
      overrides[widget.id]
    );
    const props = { ...(widget.props || {}) };

    if (
      (widget.type === 'sticky-note' &&
        props.color !== undefined &&
        !NOTE_COLORS.has(props.color)) ||
      (widget.type === 'sticky-note' &&
        props.text !== undefined &&
        typeof props.text !== 'string') ||
      (widget.type === 'markdown' &&
        props.content !== undefined &&
        typeof props.content !== 'string') ||
      (widget.type === 'image' &&
        props.alt !== undefined &&
        typeof props.alt !== 'string')
    ) {
      diagnostics.push(
        diagnostic(
          'unsupported_widget_content',
          `Widget "${widget.id}" has content or styling Tiny Canvas cannot represent.`,
          widget.id
        )
      );
      continue;
    }

    if (widget.type === 'image') {
      const src = resolveUrl(
        props.src ?? props.url,
        appBase,
        resourceBase,
        true,
        assets
      );
      if (!src) {
        diagnostics.push(
          diagnostic(
            'unsupported_image_source',
            `Image widget "${widget.id}" has an unsupported or missing source URL.`,
            widget.id
          )
        );
        continue;
      }
      props.src = src;
    }

    if (widget.type === 'link') {
      const url = resolveUrl(props.url, appBase, resourceBase, false);
      let supportedUrl = false;
      try {
        const parsedUrl = new URL(url);
        supportedUrl = ['http:', 'https:'].includes(parsedUrl.protocol);
      } catch {
        supportedUrl = false;
      }
      if (
        !supportedUrl ||
        typeof props.title !== 'string' ||
        !props.title.trim() ||
        typeof props.displayUrl !== 'string' ||
        !props.displayUrl.trim()
      ) {
        diagnostics.push(
          diagnostic(
            'unsupported_link',
            `Link widget "${widget.id}" requires a supported URL, title, and display URL.`,
            widget.id
          )
        );
        continue;
      }
      props.url = url;
    }

    if (widget.type === 'prototype') {
      if (props.zoom !== undefined && props.zoom !== 100) {
        diagnostics.push(
          diagnostic(
            'unsupported_prototype_zoom',
            `Prototype widget "${widget.id}" uses a zoom value Tiny Canvas cannot preserve.`,
            widget.id
          )
        );
      }
      const route = resolveUrl(props.src ?? props.route, appBase, resourceBase);
      if (!route || /^[a-z][a-z\d+.-]*:/i.test(route)) {
        diagnostics.push(
          diagnostic(
            'unsupported_prototype_source',
            `Prototype widget "${widget.id}" has an unsupported route.`,
            widget.id
          )
        );
        continue;
      }
      try {
        const target = new URL(route, 'https://tiny-canvas.invalid');
        if (
          target.origin !== 'https://tiny-canvas.invalid' &&
          !['http:', 'https:'].includes(target.protocol)
        ) {
          throw new TypeError('unsupported protocol');
        }
      } catch {
        diagnostics.push(
          diagnostic(
            'unsupported_prototype_source',
            `Prototype widget "${widget.id}" has an invalid route.`,
            widget.id
          )
        );
        continue;
      }
      props.route = route;
    }

    items.push({
      id: widget.id,
      type: widget.type,
      props,
      sourceGeometry: geometryBasis(sourceGeometry),
      geometry,
    });
  }

  for (const source of state.sources || []) {
    const sourceId = `source:${source.export}`;
    const Component = sourceExports[source.export];
    const sourceGeometry = normalizeGeometry({
      position: source.position,
      width: source.width,
      height: source.height,
    });
    if (!sourceGeometry || sourceGeometry.x < 0 || sourceGeometry.y < 0) {
      diagnostics.push(
        diagnostic(
          'unsupported_source_geometry',
          `JSX source "${source.export}" has geometry Tiny Canvas cannot represent.`,
          sourceId
        )
      );
      continue;
    }
    if (
      typeof Component !== 'function' &&
      !(Component && typeof Component === 'object' && Component.$$typeof)
    ) {
      diagnostics.push(
        diagnostic(
          'missing_jsx_companion',
          `JSX source "${source.export}" is executable companion code and needs an explicit sourceExports binding.`,
          sourceId
        )
      );
      continue;
    }
    items.push({
      id: sourceId,
      type: 'jsx-source',
      Component,
      sourceGeometry: geometryBasis(sourceGeometry),
      geometry: resolveDocumentGeometry(sourceGeometry, overrides[sourceId]),
    });
  }

  if (state.connectors?.length) {
    diagnostics.push(
      diagnostic(
        'unsupported_connectors',
        `This canvas contains ${state.connectors.length} connector(s); Tiny Canvas does not render Hypercanvas connectors.`
      )
    );
  }

  const uniqueItems = [];
  const itemIds = new Set();
  for (const item of items) {
    if (itemIds.has(item.id)) {
      diagnostics.push(
        diagnostic(
          'duplicate_widget_id',
          `Canvas items use duplicate stable ID "${item.id}".`,
          item.id
        )
      );
      continue;
    }
    itemIds.add(item.id);
    uniqueItems.push(item);
  }

  return { items: uniqueItems, diagnostics };
}
