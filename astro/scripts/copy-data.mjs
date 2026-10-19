// Copies the school data produced by ../build/build_data.py into the Astro site, adding each school's
// phone and email from ../build/contacts.json (made by build/fetch_contacts.py), so the yearly refresh keeps working.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(resolve(here, '../../build/data.json'), 'utf8'));
const contactsPath = resolve(here, '../../build/contacts.json');
const contacts = existsSync(contactsPath) ? JSON.parse(readFileSync(contactsPath, 'utf8')) : {};
for (const s of data.schools) {
  const c = contacts[s.dfe];
  if (c?.tel) s.tel = c.tel;
  if (c?.email) s.email = c.email;
}
const to = resolve(here, '../public/data.json');
mkdirSync(dirname(to), { recursive: true });
writeFileSync(to, JSON.stringify(data));
console.log(`Copied school data to public/data.json (${Object.keys(contacts).length ? 'with' : 'without'} contact details)`);
