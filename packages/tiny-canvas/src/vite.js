import { existsSync, readFileSync, readdirSync } from 'node:fs';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { slugifyCanvasPageName } from './pageRoute.js';

const PAGE_EXTENSIONS = new Set(['.tsx']);
const DOCUMENT_ASSET_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
]);
const MANIFEST_ID = 'tiny-canvas-pages';
const VIRTUAL_PAGES_ID = 'virtual:tiny-canvas-pages';
const RESOLVED_VIRTUAL_PAGES_ID = `\0${VIRTUAL_PAGES_ID}`;
const VIRTUAL_DOCUMENTS_ID = 'virtual:tiny-canvas-documents';
const RESOLVED_VIRTUAL_DOCUMENTS_ID = `\0${VIRTUAL_DOCUMENTS_ID}`;

function normalizeRoute(value) {
  const route = `/${String(value || 'canvas')}`
    .replaceAll('\\', '/')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '');

  if (route.includes('..')) {
    throw new TypeError('tinyCanvas routeBase cannot contain "..".');
  }

  return route || '/canvas';
}

function humanize(value) {
  return slugifyCanvasPageName(value)
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function readCanvasSource(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function readCanvasTitle(source) {
  const match = source.match(
    /<Canvas\b[^>]*\btitle\s*=\s*(["'])(.*?)\1/s
  );
  return match?.[2]?.trim() || '';
}

function collectPageFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPageFiles(absolutePath));
    } else if (
      PAGE_EXTENSIONS.has(extname(entry.name)) &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.spec.tsx') &&
      !entry.name.includes('[')
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

function collectDocumentFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectDocumentFiles(absolutePath));
    } else if (entry.name.endsWith('.canvas.jsonl')) {
      files.push(absolutePath);
    }
  }

  return files;
}

function collectDocumentAssets(directory) {
  if (!existsSync(directory)) return [];
  const assets = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      assets.push(...collectDocumentAssets(absolutePath));
    } else if (DOCUMENT_ASSET_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      assets.push(absolutePath);
    }
  }
  return assets;
}

function readDocumentTitle(file) {
  try {
    const firstLine = readFileSync(file, 'utf8').split(/\r?\n/, 1)[0];
    const header = JSON.parse(firstLine);
    return typeof header.title === 'string' && header.title.trim()
      ? header.title.trim()
      : '';
  } catch {
    return '';
  }
}

function routeFromFile(file, pagesRoot, routeBase) {
  const relativeFile = relative(pagesRoot, file)
    .split(sep)
    .join('/')
    .replace(/\.tsx$/, '')
    .replace(/(^|\/)index$/, '');
  const routePath = relativeFile
    .split('/')
    .filter(Boolean)
    .map(slugifyCanvasPageName)
    .join('/');

  return `${routeBase}/${routePath}`.replace(/\/$/, '') || routeBase;
}

function joinBase(base, route) {
  const normalizedBase = `/${String(base || '/')}`
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '');
  return `${normalizedBase === '/' ? '' : normalizedBase}${route}` || '/';
}

/**
 * Vite plugin that discovers independent Tiny Canvas TSX pages.
 */
