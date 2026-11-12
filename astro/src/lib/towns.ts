// The town pages (/knaresborough-primary-schools/ and the like): one for each town, village or suburb parents search
// by name ("primary schools in Knaresborough", "best primary schools in Ripon"), where the area pages are named for a
// district or constituency. Each lists the schools in the town and the nearest in the villages or streets around it,
// with the same figures as the area pages. Towns that already head an area page (Harrogate, Wetherby, Keighley...)
// aren't here: their area page is the answer. Centres are each place's own point from postcodes.io (November 2026).
import { haversine, MI } from './engine';
import { loadAll, type AreaSchool } from './areas';
import { AREA_INFO, areaOf, type Area } from './specs';

export interface Town {
  name: string;
  of?: string;                              // the city a suburb belongs to, for titles: "Roundhay, Leeds"
  kind: 'town' | 'village' | 'suburb';
  ll: [number, number];
}
export const TOWNS: Town[] = [
  { name: 'Knaresborough', kind: 'town', ll: [54.0074, -1.4646] },
  { name: 'Ripon', kind: 'town', ll: [54.136, -1.5234] },
  { name: 'Boroughbridge', kind: 'town', ll: [54.0942, -1.3955] },
  { name: 'Pateley Bridge', kind: 'town', ll: [54.0864, -1.7586] },
  { name: 'Masham', kind: 'town', ll: [54.2227, -1.6568] },
  { name: 'Pannal', kind: 'village', ll: [53.9604, -1.5356] },
  { name: 'Killinghall', kind: 'village', ll: [54.0234, -1.5646] },
  { name: 'Thirsk', kind: 'town', ll: [54.2325, -1.3429] },
  { name: 'Bedale', kind: 'town', ll: [54.2881, -1.5915] },
  { name: 'Easingwold', kind: 'town', ll: [54.1201, -1.1944] },
  { name: 'Stokesley', kind: 'village', ll: [54.4703, -1.1911] },
  { name: 'Great Ayton', kind: 'village', ll: [54.4885, -1.1322] },
  { name: 'Whitby', kind: 'town', ll: [54.4851, -0.6171] },
  { name: 'Filey', kind: 'town', ll: [54.2101, -0.2913] },
  { name: 'Pickering', kind: 'town', ll: [54.2462, -0.7788] },
  { name: 'Kirkbymoorside', kind: 'town', ll: [54.2695, -0.9312] },
  { name: 'Helmsley', kind: 'town', ll: [54.2466, -1.0612] },
  { name: 'Tadcaster', kind: 'town', ll: [53.8847, -1.264] },
  { name: 'Sherburn in Elmet', kind: 'village', ll: [53.7976, -1.2519] },
  { name: 'Settle', kind: 'town', ll: [54.0674, -2.2775] },
  { name: 'High Bentham', kind: 'town', ll: [54.118, -2.5101] },
  { name: 'Leyburn', kind: 'town', ll: [54.3092, -1.8277] },
  { name: 'Catterick Garrison', kind: 'village', ll: [54.376, -1.7221] },
  { name: 'Acomb', of: 'York', kind: 'suburb', ll: [53.9555, -1.1265] },
  { name: 'Haxby', kind: 'town', ll: [54.016, -1.072] },
  { name: 'Fulford', of: 'York', kind: 'suburb', ll: [53.9275, -1.0717] },
  { name: 'Huntington', kind: 'village', ll: [53.9947, -1.0591] },
  { name: 'Dringhouses', of: 'York', kind: 'suburb', ll: [53.9407, -1.1097] },
  { name: 'Bishopthorpe', kind: 'village', ll: [53.9211, -1.1002] },
  { name: 'Copmanthorpe', kind: 'village', ll: [53.9152, -1.1416] },
  { name: 'Driffield', kind: 'town', ll: [54.0057, -0.4401] },
  { name: 'Hornsea', kind: 'town', ll: [53.9122, -0.1671] },
  { name: 'Pocklington', kind: 'town', ll: [53.9311, -0.7778] },
  { name: 'Howden', kind: 'town', ll: [53.7458, -0.8678] },
  { name: 'Withernsea', kind: 'town', ll: [53.7314, 0.0314] },
  { name: 'Hedon', kind: 'town', ll: [53.7395, -0.1988] },
  { name: 'Hessle', kind: 'town', ll: [53.7231, -0.4355] },
  { name: 'Market Weighton', kind: 'town', ll: [53.865, -0.6683] },
  { name: 'Willerby', kind: 'village', ll: [53.7574, -0.4468] },
  { name: 'Anlaby', kind: 'village', ll: [53.7451, -0.4322] },
  { name: 'Guisborough', kind: 'town', ll: [54.5358, -1.051] },
  { name: 'Saltburn', kind: 'town', ll: [54.5824, -0.9735] },
  { name: 'Marske', kind: 'town', ll: [54.592, -1.0195] },
  { name: 'Acklam', of: 'Middlesbrough', kind: 'suburb', ll: [54.5429, -1.2543] },
  { name: 'Nunthorpe', of: 'Middlesbrough', kind: 'suburb', ll: [54.5218, -1.1744] },
  { name: 'Linthorpe', of: 'Middlesbrough', kind: 'suburb', ll: [54.5552, -1.2469] },
  { name: 'Brighouse', kind: 'town', ll: [53.7023, -1.7849] },
  { name: 'Elland', kind: 'town', ll: [53.6847, -1.8366] },
  { name: 'Todmorden', kind: 'town', ll: [53.7137, -2.0978] },
  { name: 'Hebden Bridge', kind: 'town', ll: [53.7411, -2.0138] },
  { name: 'Sowerby Bridge', kind: 'town', ll: [53.7053, -1.9374] },
  { name: 'Holmfirth', kind: 'town', ll: [53.5702, -1.7876] },
  { name: 'Batley', kind: 'town', ll: [53.7144, -1.6337] },
  { name: 'Mirfield', kind: 'town', ll: [53.6743, -1.6961] },
  { name: 'Cleckheaton', kind: 'town', ll: [53.7234, -1.7136] },
  { name: 'Heckmondwike', kind: 'town', ll: [53.7071, -1.6744] },
  { name: 'Birstall', kind: 'suburb', ll: [53.736, -1.6642] },
  { name: 'Marsden', kind: 'village', ll: [53.6001, -1.9288] },
  { name: 'Meltham', kind: 'town', ll: [53.5918, -1.8506] },
  { name: 'Kirkburton', kind: 'village', ll: [53.6103, -1.7028] },
  { name: 'Lindley', of: 'Huddersfield', kind: 'suburb', ll: [53.6587, -1.8217] },
  { name: 'Almondbury', of: 'Huddersfield', kind: 'suburb', ll: [53.6354, -1.7484] },
  { name: 'Otley', kind: 'town', ll: [53.9057, -1.6944] },
  { name: 'Guiseley', kind: 'town', ll: [53.8742, -1.7129] },
  { name: 'Yeadon', kind: 'town', ll: [53.8661, -1.685] },
  { name: 'Garforth', kind: 'town', ll: [53.7921, -1.3883] },
  { name: 'Rothwell', kind: 'town', ll: [53.7484, -1.4765] },
  { name: 'Boston Spa', kind: 'village', ll: [53.9047, -1.3462] },
  { name: 'Kippax', kind: 'village', ll: [53.7669, -1.3709] },
  { name: 'Roundhay', of: 'Leeds', kind: 'suburb', ll: [53.8331, -1.4964] },
  { name: 'Chapel Allerton', of: 'Leeds', kind: 'suburb', ll: [53.8335, -1.5428] },
  { name: 'Alwoodley', of: 'Leeds', kind: 'suburb', ll: [53.8517, -1.5409] },
  { name: 'Moortown', of: 'Leeds', kind: 'suburb', ll: [53.8424, -1.5363] },
  { name: 'Adel', of: 'Leeds', kind: 'suburb', ll: [53.8539, -1.5902] },
  { name: 'Meanwood', of: 'Leeds', kind: 'suburb', ll: [53.8325, -1.5611] },
  { name: 'Farsley', of: 'Leeds', kind: 'suburb', ll: [53.8124, -1.6715] },
  { name: 'Bramley', of: 'Leeds', kind: 'suburb', ll: [53.8088, -1.6323] },
  { name: 'Cross Gates', of: 'Leeds', kind: 'suburb', ll: [53.8084, -1.4597] },
  { name: 'Beeston', of: 'Leeds', kind: 'suburb', ll: [53.7702, -1.572] },
  { name: 'Middleton', of: 'Leeds', kind: 'suburb', ll: [53.7513, -1.541] },
  { name: 'Armley', of: 'Leeds', kind: 'suburb', ll: [53.7994, -1.5846] },
  { name: 'Harehills', of: 'Leeds', kind: 'suburb', ll: [53.8098, -1.5101] },
  { name: 'Rawdon', kind: 'village', ll: [53.853, -1.6848] },
  { name: 'Ilkley', kind: 'town', ll: [53.9245, -1.8231] },
  { name: 'Bingley', kind: 'town', ll: [53.8466, -1.8365] },
  { name: 'Baildon', kind: 'town', ll: [53.8534, -1.7663] },
  { name: 'Silsden', kind: 'town', ll: [53.9147, -1.938] },
  { name: 'Haworth', kind: 'village', ll: [53.8315, -1.956] },
  { name: 'Queensbury', kind: 'village', ll: [53.7682, -1.8472] },
  { name: 'Thornton', kind: 'village', ll: [53.7904, -1.852] },
  { name: 'Idle', of: 'Bradford', kind: 'suburb', ll: [53.8348, -1.7295] },
  { name: 'Wibsey', of: 'Bradford', kind: 'suburb', ll: [53.7666, -1.777] },
  { name: 'Clayton', of: 'Bradford', kind: 'suburb', ll: [53.7821, -1.819] },
  { name: 'Menston', kind: 'village', ll: [53.8913, -1.7458] },
  { name: 'Castleford', kind: 'town', ll: [53.7258, -1.3535] },
  { name: 'Normanton', kind: 'town', ll: [53.6998, -1.4155] },
  { name: 'Knottingley', kind: 'town', ll: [53.7097, -1.2443] },
  { name: 'Horbury', kind: 'town', ll: [53.661, -1.5552] },
  { name: 'Featherstone', kind: 'town', ll: [53.6746, -1.3592] },
  { name: 'South Elmsall', kind: 'town', ll: [53.5944, -1.2883] },
  { name: 'Sandal', of: 'Wakefield', kind: 'suburb', ll: [53.6602, -1.4869] },
  { name: 'Outwood', of: 'Wakefield', kind: 'suburb', ll: [53.7113, -1.498] },
  { name: 'Crigglestone', kind: 'village', ll: [53.6413, -1.5321] },
  { name: 'Chapeltown', kind: 'village', ll: [53.4615, -1.4654] },
  { name: 'Dore', of: 'Sheffield', kind: 'suburb', ll: [53.328, -1.536] },
  { name: 'Totley', of: 'Sheffield', kind: 'suburb', ll: [53.3143, -1.5416] },
  { name: 'Ecclesall', of: 'Sheffield', kind: 'suburb', ll: [53.3576, -1.5129] },
  { name: 'Crookes', of: 'Sheffield', kind: 'suburb', ll: [53.3852, -1.5082] },
  { name: 'Walkley', of: 'Sheffield', kind: 'suburb', ll: [53.3947, -1.4945] },
  { name: 'Nether Edge', of: 'Sheffield', kind: 'suburb', ll: [53.3589, -1.4841] },
  { name: 'Fulwood', of: 'Sheffield', kind: 'suburb', ll: [53.3686, -1.5503] },
  { name: 'Broomhill', of: 'Sheffield', kind: 'suburb', ll: [53.378, -1.501] },
  { name: 'High Green', kind: 'village', ll: [53.4709, -1.4883] },
  { name: 'Handsworth', of: 'Sheffield', kind: 'suburb', ll: [53.3725, -1.389] },
  { name: 'Gleadless', of: 'Sheffield', kind: 'suburb', ll: [53.3499, -1.4272] },
  { name: 'Wombwell', kind: 'town', ll: [53.522, -1.3977] },
  { name: 'Hoyland', kind: 'village', ll: [53.5008, -1.438] },
  { name: 'Royston', kind: 'town', ll: [53.5984, -1.4548] },
  { name: 'Cudworth', kind: 'village', ll: [53.5783, -1.4151] },
  { name: 'Darton', kind: 'village', ll: [53.5848, -1.5332] },
  { name: 'Dodworth', kind: 'village', ll: [53.5428, -1.5266] },
  { name: 'Goldthorpe', kind: 'town', ll: [53.534, -1.3047] },
  { name: 'Bawtry', kind: 'town', ll: [53.4301, -1.021] },
  { name: 'Tickhill', kind: 'town', ll: [53.4331, -1.1092] },
  { name: 'Armthorpe', kind: 'village', ll: [53.5367, -1.0615] },
  { name: 'Bessacarr', of: 'Doncaster', kind: 'suburb', ll: [53.5025, -1.0731] },
  { name: 'Rossington', kind: 'village', ll: [53.4789, -1.0614] },
  { name: 'Hatfield', kind: 'village', ll: [53.5779, -1.0001] },
  { name: 'Sprotbrough', kind: 'village', ll: [53.5122, -1.1888] },
  { name: 'Mexborough', kind: 'town', ll: [53.4942, -1.2942] },
  { name: 'Askern', kind: 'village', ll: [53.616, -1.1523] },
  { name: 'Maltby', kind: 'town', ll: [53.4231, -1.2019] },
  { name: 'Dinnington', kind: 'town', ll: [53.3685, -1.2108] },
  { name: 'Wickersley', kind: 'village', ll: [53.4212, -1.2805] },
  { name: 'Swinton', kind: 'village', ll: [53.487, -1.3128] },
  { name: 'Rawmarsh', kind: 'town', ll: [53.4617, -1.3444] },
  { name: 'Wath', kind: 'town', ll: [53.5024, -1.3453] },
  { name: 'Brinsworth', kind: 'village', ll: [53.4068, -1.3682] },
  { name: 'Whiston', kind: 'village', ll: [53.4058, -1.3265] },
  { name: 'Thurcroft', kind: 'village', ll: [53.3966, -1.2576] },
  { name: 'Kiveton Park', kind: 'village', ll: [53.3412, -1.2548] },
];

