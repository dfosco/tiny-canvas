import { parse } from "@babel/parser";
import path from "node:path";

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visit);
    } else if (value && typeof value === "object" && value.type) {
      walk(value, visit);
    }
  }
}

function staticExpressionValue(expression, constants) {
  if (!expression) return undefined;
  if (
    expression.type === "StringLiteral" ||
    expression.type === "NumericLiteral" ||
    expression.type === "BooleanLiteral"
  ) {
    return expression.value;
  }
  if (
    expression.type === "UnaryExpression" &&
    expression.operator === "-" &&
    expression.argument.type === "NumericLiteral"
  ) {
    return -expression.argument.value;
  }
  if (
    expression.type === "TemplateLiteral" &&
    expression.expressions.length === 0
  ) {
    return expression.quasis[0]?.value.cooked ?? "";
  }
  if (expression.type === "Identifier" && constants.has(expression.name)) {
    return constants.get(expression.name);
  }
  return undefined;
}

function attributeValue(attribute, constants) {
  if (!attribute) return undefined;
  if (!attribute.value) return true;
  if (attribute.value.type === "StringLiteral") return attribute.value.value;
  if (attribute.value.type === "JSXExpressionContainer") {
    return staticExpressionValue(attribute.value.expression, constants);
  }
  return undefined;
}

function frameAttribute(openingElement, name) {
  return openingElement.attributes.find(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === name
  );
}

function safeIdentifier(value) {
  return (
    String(value)
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "frame"
  );
}

export function parseSnapshotFrames(sourceText, filename = "source.jsx") {
  const ast = parse(sourceText, {
    sourceType: "module",
    sourceFilename: filename,
    plugins: ["jsx", "typescript"],
  });
  const constants = new Map();
  const frames = [];

  walk(ast.program, (node) => {
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "Identifier"
    ) {
      const value = staticExpressionValue(node.init, constants);
      if (value !== undefined) constants.set(node.id.name, value);
    }
  });

  walk(ast.program, (node) => {
    if (
      node.type !== "JSXElement" ||
      node.openingElement.name.type !== "JSXIdentifier" ||
      node.openingElement.name.name !== "Frame"
    ) {
      return;
    }

    const opening = node.openingElement;
    const route = attributeValue(frameAttribute(opening, "route"), constants);
    if (typeof route !== "string" || !route.trim()) {
      throw new Error(
        `${filename}: Frame route must be a static string or local constant for snapshot capture.`
      );
    }

    const read = (name) =>
      attributeValue(frameAttribute(opening, name), constants);
    const id = read("id");
    const title = read("title");
    const width = Number(read("width") ?? 1180);
    const height = Number(read("height") ?? 700);
    const offset = Number(read("offset") ?? 0);
    const element = read("element");
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`${filename}: Frame width and height must be static numbers.`);
    }
    if (!Number.isFinite(offset)) {
      throw new Error(`${filename}: Frame offset must be a static number.`);
    }

    frames.push({
      id: typeof id === "string" ? id : null,
      title: typeof title === "string" ? title : `Frame ${frames.length + 1}`,
      route,
      width,
      height,
      element: typeof element === "string" ? element : null,
      offset,
      hasSnapshot: Boolean(frameAttribute(opening, "snapshot")),
      hasSnapshotDark: Boolean(frameAttribute(opening, "snapshotDark")),
      start: opening.start,
      end: opening.end,
      indent: " ".repeat(opening.loc?.start.column ?? 0),
    });
  });

  return frames;
}

export function snapshotFrameName(frame, index) {
  return safeIdentifier(frame.id || `${frame.title}-${index + 1}`);
}

export function snapshotPublicUrl(outputDirectory, boardSlug, filename) {
  const normalized = outputDirectory.split(path.sep).join("/");
  const publicIndex = normalized.lastIndexOf("/public/");
  const publicRoot =
    publicIndex >= 0
      ? normalized.slice(publicIndex + "/public".length)
      : `/${path.basename(normalized)}`;
  return `${publicRoot}/${boardSlug}/${filename}`.replace(/\/+/g, "/");
}

export function rewriteSnapshotProps(
  sourceText,
  frames,
  { outputDirectory, boardSlug }
) {
  let result = sourceText;
  const edits = frames
    .map((frame, index) => ({ frame, index }))
    .filter(({ frame }) => !frame.hasSnapshot || !frame.hasSnapshotDark)
    .sort((left, right) => right.frame.end - left.frame.end);

  for (const { frame, index } of edits) {
    const frameName = snapshotFrameName(frame, index);
    const lightUrl = snapshotPublicUrl(
      outputDirectory,
      boardSlug,
      `${frameName}.png`
    );
    const darkUrl = snapshotPublicUrl(
      outputDirectory,
      boardSlug,
      `${frameName}-dark.png`
    );
    const opening = result.slice(frame.start, frame.end);
    const closeIndex = opening.lastIndexOf("/>");
    if (closeIndex < 0) {
      throw new Error("Snapshot rewriting requires self-closing Frame elements.");
    }
    const lineIndent = frame.indent;
    const propIndent = `${lineIndent}  `;
    const props = [
      frame.hasSnapshot ? null : `snapshot="${lightUrl}"`,
      frame.hasSnapshotDark ? null : `snapshotDark="${darkUrl}"`,
      frame.hasSnapshot ? null : 'loadStrategy="interaction"',
    ]
      .filter(Boolean)
      .map((property) => `${propIndent}${property}`)
      .join("\n");
    const beforeClose = opening.slice(0, closeIndex).trimEnd();
    result =
      result.slice(0, frame.start) +
      `${beforeClose}\n${props}\n${lineIndent}/>` +
      result.slice(frame.end);
  }

  return result;
}

export async function scrollPageToElement(page, element, offset = 0) {
  if (!element) return;
  const scrolled = await page.evaluate(
    async ({ elementId, scrollOffset }) => {
      const target = document.getElementById(elementId);
      if (!target) return false;
      const startTop = window.scrollY;
      const targetTop = Math.max(
        0,
        target.getBoundingClientRect().top + startTop - 24 + scrollOffset
      );
      const distance = targetTop - startTop;
      if (Math.abs(distance) < 1) {
        window.scrollTo({ top: targetTop });
        return true;
      }
      const startedAt = performance.now();
      await new Promise((resolve) => {
        const step = (currentTime) => {
          const progress = Math.min((currentTime - startedAt) / 900, 1);
          const eased =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          window.scrollTo({ top: startTop + distance * eased });
          if (progress < 1) window.requestAnimationFrame(step);
          else resolve();
        };
        window.requestAnimationFrame(step);
      });
      return true;
    },
    { elementId: element, scrollOffset: offset }
  );
  if (!scrolled) {
    throw new Error(`Snapshot scroll element "${element}" was not found.`);
  }
}
