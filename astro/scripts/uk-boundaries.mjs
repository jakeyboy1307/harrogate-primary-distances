// Downloads the UK boundaries for the admin's coverage map (/admin/coverage/) and saves slimmed copies:
//   public/geo/uk-districts.json  every local authority district (December 2022), with the county it sits in, and
//                                 for England its region and, for metropolitan districts, its metropolitan county
//   public/geo/uk-counties.json   every county and unitary council (December 2024): the councils that run school
//                                 admissions, so each one is a separate data source for the checker
// Run it by hand when the boundaries need refreshing:  node scripts/uk-boundaries.mjs
// Source: ONS Open Geography Portal, ultra generalised (BUC) boundaries. December 2022 is the last set of districts
// with North Yorkshire's old districts (Harrogate, Selby...), which is how we describe our coverage.
// Contains OS data © Crown copyright and database right 2022 and 2024, Open Government Licence v3.0.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ONS = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services';
const query = (service, fields) => `${ONS}/${service}/FeatureServer/0/query?where=1%3D1&outFields=${fields}`
  + '&outSR=4326&geometryPrecision=3&resultRecordCount=2000&f=geojson';
const get = async (url, min) => {
  const geo = await fetch(url).then((r) => { if (!r.ok) throw new Error(`ONS returned ${r.status}`); return r.json(); });
  if (geo.features.length < min) throw new Error(`Only ${geo.features.length} boundaries came back`);
  return geo.features;
};

// [lng, lat] rings become [lat, lng], the order Leaflet and lib/engine.ts use; rings that collapse are dropped
const ring = (r) => {
  const out = [];
  for (const [x, y] of r) { const p = [y, x]; const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); }
  return out.length >= 4 ? out : null;
};
const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
  .map((poly) => poly.map(ring).filter(Boolean)).filter((poly) => poly.length);

const inRing = ([y, x], r) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [yi, xi] = r[i], [yj, xj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inShape = (pt, p) => p.some((poly) => inRing(pt, poly[0]) && !poly.slice(1).some((h) => inRing(pt, h)));

const [lads, ctys] = await Promise.all([
  get(query('Local_Authority_Districts_December_2022_UK_BUC_V2', 'LAD22CD,LAD22NM,LAT,LONG'), 370),
  get(query('Counties_and_Unitary_Authorities_December_2024_Boundaries_UK_BUC', 'CTYUA24CD,CTYUA24NM'), 210),
]);
// England's regions, and the metropolitan counties (West Yorkshire...), which the council boundaries above leave
// out because they no longer have councils; the map's popups name them so every district says where it is
const lookup = (service) => fetch(`${ONS}/${service}/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&resultRecordCount=2000&f=json`)
  .then((r) => r.json()).then((j) => new Map(j.features.map(({ attributes: a }) => [a.LAD22CD, a])));
const [rgn, mcty] = await Promise.all([lookup('LAD22_RGN22_EN_LU'), lookup('LAD22_CTY22_EN_LU')]);
if (rgn.size < 300) throw new Error(`Only ${rgn.size} districts came back from the region lookup`);

const counties = ctys
  .map((f) => ({ code: f.properties.CTYUA24CD, name: f.properties.CTYUA24NM, p: polys(f.geometry) }))
  .sort((a, b) => a.code.localeCompare(b.code));

// each district's county is the one holding its ONS label point (always inside the district)
const districts = lads.map((f) => {
  const pt = [f.properties.LAT, f.properties.LONG];
  const c = counties.find((x) => inShape(pt, x.p));
  const code = f.properties.LAD22CD, metro = mcty.get(code);
  return {
    code, name: f.properties.LAD22NM, county: c?.code ?? null,
    region: rgn.get(code)?.RGN22NM ?? null,
    metro: metro?.CTY22CD.startsWith('E11') ? metro.CTY22NM : null,
    pt, p: polys(f.geometry),
  };
}).sort((a, b) => a.code.localeCompare(b.code));
const lost = districts.filter((d) => !d.county).map((d) => d.name);
if (lost.length) console.warn(`No county found for: ${lost.join(', ')}`);

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/geo');
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, 'uk-districts.json'), JSON.stringify({ source: 'ONS Local Authority Districts (December 2022) UK BUC. Contains OS data © Crown copyright and database right 2022.', districts }));
writeFileSync(resolve(dir, 'uk-counties.json'), JSON.stringify({ source: 'ONS Counties and Unitary Authorities (December 2024) UK BUC. Contains OS data © Crown copyright and database right 2024.', counties }));
console.log(`Saved ${districts.length} districts and ${counties.length} counties to public/geo/`);
