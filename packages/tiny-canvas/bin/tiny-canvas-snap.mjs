#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import {
  parseSnapshotFrames,
  rewriteSnapshotProps,
  scrollPageToElement,
  snapshotFrameName,
} from "../src/snapshot.js";
import { slugifyCanvasPageName } from "../src/pageRoute.js";

function parseArgs(argv) {
  const options = {
    targets: [],
    theme: "both",
    outputDirectory: "public/tiny-canvas/snapshots",
    write: true,
    newOnly: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--theme") options.theme = argv[++index];
    else if (argument.startsWith("--theme=")) {
      options.theme = argument.slice("--theme=".length);
    } else if (argument === "--output-dir") {
      options.outputDirectory = argv[++index];
    } else if (argument === "--base-url") options.baseUrl = argv[++index];
    else if (argument === "--new") options.newOnly = true;
    else if (argument === "--no-write") options.write = false;
    else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else options.targets.push(argument);
  }
  if (!["light", "dark", "both"].includes(options.theme)) {
    throw new Error('Theme must be "light", "dark", or "both".');
  }
  if (options.targets.length === 0) {
    throw new Error("Pass at least one JSX/TSX file or directory to capture.");
  }
  return options;
}

async function filesWithin(target) {
  const stat = await import("node:fs/promises").then(({ stat }) => stat(target));
  if (stat.isFile()) return [target];
  const entries = await readdir(target, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => filesWithin(path.join(target, entry.name)))
  );
  return nested
    .flat()
    .filter((file) => /\.[jt]sx$/u.test(file) && !/\.test\.[jt]sx$/u.test(file));
}

function availablePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findPort() {
  for (const port of [4173, 4174, 5173, 5174, 1234, 3000]) {
    if (await availablePort(port)) return port;
  }
  throw new Error("Unable to find a free local port.");
}

async function waitForServer(baseUrl) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60_000) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok || response.status === 404) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${baseUrl}.`);
}

async function startServer(root) {
  const port = await findPort();
  const child = spawn(
    "npm",
    [
      "run",
      "dev",
      "--",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] }
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const baseUrl = `http://127.0.0.1:${port}/`;
  try {
    await waitForServer(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`${error.message}\n${output}`);
  }
  return { baseUrl, close: () => child.kill("SIGTERM") };
}

function captureUrl(baseUrl, route) {
  return new URL(route, baseUrl).href;
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Executable doesn't exist")) throw error;

    for (const executablePath of [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ]) {
      if (!existsSync(executablePath)) continue;
      return chromium.launch({ executablePath, headless: true });
    }
    throw error;
  }
}

async function waitForCaptureReady(page) {
  await page.waitForFunction(
    () => {
      if (document.readyState !== "complete") return false;
      return ![...document.querySelectorAll('[aria-busy="true"], [data-loading="true"]')]
        .some((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        });
    },
    undefined,
    { timeout: 45_000 }
  );
  await page.waitForTimeout(500);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const outputDirectory = path.resolve(root, options.outputDirectory);
  const targets = (
    await Promise.all(
      options.targets.map((target) => filesWithin(path.resolve(root, target)))
    )
  ).flat();
  const server = options.baseUrl
    ? { baseUrl: options.baseUrl, close: () => {} }
    : await startServer(root);

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    server.close();
    throw new Error(
      "tiny-canvas-snap requires Playwright. Install it in the consuming project."
    );
  }

  let browser;
  const themes =
    options.theme === "both" ? ["light", "dark"] : [options.theme];
  try {
    browser = await launchBrowser(chromium);
    for (const file of targets) {
      const source = await readFile(file, "utf8");
      const frames = parseSnapshotFrames(source, file);
      if (frames.length === 0) continue;
      const boardSlug = slugifyCanvasPageName(
        path.basename(file, path.extname(file))
      );
      const boardDirectory = path.join(outputDirectory, boardSlug);
      await mkdir(boardDirectory, { recursive: true });

      for (const [index, frame] of frames.entries()) {
        const frameName = snapshotFrameName(frame, index);
        for (const theme of themes) {
          const filename = `${frameName}${theme === "dark" ? "-dark" : ""}.png`;
          const destination = path.join(boardDirectory, filename);
          if (options.newOnly && existsSync(destination)) continue;
          const page = await browser.newPage({
            viewport: { width: frame.width, height: frame.height },
            deviceScaleFactor: 2,
            colorScheme: theme,
          });
          await page.goto(captureUrl(server.baseUrl, frame.route), {
            waitUntil: "domcontentloaded",
            timeout: 120_000,
          });
          await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(
            () => {}
          );
          await waitForCaptureReady(page);
          if (frame.element) {
            await page.waitForFunction(
              (elementId) => Boolean(document.getElementById(elementId)),
              frame.element,
              { timeout: 30_000 }
            );
          }
          await scrollPageToElement(page, frame.element, frame.offset);
          await page.screenshot({
            path: destination,
            animations: "disabled",
            type: "png",
          });
          await page.close();
          console.log(`Saved ${destination}`);
        }
      }

      if (options.write) {
        await writeFile(
          file,
          rewriteSnapshotProps(source, frames, {
            outputDirectory,
            boardSlug,
          }),
          "utf8"
        );
        console.log(`Updated ${file}`);
      }
    }
  } finally {
    await browser?.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
