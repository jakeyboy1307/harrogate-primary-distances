// Counts the state primary schools that take Reception in every district of England, for the admin's coverage
// map (/admin/coverage/), so we can see how big each place we haven't covered yet is. Saves
// public/geo/district-schools.json. Run it by hand a few times a year:  node scripts/district-schools.mjs
// It needs public/geo/uk-districts.json (scripts/uk-boundaries.mjs).
// Source: Get Information About Schools (DfE), the daily all-establishments file. Counted: open schools that are
// council-run, academies or free schools, primary or all-through, taking children from age 5 or under (so not
// junior schools), and not special or alternative provision. Each school goes in the December 2022 district its
// grid reference falls in, so North Yorkshire's old districts get their own counts. England only: Scotland, Wales
// and Northern Ireland aren't in it.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const geo = resolve(dirname(fileURLToPath(import.meta.url)), '../public/geo');
const { districts } = JSON.parse(readFileSync(resolve(geo, 'uk-districts.json'), 'utf8'));

// ---------- the file: today's, or the latest of the last week ----------
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
let text = null, date = null;
for (let i = 0; i < 7 && !text; i++) {
  const d = new Date(Date.now() - i * 864e5);
  const r = await fetch(`https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata${ymd(d)}.csv`);
  if (r.ok) { text = new TextDecoder('windows-1252').decode(await r.arrayBuffer()); date = d.toISOString().slice(0, 10); }
}
if (!text) throw new Error('Couldn’t download the GIAS file for any of the last 7 days');

// ---------- a small CSV reader (quoted fields, commas and new lines inside quotes) ----------
function* rows(s) {
  let row = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(f); yield row; row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); yield row; }
}

// ---------- British National Grid to latitude and longitude (OSGB36 to WGS84 by Helmert, a few metres out) ----------
function toLatLng(E, N) {
  const a = 6377563.396, b = 6356256.909, F0 = 0.9996012717, lat0 = 49 * Math.PI / 180, lon0 = -2 * Math.PI / 180;
  const N0 = -100000, E0 = 400000, e2 = 1 - (b * b) / (a * a), n = (a - b) / (a + b);
  let lat = lat0, M = 0;
  do {
    lat = (N - N0 - M) / (a * F0) + lat;
    const Ma = (1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * (lat - lat0);
    const Mb = (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
    const Mc = ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0));
    const Md = (35 / 24) * n ** 3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0));
    M = b * F0 * (Ma - Mb + Mc - Md);
  } while (N - N0 - M >= 0.00001);
  const s = Math.sin(lat), c = Math.cos(lat), t = Math.tan(lat);
  const nu = a * F0 / Math.sqrt(1 - e2 * s * s), rho = a * F0 * (1 - e2) / (1 - e2 * s * s) ** 1.5, eta2 = nu / rho - 1;
  const VII = t / (2 * rho * nu), VIII = t / (24 * rho * nu ** 3) * (5 + 3 * t * t + eta2 - 9 * t * t * eta2);
  const IX = t / (720 * rho * nu ** 5) * (61 + 90 * t * t + 45 * t ** 4), X = 1 / (c * nu);
  const XI = 1 / (c * 6 * nu ** 3) * (nu / rho + 2 * t * t), XII = 1 / (c * 120 * nu ** 5) * (5 + 28 * t * t + 24 * t ** 4);
  const XIIA = 1 / (c * 5040 * nu ** 7) * (61 + 662 * t * t + 1320 * t ** 4 + 720 * t ** 6), dE = E - E0;
  const phi = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6;
  const lam = lon0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7;
  // OSGB36 to WGS84
  const toXYZ = (la, lo, A, B) => { const E2 = 1 - (B * B) / (A * A), v = A / Math.sqrt(1 - E2 * Math.sin(la) ** 2);
    return [v * Math.cos(la) * Math.cos(lo), v * Math.cos(la) * Math.sin(lo), v * (1 - E2) * Math.sin(la)]; };
  const [x1, y1, z1] = toXYZ(phi, lam, a, b);
  const tx = 446.448, ty = -125.157, tz = 542.06, sc = -20.4894e-6;
  const rx = (0.1502 / 3600) * Math.PI / 180, ry = (0.247 / 3600) * Math.PI / 180, rz = (0.8421 / 3600) * Math.PI / 180;
  const x2 = tx + (1 + sc) * x1 - rz * y1 + ry * z1, y2 = ty + rz * x1 + (1 + sc) * y1 - rx * z1, z2 = tz - ry * x1 + rx * y1 + (1 + sc) * z1;
  const A2 = 6378137, B2 = 6356752.3142, E22 = 1 - (B2 * B2) / (A2 * A2), p = Math.hypot(x2, y2);
  let la = Math.atan2(z2, p * (1 - E22)), prev;
  do { prev = la; const v = A2 / Math.sqrt(1 - E22 * Math.sin(la) ** 2); la = Math.atan2(z2 + E22 * v * Math.sin(la), p); } while (Math.abs(la - prev) > 1e-12);
  return [la * 180 / Math.PI, Math.atan2(y2, x2) * 180 / Math.PI];
}

// ---------- which district a point is in ----------
const inRing = ([y, x], r) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [yi, xi] = r[i], [yj, xj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
for (const d of districts) {
  let a = 90, b = 180, c = -90, e = -180;
  for (const poly of d.p) for (const [y, x] of poly[0]) { a = Math.min(a, y); b = Math.min(b, x); c = Math.max(c, y); e = Math.max(e, x); }
  d.box = [a, b, c, e];
}
const districtAt = (pt) => districts.find((d) => pt[0] >= d.box[0] && pt[0] <= d.box[2] && pt[1] >= d.box[1] && pt[1] <= d.box[3]
  && d.p.some((poly) => inRing(pt, poly[0]) && !poly.slice(1).some((h) => inRing(pt, h))));

// ---------- count ----------
const it = rows(text);
const head = it.next().value;
const col = (name) => { const i = head.indexOf(name); if (i < 0) throw new Error(`No ${name} column`); return i; };
const C = {
  status: col('EstablishmentStatus (name)'), group: col('EstablishmentTypeGroup (name)'), type: col('TypeOfEstablishment (name)'),
  phase: col('PhaseOfEducation (name)'), low: col('StatutoryLowAge'), pupils: col('NumberOfPupils'), E: col('Easting'), N: col('Northing'),
};
const counts = {};
let kept = 0, placed = 0;
for (const r of it) {
  if (r.length < head.length) continue;
  if (!r[C.status].startsWith('Open')) continue;
  if (!['Local authority maintained schools', 'Academies', 'Free Schools'].includes(r[C.group])) continue;
  if (!['Primary', 'All-through'].includes(r[C.phase])) continue;
  if (/special|alternative provision/i.test(r[C.type])) continue;
  if (!(Number(r[C.low]) <= 5)) continue;
  kept++;
  const E = Number(r[C.E]), N = Number(r[C.N]);
  if (!E || !N) continue;
  const d = districtAt(toLatLng(E, N));
  if (!d) continue;
  placed++;
  const c = (counts[d.code] ??= [0, 0]);
  c[0] += 1; c[1] += Number(r[C.pupils]) || 0;
}
writeFileSync(resolve(geo, 'district-schools.json'), JSON.stringify({
  source: `Get Information About Schools (DfE), ${date}. Open state primary and all-through schools taking Reception; pupils is every pupil on roll.`,
  date, districts: counts,   // district code: [schools, pupils]
}));
console.log(`${kept} schools counted, ${placed} placed in ${Object.keys(counts).length} districts (${date})`);
