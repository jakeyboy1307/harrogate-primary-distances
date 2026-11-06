// Copies the school data produced by ../build/build_data.py and ../build/build_york.py into the Astro site as one
// file per council, plus public/data/areas.json listing them. Each school is keyed by its national URN (council
// school codes clash between councils), is labelled with its council, and gets its phone and email from that
// council's contacts file (build/fetch_contacts.py).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(resolve(here, p), 'utf8'));
const readIf = (p) => (existsSync(resolve(here, p)) ? read(p) : {});

// One entry per council, named as engine.ts's COUNCILS names them. North Yorkshire holds the Harrogate district
// and the schools near York.
const areas = [
  { id: 'north-yorkshire', name: 'North Yorkshire', data: read('../../build/data.json'), contacts: readIf('../../build/contacts.json') },
  { id: 'york', name: 'York', data: read('../../build/york.json'), contacts: readIf('../../build/york-contacts.json') },
];

const out = resolve(here, '../public/data');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const { id, name, data, contacts } of areas) {
  for (const s of data.schools) {
    s.council = name;
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
for (const a of areas)
  console.log(`Copied ${a.data.schools.length} ${a.name} schools to public/data/${a.id}.json (${Object.keys(a.contacts).length ? 'with' : 'without'} contact details)`);
