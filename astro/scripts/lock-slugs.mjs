// Adds each new school page's address to src/lib/slugs.json, so it never changes once Google has it. Run it after
// `npm run build` whenever schools are added. It only adds: an address already in the file is never changed.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'src/lib/slugs.json'), dir = resolve(root, 'dist/schools');
if (!existsSync(dir)) throw new Error('Build the site first (npm run build)');
const lock = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
let added = 0;
for (const slug of readdirSync(dir)) {
  const urn = /data-urn="(\d+)"/.exec(readFileSync(resolve(dir, slug, 'index.html'), 'utf8'))?.[1];
  if (!urn) throw new Error(`No URN on schools/${slug}/`);
  if (!lock[urn]) { lock[urn] = slug; added++; }
  else if (lock[urn] !== slug) throw new Error(`schools/${slug}/ is URN ${urn}, which is locked to ${lock[urn]}`);
}
const sorted = Object.fromEntries(Object.entries(lock).sort((a, b) => a[1].localeCompare(b[1])));
writeFileSync(file, JSON.stringify(sorted, null, 1) + '\n');
console.log(`${added} added, ${Object.keys(sorted).length} school page addresses locked`);
