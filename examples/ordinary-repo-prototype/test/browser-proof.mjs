import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url).pathname;
const prototypePath = `${root}src/hyperbase/prototypes/chrome-overview/index.jsx`;
const canvasPath = `${root}src/hyperbase/canvas/chrome-components.canvas.jsonl`;
const originalPrototype = await readFile(prototypePath, 'utf8');
const originalCanvas = await readFile(canvasPath, 'utf8');
const server = await createServer({
  configFile: `${root}vite.config.js`,
  server: { host: '127.0.0.1', port: 0, strictPort: false },
  logLevel: 'error',
});
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROME_EXECUTABLE_PATH }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  const externalRequests = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(origin)) externalRequests.push(request.url());
  });
  page.on('pageerror', (error) => { throw error; });

  const initialUrl = `${origin}/canvas/chrome-components?proof=outer#canvas-review`;
  await page.goto(initialUrl, { waitUntil: 'networkidle' });
  await page.getByText('Canvas document diagnostics').waitFor();
  for (const unsupportedId of [
    'component-set-s9bwxq',
    'component-set-q5irl6',
    'story-tf46kt',
    'story-x3ek7b',
    'story-popzei',
  ]) {
    assert.ok(await page.getByText(new RegExp(unsupportedId)).count(), `diagnostic identifies ${unsupportedId}`);
  }
  assert.equal(new URL(page.url()).search, '?proof=outer');
  assert.equal(new URL(page.url()).hash, '#canvas-review');
  await page.locator('#image-fqj3ky img').evaluate((img) => img.decode());
  assert.ok(await page.locator('#prototype-tzc6sd iframe').count());
  const frame = page.frameLocator('#prototype-tzc6sd iframe');
  await frame.getByText('Make room for the work.').waitFor();
  const viewport = await page.locator('#prototype-tzc6sd iframe').evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
    innerWidth: element.contentWindow.innerWidth,
    innerHeight: element.contentWindow.innerHeight,
  }));
  assert.equal(viewport.width, viewport.innerWidth, 'Frame content retains its source width');
  assert.equal(viewport.height, viewport.innerHeight, 'Frame content retains its source height');

  const light = await context.newPage();
  await light.emulateMedia({ colorScheme: 'light' });
  await light.goto(initialUrl, { waitUntil: 'networkidle' });
  const lightBackground = await light.locator('.tc-canvas').evaluate((el) => getComputedStyle(el).backgroundColor);
  const darkBackground = await page.locator('.tc-canvas').evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.notEqual(darkBackground, lightBackground, 'auto theme follows the browser color scheme');
  await light.close();

  const changedPrototype = originalPrototype.replace(
    'Make room for the work.',
    'Make room for the work. HMR proof.'
  );
  assert.notEqual(changedPrototype, originalPrototype, 'source edit target exists');
  await writeFile(prototypePath, changedPrototype);
  await frame.getByText('Make room for the work. HMR proof.').waitFor({ timeout: 15000 });
  await frame.getByRole('link', { name: 'Explore page details' }).click();
  await page.waitForFunction(() => {
    const frame = document.querySelector('#prototype-tzc6sd iframe');
    return frame?.contentWindow?.location.href.includes('?view=details#overview');
  });
  assert.match(page.url(), /\?proof=outer#canvas-review$/);

  const board = page.locator('.tc-canvas-document-board');
  await board.evaluate((el) => { el.scrollTop = 0; el.scrollLeft = 0; });
  const markdown = page.locator('#markdown-szmufq');
  const box = await markdown.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + 40, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 90, { steps: 5 });
  await page.mouse.up();
  const storageKey = 'tiny-canvas:canvas-document-layout:v1:%2Fcanvas%2Fchrome-components';
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  assert.ok(saved.items['markdown-szmufq']);
  assert.deepEqual(saved.items['markdown-szmufq'].basis, { x: 0, y: 0, width: 1200, height: 220 });

  const changedEvents = originalCanvas.split(/\r?\n/).map((line) => {
    if (!line) return line;
    const event = JSON.parse(line);
    if (event.event === 'widget_added' && event.widget.id === 'markdown-szmufq') {
      event.widget.position = { x: 160, y: 140 };
      event.widget.bounds = { width: 1200, height: 220, startX: 160, startY: 140, endX: 1360, endY: 360 };
    }
    return JSON.stringify(event);
  }).join('\n');
  await writeFile(canvasPath, changedEvents);
  await page.waitForFunction(() => {
    const item = document.getElementById('markdown-szmufq');
    const rect = item?.getBoundingClientRect();
    return rect?.x === 160 && rect?.y === 140;
  }, null, { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
  await page.locator('#markdown-szmufq').waitFor();
  const stale = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  assert.deepEqual(stale.items['markdown-szmufq'].basis, { x: 0, y: 0, width: 1200, height: 220 });
  assert.equal(await markdown.evaluate((el) => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 160, 140)', 'changed source geometry supersedes stale local override');
  await page.getByRole('button', { name: 'Reset local layout' }).click();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), storageKey), null, 'reset clears only the document-local layout key');
  assert.deepEqual(externalRequests, [], 'browser journey has no external or private service requests');
  console.log('headless dev/HMR/frame, route state, theme, local image, unsupported diagnostics, drag override, changed source geometry, reset, and zero external requests passed');
} finally {
  await writeFile(prototypePath, originalPrototype);
  await writeFile(canvasPath, originalCanvas);
  await browser?.close();
  await server.close();
}
