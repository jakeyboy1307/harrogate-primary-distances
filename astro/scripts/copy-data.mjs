// Copies the school data produced by ../build/build_data.py and ../build/build_york.py into the Astro site as one
// file of schools per council, plus public/data/areas.json listing them. Each school is keyed by its national URN
// (council school codes clash between councils), is labelled with its council, and gets its phone and email from
// that council's contacts file (build/fetch_contacts.py).
// Catchment shapes are most of the data, so they go in separate files, one per district (one for York), each listed
// in areas.json with the box round its shapes. The checker downloads only the ones near the postcode searched
// (engine.ts loadCatchments). A shape keeps its number, so the schools' catchment numbers still point at it.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(resolve(here, p), 'utf8'));
const readIf = (p) => (existsSync(resolve(here, p)) ? read(p) : {});

// One entry per council, named as engine.ts's COUNCILS names them (the name postcodes.io gives the council). A new
// council's build writes the same shape of file as build_data.py; add it here.
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
  // each shape goes with the district of the first school that uses it (one file for a council without districts)
  const tiles = new Map();
  data.catch.forEach((c, i) => {
    const owner = data.schools.find((s) => s.cz?.includes(i));
    const key = owner?.district ? owner.district.toLowerCase().replace(/[^a-z]+/g, '-') : id;
    if (!tiles.has(key)) tiles.set(key, { c: [], box: [90, 180, -90, -180] });
    const t = tiles.get(key);
    t.c.push({ i, name: c.name, p: c.p });
    for (const poly of c.p) for (const [y, x] of poly[0]) t.box = [Math.min(t.box[0], y), Math.min(t.box[1], x), Math.max(t.box[2], y), Math.max(t.box[3], x)];
  });
  const shapes = [];
  for (const [key, t] of tiles) {
    const file = `${id}-catchments-${key}.json`;
    writeFileSync(`${out}/${file}`, JSON.stringify({ c: t.c }));
    shapes.push({ file, box: t.box.map((v) => +v.toFixed(4)) });
  }
  const catchCount = data.catch.length;
  delete data.catch;
  writeFileSync(`${out}/${id}.json`, JSON.stringify(data));
  areas.find((a) => a.id === id).shapes = { catchCount, catch: shapes };
}
writeFileSync(`${out}/areas.json`, JSON.stringify(areas.map(({ id, name, shapes }) => ({ id, name, file: `${id}.json`, ...shapes }))));
for (const a of areas)
  console.log(`Copied ${a.data.schools.length} ${a.name} schools to public/data/${a.id}.json (${Object.keys(a.contacts).length ? 'with' : 'without'} contact details)`);