export default function tinyCanvas({
  pagesDir,
  pagesPath,
  routeBase = pagesDir || '/canvas',
  resolveRoute,
  documentsPath = 'src/canvas',
  resolveDocumentRoute,
  titles = {},
  widgets = {},
} = {}) {
  if (pagesDir && routeBase !== pagesDir) {
    throw new TypeError(
      'tinyCanvas pagesDir and routeBase cannot define different routes.'
    );
  }
  if (resolveRoute !== undefined && typeof resolveRoute !== 'function') {
    throw new TypeError('tinyCanvas resolveRoute must be a function.');
  }
  if (
    resolveDocumentRoute !== undefined &&
    typeof resolveDocumentRoute !== 'function'
  ) {
    throw new TypeError(
      'tinyCanvas resolveDocumentRoute must be a function.'
    );
  }

  const normalizedRouteBase = normalizeRoute(routeBase);
  let projectRoot = '';
  let base = '/';
  let environment = 'prod';

  const getPagesRoot = () =>
    resolve(
      projectRoot,
      pagesPath || join('src/pages', normalizedRouteBase.slice(1))
    );
  const getDocumentsRoot = () => resolve(projectRoot, documentsPath);

  const getPages = () => {
    const pagesRoot = getPagesRoot();
    return collectPageFiles(pagesRoot)
      .flatMap((file) => {
        const source = readCanvasSource(file);
        if (!/<Canvas\b/.test(source)) {
          return [];
        }

        const relativePath = relative(pagesRoot, file).split(sep).join('/');
        const defaultRoute = routeFromFile(
          file,
          pagesRoot,
          normalizedRouteBase
        );
        const route = normalizeRoute(
          resolveRoute?.({
            file,
            relativePath,
            defaultRoute,
            routeBase: normalizedRouteBase,
          }) || defaultRoute
        );
        const fileName = basename(file, '.tsx');
        const fallbackTitle =
          fileName === 'index'
            ? humanize(basename(dirname(file)))
            : humanize(fileName);

        return [
          {
            file,
            id: route,
            title: titles[route] || readCanvasTitle(source) || fallbackTitle,
            href: joinBase(base, route),
          },
        ];
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  const getDocuments = () => {
    const documentsRoot = getDocumentsRoot();
    const assets = collectDocumentAssets(documentsRoot);
    return collectDocumentFiles(documentsRoot)
      .map((file) => {
        const relativePath = relative(documentsRoot, file)
          .split(sep)
          .join('/');
        const routePath = relativePath
          .replace(/\.canvas\.jsonl$/, '')
          .split('/')
          .filter(Boolean)
          .map(slugifyCanvasPageName)
          .join('/');
        const defaultRoute = routePath
          ? `${normalizedRouteBase}/${routePath}`
          : normalizedRouteBase;
        const route = normalizeRoute(
          resolveDocumentRoute?.({
            file,
            relativePath,
            defaultRoute,
            routeBase: normalizedRouteBase,
          }) || defaultRoute
        );

        return {
          file,
          id: route,
          title: titles[route] || readDocumentTitle(file) || humanize(
            basename(file, '.canvas.jsonl')
          ),
          href: joinBase(base, route),
          appBase: base,
          resourceBase: joinBase(
            base,
            `/${relative(projectRoot, dirname(file)).split(sep).join('/')}/`
          ),
          assets: assets.map((assetFile) => ({
            file: assetFile,
            path: relative(dirname(file), assetFile).split(sep).join('/'),
          })),
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  return {
    name: 'tiny-canvas-pages',
    configResolved(config) {
      projectRoot = config.root;
      base = config.base || '/';
      environment = config.command === 'serve' ? 'dev' : 'prod';
    },
    resolveId(id) {
      if (id === VIRTUAL_PAGES_ID) {
        return RESOLVED_VIRTUAL_PAGES_ID;
      }
      if (id === VIRTUAL_DOCUMENTS_ID) {
        return RESOLVED_VIRTUAL_DOCUMENTS_ID;
      }
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_PAGES_ID) {
        if (id !== RESOLVED_VIRTUAL_DOCUMENTS_ID) return null;
        const discoveredDocuments = getDocuments();
        const rawImports = discoveredDocuments
          .map(
            ({ file }, index) =>
              `import document${index} from ${JSON.stringify(`${file}?raw`)};`
          )
          .join('');
        let assetIndex = 0;
        const assetImports = discoveredDocuments
          .flatMap((document) => document.assets)
          .map(({ file }) => {
            const binding = `documentAsset${assetIndex++}`;
            return `import ${binding} from ${JSON.stringify(`${file}?url`)};`;
          });
        const imports = `${rawImports}${assetImports.join('')}`;
        let currentAssetIndex = 0;
        const documents = discoveredDocuments
          .map(({ file: _file, assets, ...document }, index) => {
            const bindings = assets
              .map(({ path }) => {
                const binding = `documentAsset${currentAssetIndex++}`;
                return `${JSON.stringify(path)}:${binding}`;
              })
              .join(',');
            return `({source:document${index},assets:{${bindings}},...${JSON.stringify(document)}})`;
          })
          .join(',');
        return `${imports}export const documents=Object.freeze([${documents}]);export default documents;`;
      }

      const registry = getPages()
        .map(
          ({ file, ...page }) =>
            `{...${JSON.stringify(page)},load:()=>import(${JSON.stringify(file)})}`
        )
        .join(',');
      return `export const pages=Object.freeze([${registry}]);export default pages;`;
    },
    transformIndexHtml() {
      const pages = getPages().map(({ file: _file, ...page }) => page);
      const documents = getDocuments().map(
        ({ file: _file, assets: _assets, ...document }) => document
      );

      return [
        {
          tag: 'script',
          attrs: { id: MANIFEST_ID, type: 'application/json' },
          children: JSON.stringify({
            pagesDir: normalizedRouteBase,
            routeBase: normalizedRouteBase,
            environment,
            pages,
            widgets,
          }).replaceAll('<', '\\u003c'),
          injectTo: 'head-prepend',
        },
        {
          tag: 'script',
          attrs: { id: 'tiny-canvas-documents', type: 'application/json' },
          children: JSON.stringify({ documents }).replaceAll('<', '\\u003c'),
          injectTo: 'head-prepend',
        },
      ];
    },
    configureServer(server) {
      const documentsRoot = getDocumentsRoot();
      server.watcher.add(documentsRoot);
      const invalidateRegistry = (file) => {
        const normalizedFile = resolve(file);
        if (
          normalizedFile !== documentsRoot &&
          !normalizedFile.startsWith(`${documentsRoot}${sep}`)
        ) {
          return;
        }
        const registryModule = server.moduleGraph.getModuleById(
          RESOLVED_VIRTUAL_DOCUMENTS_ID
        );
        if (registryModule) {
          server.moduleGraph.invalidateModule(registryModule);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', invalidateRegistry);
      server.watcher.on('unlink', invalidateRegistry);
    },
    handleHotUpdate({ file, server }) {
      const documentsRoot = getDocumentsRoot();
      const normalizedFile = resolve(file);
      if (
        normalizedFile !== documentsRoot &&
        !normalizedFile.startsWith(`${documentsRoot}${sep}`)
      ) {
        return null;
      }

      const registryModule = server.moduleGraph.getModuleById(
        RESOLVED_VIRTUAL_DOCUMENTS_ID
      );
      if (registryModule) {
        server.moduleGraph.invalidateModule(registryModule);
        server.ws.send({ type: 'full-reload' });
      }
      return null;
    },
  };
}

export { MANIFEST_ID, VIRTUAL_DOCUMENTS_ID, VIRTUAL_PAGES_ID };
