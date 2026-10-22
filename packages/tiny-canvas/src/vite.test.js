import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import tinyCanvas from './vite.js';

const temporaryDirectories = [];

function createProject() {
  const root = mkdtempSync(join(tmpdir(), 'tiny-canvas-pages-'));
  temporaryDirectories.push(root);
  const pages = join(root, 'src/pages/canvas');
  mkdirSync(join(pages, 'nested'), { recursive: true });
  for (const file of [
    'index.tsx',
    'details.tsx',
    'SecondPage.tsx',
    'nested/index.tsx',
    'nested/ReviewQueue.tsx',
    '[slug].tsx',
    'ignored.test.tsx',
    'ignored.jsx',
  ]) {
    const target = join(pages, file);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(
      target,
      file === 'details.tsx'
        ? 'export default function Page() { return <Canvas title="Specs" /> }'
        : 'export default function Page() { return <Canvas /> }'
    );
  }
  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('tinyCanvas Vite plugin', () => {
  it('discovers independent TSX pages under /canvas by default', () => {
    const root = createProject();
    const widgets = {
      Frame: {
        prepend: [{ value: '/preview', visible: false }],
        append: [{ value: '/embedded', visible: true }],
      },
      Note: { color: 'blue' },
    };
    const plugin = tinyCanvas({
      titles: { '/canvas': 'Overview' },
      widgets,
    });
    plugin.configResolved({ root, base: '/app/' });
    const [tag] = plugin.transformIndexHtml();
    const manifest = JSON.parse(tag.children);

    expect(tag.attrs).toEqual({
      id: 'tiny-canvas-pages',
      type: 'application/json',
    });
    expect(manifest.widgets).toEqual(widgets);
    expect(manifest.pages).toEqual([
      { id: '/canvas', title: 'Overview', href: '/app/canvas' },
      {
        id: '/canvas/details',
        title: 'Specs',
        href: '/app/canvas/details',
      },
      {
        id: '/canvas/nested',
        title: 'Nested',
        href: '/app/canvas/nested',
      },
      {
        id: '/canvas/nested/review-queue',
        title: 'Review Queue',
        href: '/app/canvas/nested/review-queue',
      },
      {
        id: '/canvas/second-page',
        title: 'Second Page',
        href: '/app/canvas/second-page',
      },
    ]);
  });

  it('supports a configured page directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'tiny-canvas-pages-'));
    temporaryDirectories.push(root);
    const pages = join(root, 'src/pages/tiny-board');
    mkdirSync(pages, { recursive: true });
    writeFileSync(
      join(pages, 'roadmap.tsx'),
      'export default function Page() { return <Canvas /> }'
    );

    const plugin = tinyCanvas({ pagesDir: '/tiny-board' });
    plugin.configResolved({ root, base: '/' });
    const manifest = JSON.parse(plugin.transformIndexHtml()[0].children);

    expect(manifest.pages).toEqual([
      {
        id: '/tiny-board/roadmap',
        title: 'Roadmap',
        href: '/tiny-board/roadmap',
      },
    ]);
  });

  it('separates filesystem discovery from router definitions', () => {
    const root = mkdtempSync(join(tmpdir(), 'tiny-canvas-pages-'));
    temporaryDirectories.push(root);
    const pages = join(root, 'src/routes/tiny-board');
    mkdirSync(pages, { recursive: true });
    writeFileSync(
      join(pages, 'route.tsx'),
      'export const route = createRoute({ path: "tiny-board" })'
    );
    writeFileSync(
      join(pages, 'TinyBoardPage.tsx'),
      'export default function Page() { return <Canvas title="Board one" /> }'
    );
    writeFileSync(
      join(pages, 'TinyBoardPage2.tsx'),
      'export default function Page() { return <Canvas title="Board two" /> }'
    );

    const plugin = tinyCanvas({
      pagesPath: 'src/routes/tiny-board',
      routeBase: '/tiny-board',
      resolveRoute: ({ relativePath }) =>
        relativePath === 'TinyBoardPage.tsx'
          ? '/tiny-board'
          : '/tiny-board/second',
    });
    plugin.configResolved({ root, base: '/preview/', command: 'serve' });
    const manifest = JSON.parse(plugin.transformIndexHtml()[0].children);

    expect(manifest.environment).toBe('dev');
    expect(manifest.pages).toEqual([
      {
        id: '/tiny-board',
        title: 'Board one',
        href: '/preview/tiny-board',
      },
      {
        id: '/tiny-board/second',
        title: 'Board two',
        href: '/preview/tiny-board/second',
      },
    ]);

    const virtualId = plugin.resolveId('virtual:tiny-canvas-pages');
    const registry = plugin.load(virtualId);
    expect(registry).toContain('export const pages=Object.freeze');
    expect(registry).toContain('TinyBoardPage.tsx');
    expect(registry).toContain('TinyBoardPage2.tsx');
    expect(registry).not.toContain('route.tsx');
  });

  it('discovers nested JSONL documents with stable base-aware routes and raw imports', () => {
    const root = mkdtempSync(join(tmpdir(), 'tiny-canvas-documents-'));
    temporaryDirectories.push(root);
    const documents = join(root, 'src/canvas');
    mkdirSync(join(documents, 'button-guides'), { recursive: true });
    const reference = join(
      documents,
      'button-guides/button-patterns.canvas.jsonl'
    );
    mkdirSync(join(documents, 'button-guides/assets'), { recursive: true });
    writeFileSync(join(documents, 'button-guides/assets/diagram.png'), 'image-placeholder');
    writeFileSync(
      reference,
      '{"event":"canvas_created","title":"Button Patterns"}\n'
    );
    writeFileSync(
      join(documents, 'legacy.canvas.jsonl'),
      '{"event":"canvas_created"}\n'
    );

    const plugin = tinyCanvas({
      documentsPath: 'src/canvas',
      titles: { '/canvas/legacy': 'Legacy' },
    });
    plugin.configResolved({ root, base: '/tiny-canvas/' });
    const virtualId = plugin.resolveId('virtual:tiny-canvas-documents');
    const registry = plugin.load(virtualId);
    const manifest = JSON.parse(
      plugin.transformIndexHtml()[1].children
    );

    expect(manifest.documents).toEqual([
      {
        id: '/canvas/button-guides/button-patterns',
        title: 'Button Patterns',
        href: '/tiny-canvas/canvas/button-guides/button-patterns',
        appBase: '/tiny-canvas/',
        resourceBase: '/tiny-canvas/src/canvas/button-guides/',
      },
      {
        id: '/canvas/legacy',
        title: 'Legacy',
        href: '/tiny-canvas/canvas/legacy',
        appBase: '/tiny-canvas/',
        resourceBase: '/tiny-canvas/src/canvas/',
      },
    ]);
    expect(registry).toContain('export const documents=Object.freeze');
    expect(registry).toContain(`${reference}?raw`);
    expect(registry).toContain('source:document0');
    expect(registry).toContain('assets/diagram.png');
    expect(registry).toContain('diagram.png?url');
    expect(JSON.stringify(manifest)).not.toContain('image-placeholder');
    expect(JSON.stringify(manifest)).not.toContain('button-guides/assets/diagram.png');
  });

  it('allows document routes to be mapped without changing source identity', () => {
    const root = mkdtempSync(join(tmpdir(), 'tiny-canvas-documents-'));
    temporaryDirectories.push(root);
    const documents = join(root, 'src/canvas');
    mkdirSync(documents, { recursive: true });
    writeFileSync(
      join(documents, 'buttons.canvas.jsonl'),
      '{"event":"canvas_created","title":"Buttons"}\n'
    );

    const plugin = tinyCanvas({
      resolveDocumentRoute: ({ relativePath }) =>
        relativePath === 'buttons.canvas.jsonl' ? '/patterns/buttons' : '/canvas',
    });
    plugin.configResolved({ root, base: '/preview/' });
    const manifest = JSON.parse(
      plugin.transformIndexHtml()[1].children
    );

    expect(manifest.documents).toEqual([
      {
        id: '/patterns/buttons',
        title: 'Buttons',
        href: '/preview/patterns/buttons',
        appBase: '/preview/',
        resourceBase: '/preview/src/canvas/',
      },
    ]);
  });

  it('watches document additions and invalidates the virtual registry on source changes', () => {
    const root = mkdtempSync(join(tmpdir(), 'tiny-canvas-documents-'));
    temporaryDirectories.push(root);
    const documents = join(root, 'src/canvas');
    const file = join(documents, 'buttons.canvas.jsonl');
    mkdirSync(documents, { recursive: true });
    writeFileSync(file, '{"event":"canvas_created"}\n');
    const plugin = tinyCanvas({ documentsPath: 'src/canvas' });
    plugin.configResolved({ root });

    const listeners = new Map();
    const registryModule = { id: '\0virtual:tiny-canvas-documents' };
    const server = {
      watcher: {
        add: vi.fn(),
        on: vi.fn((event, listener) => listeners.set(event, listener)),
      },
      moduleGraph: {
        getModuleById: vi.fn(() => registryModule),
        invalidateModule: vi.fn(),
      },
      ws: { send: vi.fn() },
    };

    plugin.configureServer(server);
    expect(server.watcher.add).toHaveBeenCalledWith(documents);
    listeners.get('add')(file);
    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(
      registryModule
    );
    expect(server.ws.send).toHaveBeenCalledWith({ type: 'full-reload' });

    server.moduleGraph.invalidateModule.mockClear();
    server.ws.send.mockClear();
    plugin.handleHotUpdate({ file, server });
    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(
      registryModule
    );
    expect(server.ws.send).toHaveBeenCalledWith({ type: 'full-reload' });

    server.moduleGraph.invalidateModule.mockClear();
    server.ws.send.mockClear();
    listeners.get('unlink')(file);
    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(
      registryModule
    );
    expect(server.ws.send).toHaveBeenCalledWith({ type: 'full-reload' });

    server.moduleGraph.invalidateModule.mockClear();
    plugin.handleHotUpdate({ file: join(root, 'src/pages/index.tsx'), server });
    expect(server.moduleGraph.invalidateModule).not.toHaveBeenCalled();
  });

  it('rejects directory traversal', () => {
    expect(() => tinyCanvas({ pagesDir: '/../private' })).toThrow(
      'cannot contain ".."'
    );
  });
});
