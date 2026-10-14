/**
 * Bundle the versioned public Canvas schemas from the repository source of truth.
 * This runs after the Tiny Canvas Vite build and before npm pack.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repositoryRoot, 'schemas');
const destination = join(repositoryRoot, 'packages', 'tiny-canvas', 'schemas');

mkdirSync(destination, { recursive: true });
const schemas = readdirSync(source).filter((name) => /^canvas-[a-z-]+\.v\d+\.schema\.json$/.test(name));
if (schemas.length < 3) {
  throw new Error('Missing canonical Tiny Canvas public schemas');
}
for (const name of schemas) {
  const original = join(source, name);
  const json = JSON.parse(readFileSync(original, 'utf8'));
  if (json.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    throw new Error('Unexpected JSON Schema dialect: ' + name);
  }
  copyFileSync(original, join(destination, name));
}
console.log('Bundled ' + schemas.length + ' portable canvas schemas.');
