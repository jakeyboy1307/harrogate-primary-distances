// Downloads the outline of every UK local authority district for the admin's coverage map (/admin/coverage/) and
// saves a slimmed copy to public/geo/uk-districts.json. Run it by hand when the boundaries need refreshing:
//   node scripts/uk-districts.mjs
// Source: ONS Open Geography Portal, Local Authority Districts (December 2022), ultra generalised (BUC). December
// 2022 is the last set with North Yorkshire's old districts (Harrogate, Selby...), which is how we describe our
// coverage. Contains OS data © Crown copyright and database right 2022, Open Government Licence v3.0.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Local_Authority_Districts_December_2022_UK_BUC_V2/FeatureServer/0/query'
  + '?where=1%3D1&outFields=LAD22CD,LAD22NM&outSR=4326&geometryPrecision=3&resultRecordCount=2000&f=geojson';

const geo = await fetch(SRC).then((r) => { if (!r.ok) throw new Error(`ONS returned ${r.status}`); return r.json(); });
if (geo.features.length < 370) throw new Error(`Only ${geo.features.length} districts came back`);

// [lng, lat] rings become [lat, lng], the order Leaflet and lib/engine.ts use; rings that collapse are dropped
const ring = (r) => {
  const out = [];
  for (const [x, y] of r) { const p = [y, x]; const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); }
  return out.length >= 4 ? out : null;
};
const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
  .map((poly) => poly.map(ring).filter(Boolean)).filter((poly) => poly.length);

const districts = geo.features
  .map((f) => ({ code: f.properties.LAD22CD, name: f.properties.LAD22NM, p: polys(f.geometry) }))
  .sort((a, b) => a.code.localeCompare(b.code));

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/geo/uk-districts.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ source: 'ONS Local Authority Districts (December 2022) UK BUC. Contains OS data © Crown copyright and database right 2022.', districts }));
console.log(`Saved ${districts.length} districts to public/geo/uk-districts.json`);
