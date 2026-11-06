// Copies the school data produced by ../build/build_data.py into the Astro site as one file per council,
// plus public/data/areas.json listing them. Each school is keyed by its national URN (council school codes
// clash between councils), and gets its phone and email from ../build/contacts.json (build/fetch_contacts.py).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(resolve(here, p), 'utf8'));
const contactsPath = resolve(here, '../../build/contacts.json');
const contacts = existsSync(contactsPath) ? read('../../build/contacts.json') : {};

// One entry per council. North Yorkshire holds the Harrogate district for now.
const areas = [
  { id: 'north-yorkshire', name: 'North Yorkshire', data: read('../../build/data.json') },
];

const out = resolve(here, '../public/data');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const { id, data } of areas) {
  for (const s of data.schools) {
    const c = contacts[s.dfe];
    if (c?.tel) s.tel = c.tel;
    if (c?.email) s.email = c.email;
    s.urn = +(s.urn ?? s.of?.urn);
    if (!s.urn) throw new Error(`${s.name} has no URN`);
    delete s.dfe;
  }
  writeFileSync(`${out}/${id}.json`, JSON.stringify(data));
}
writeFileSync(`${out}/areas.json`, JSON.stringify(areas.map(({ id, name }) => ({ id, name, file: `${id}.json` }))));
const count = areas.reduce((n, a) => n + a.data.schools.length, 0);
console.log(`Copied ${count} schools in ${areas.length} area file(s) to public/data/ (${Object.keys(contacts).length ? 'with' : 'without'} contact details)`);
