import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { access, cp, mkdtemp, readFile, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const projectRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const temporaryRoot = await mkdtemp(join(tmpdir(), 'tiny-canvas-ordinary-proof-'));
const movedCheckout = join(temporaryRoot, 'moved-consumer');
const movedOutputRoot = join(temporaryRoot, 'moved-output');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function run(command, args, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' },
      stdio: 'inherit',
    });
    child.once('error', rejectRun);
    child.once('exit', (code) => code === 0
      ? resolveRun()
      : rejectRun(new Error(`${command} ${args.join(' ')} exited ${code}`)));
  });
}

async function serve(buildRoot, base) {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const server = createHttpServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://proof.invalid').pathname);
      if (!pathname.startsWith(normalizedBase)) {
        response.writeHead(404).end('outside configured base');
        return;
      }
      const relativePath = pathname.slice(normalizedBase.length);
      let target = resolve(buildRoot, relativePath);
      if (!target.startsWith(`${resolve(buildRoot)}${sep}`) && target !== resolve(buildRoot)) {
        response.writeHead(400).end('invalid path');
        return;
      }
      try {
        const details = await stat(target);
        if (details.isDirectory()) target = join(target, 'index.html');
      } catch {
        target = join(buildRoot, 'index.html');
      }
      const bytes = await readFile(target);
      response.writeHead(200, { 'content-type': contentTypes[extname(target)] || 'application/octet-stream' });
      response.end(bytes);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

async function smokeBuild(browser, buildRoot, base, name) {
  const web = await serve(buildRoot, base);
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();
    const externalRequests = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(web.origin)) externalRequests.push(request.url());
    });
    await page.goto(`${web.origin}${base}canvas/chrome-components?moved=${name}#canvas-state`, { waitUntil: 'networkidle' });
    await page.getByText('Canvas document diagnostics').waitFor();
    assert.equal(new URL(page.url()).search, `?moved=${name}`);
    assert.equal(new URL(page.url()).hash, '#canvas-state');
    const image = page.locator('#image-fqj3ky img');
    await image.evaluate((element) => element.decode());
    assert.ok((await image.getAttribute('src')).startsWith(`${base}assets/`));

    const frame = page.frameLocator('#prototype-tzc6sd iframe');
    await frame.getByText('Make room for the work.').waitFor();
    const frameUrl = await page.locator('#prototype-tzc6sd iframe').evaluate((element) => element.contentWindow.location.href);
    assert.ok(frameUrl.startsWith(`${web.origin}${base}chrome-overview`), `${name} Frame route carries its deployment base`);
    await frame.getByRole('link', { name: 'Explore page details' }).click();
    await page.waitForFunction(() => document.querySelector('#prototype-tzc6sd iframe')
      ?.contentWindow?.location.href.includes('?view=details#overview'));
    assert.match(page.url(), new RegExp(`\\?moved=${name}#canvas-state$`));
    await page.locator('.tc-canvas-document-board').evaluate((element) => { element.scrollTop = 0; element.scrollLeft = 0; });
    const markdown = page.locator('#markdown-szmufq');
    const box = await markdown.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + 40, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 75, box.y + 65, { steps: 4 });
    await page.mouse.up();
    const storageKey = 'tiny-canvas:canvas-document-layout:v1:%2Fcanvas%2Fchrome-components';
    await page.waitForFunction((key) => {
      const profile = JSON.parse(localStorage.getItem(key) || '{}');
      return Boolean(profile.items?.['markdown-szmufq']);
    }, storageKey);
    const profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
    const savedGeometry = profile.items['markdown-szmufq'].geometry;
    await page.reload({ waitUntil: 'networkidle' });
    const restoredGeometry = await page.locator('#markdown-szmufq').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });
    assert.deepEqual(restoredGeometry, { x: savedGeometry.x, y: savedGeometry.y }, `${name} browser-local layout survives reload`);
    await page.goto(`${web.origin}${base}canvas/button-patterns`, { waitUntil: 'networkidle' });
    await page.getByText('Canvas document diagnostics').waitFor();
    await page.getByText('missing_jsx_companion').first().waitFor();
    const missingReference = page.frameLocator('iframe.tc-frame-document');
    await missingReference.getByText('Button Patterns prototype has unresolved source requirements').waitFor();
    assert.deepEqual(externalRequests, [], `${name} output makes no external/private requests`);
    await context.close();
    console.log(`${name}: moved static output, Chrome Overview Frame route, query/hash, image, local layout restore, canonical Button Patterns diagnostics and no external requests passed`);
  } finally {
    await web.close();
  }
}

try {
  await cp(projectRoot, movedCheckout, {
    recursive: true,
    filter: (source) => {
      const path = relative(projectRoot, source);
      return !path.split(sep).some((part) => part === 'node_modules' || part.startsWith('dist-') || part === 'dist');
    },
  });
  await run('npm', ['ci'], movedCheckout);
  const archiveSpecs = [
    ['vendor/dfosco-hypercanvas-0.70.0-beta.0.tgz', 'f2d9d9da5b348bb88d432d42aedbd357ad9db26d61242dac27cddee4ac04eada'],
    ['vendor/dfosco-tiny-canvas-5.5.0.tgz', '60ee26159a26b2281ab1b60e367de948c1ad14c9d130d64cd902395d6d88c5d0'],
  ];
  for (const [archive, expectedHash] of archiveSpecs) {
    const bytes = await readFile(join(movedCheckout, archive));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash, `${archive} hash`);
  }
  const bases = [
    ['root', '/'],
    ['subpath', '/consumer-preview/'],
    ['branch', '/branch--demo/'],
  ];
  for (const [name, base] of bases) {
    await run('npm', ['run', 'build', '--', `--base=${base}`, `--outDir=dist-${name}`], movedCheckout);
    const output = join(movedCheckout, `dist-${name}`);
    await access(join(output, 'index.html'));
    const movedOutput = join(movedOutputRoot, name);
    await cp(output, movedOutput, { recursive: true });
  }
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_EXECUTABLE_PATH ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : {}),
  });
  try {
    for (const [name, base] of bases) {
      await smokeBuild(browser, join(movedOutputRoot, name), base, name);
    }
  } finally {
    await browser.close();
  }
  console.log('fresh npm ci, actual moved checkout build, three deployment bases and relocated static outputs passed');
} finally {
  // Test output lives only in the OS temporary directory.
  await import('node:fs/promises').then(({ rm }) => rm(temporaryRoot, { recursive: true, force: true }));
}