// How far a place reaches: a town's schools are those within a mile and a half of its centre, a village's within a
// mile, a suburb's within three quarters of a mile. "Nearby" then adds the nearest others, up to a limit, so a small
// town shows its villages and a suburb its neighbouring streets.
const REACH = { town: { core: 1.5, near: 5, most: 10 }, village: { core: 1, near: 4, most: 8 }, suburb: { core: 0.75, near: 1.5, most: 8 } };
// A page needs at least this many schools in all to say anything useful
const MIN_SCHOOLS = 3;

export interface TownPage extends Town {
  slug: string;                 // "knaresborough-primary-schools"
  page: string;                 // "knaresborough-primary-schools/"
  label: string;                // "Knaresborough", or "Roundhay, Leeds"
  area: Area;                   // the area page it sits under
  council: string;              // its council, a key of COUNCILS
  core: AreaSchool[];           // the schools in it, nearest first
  near: AreaSchool[];           // the nearest others
  nearMiles: number;            // how far "near" reaches, rounded up to a half mile
}

const kebab = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let cache: TownPage[] | null = null;
export function townPages(): TownPage[] {
  if (cache) return cache;
  const all = loadAll();
  const pages: TownPage[] = [];
  for (const t of TOWNS) {
    const r = REACH[t.kind];
    const by = all.map((s) => ({ s, mi: haversine(t.ll, s.ll) / MI })).sort((a, b) => a.mi - b.mi);
    const core = by.filter((x) => x.mi <= r.core);
    const near = by.filter((x) => x.mi > r.core && x.mi <= r.near).slice(0, r.most);
    if (!core.length || core.length + near.length < MIN_SCHOOLS) { console.log(`  town page skipped, too few schools: ${t.name}`); continue; }
    // the area most of its own schools belong to, and that area's council
    const count = new Map<Area, number>();
    for (const x of core) count.set(areaOf(x.s), (count.get(areaOf(x.s)) ?? 0) + 1);
    const area = [...count].sort((a, b) => b[1] - a[1])[0][0];
    const slug = `${kebab(t.name)}-primary-schools`;
    pages.push({
      ...t, slug, page: `${slug}/`, label: t.of ? `${t.name}, ${t.of}` : t.name,
      area, council: AREA_INFO[area].council,
      core: core.map((x) => x.s), near: near.map((x) => x.s),
      nearMiles: near.length ? Math.ceil(near[near.length - 1].mi * 2) / 2 : r.core,
    });
  }
  return (cache = pages);
}
// the town pages under one area page, by name
export const townsOf = (area: Area) => townPages().filter((t) => t.area === area).sort((a, b) => a.name.localeCompare(b.name));
// the town page a school is in the middle of, if any (the nearest town centre it's within reach of)
export function townOf(urn: number): TownPage | undefined {
  return townPages().filter((t) => t.core.some((s) => s.urn === urn))
    .sort((a, b) => haversine(a.ll, a.core.find((s) => s.urn === urn)!.ll) - haversine(b.ll, b.core.find((s) => s.urn === urn)!.ll))[0];
}
