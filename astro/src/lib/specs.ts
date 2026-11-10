// The ad spots and the rules for what goes in them. One list, used by the admin form, the admin API
// (worker/admin.js, which enforces it) and the ad specs page, so they can't disagree.

export type Area = 'harrogate' | 'york' | 'craven' | 'selby' | 'hambleton' | 'richmondshire' | 'ryedale' | 'scarborough'
  | 'bridlington' | 'beverley' | 'goole' | 'cottingham' | 'hulleast' | 'hullnorth' | 'hullwest'
  | 'middlesbrough' | 'redcar' | 'halifax' | 'caldervalley';
export type Placement = 'uniform' | 'profile' | 'nearby' | 'results' | 'plan' | 'area' | 'pagesponsor';

// Every area the checker covers, in one place: the area pages, the school pages' breadcrumbs, the ad areas, the
// admin and the coverage map all read this. To add an area: add a line here, build its schools into the data
// (build/build_data.py's FULL list, or a new council's own build) and give it an area page (src/pages/<page>.astro,
// using AreaPage). An area is a North Yorkshire district, a whole council (York), or part of a council by
// parliamentary constituency, for councils with no districts (East Riding).
export interface AreaInfo {
  label: string;          // the ad area's name, and the footer link
  short: string;          // one or two words, for tables and the breadcrumb ("Northallerton primary schools")
  name: string;           // the area page's place names, for links to it ("York primary schools")
  page: string;           // the area page's address
  council: string;        // a key of COUNCILS in lib/engine.ts
  district?: string;      // North Yorkshire's old district (the council sheets' "District" column)
  constituencies?: string[];   // or the parliamentary constituencies it covers, as the DfE names them
  home: string[];         // the council district it covers in full, by ONS code (public/geo/uk-districts.json)
  example: [string, string];   // a postcode to try, and the place it's in
}
export const AREA_INFO: Record<Area, AreaInfo> = {
  harrogate: { label: 'Harrogate and Knaresborough', short: 'Harrogate', name: 'Harrogate and Knaresborough', page: 'harrogate-primary-schools/', council: 'North Yorkshire', district: 'Harrogate', home: ['E07000165'], example: ['HG2 0NA', 'Harrogate'] },
  york: { label: 'York and villages', short: 'York', name: 'York', page: 'york-primary-schools/', council: 'York', home: ['E06000014'], example: ['YO24 1HW', 'York'] },
  craven: { label: 'Skipton, Settle and the Dales', short: 'Skipton', name: 'Skipton, Settle and the Dales', page: 'skipton-primary-schools/', council: 'North Yorkshire', district: 'Craven', home: ['E07000163'], example: ['BD23 1ND', 'Skipton'] },
  hambleton: { label: 'Northallerton, Thirsk and Bedale', short: 'Northallerton', name: 'Northallerton, Thirsk and Bedale', page: 'northallerton-primary-schools/', council: 'North Yorkshire', district: 'Hambleton', home: ['E07000164'], example: ['DL6 1QE', 'Northallerton'] },
  richmondshire: { label: 'Richmond, Catterick and Leyburn', short: 'Richmond', name: 'Richmond, Catterick and Leyburn', page: 'richmond-primary-schools/', council: 'North Yorkshire', district: 'Richmondshire', home: ['E07000166'], example: ['DL10 4EJ', 'Richmond'] },
  ryedale: { label: 'Malton, Pickering and Ryedale', short: 'Malton', name: 'Malton, Norton and Pickering', page: 'malton-primary-schools/', council: 'North Yorkshire', district: 'Ryedale', home: ['E07000167'], example: ['YO17 7XJ', 'Malton'] },
  scarborough: { label: 'Scarborough, Whitby and Filey', short: 'Scarborough', name: 'Scarborough, Whitby and Filey', page: 'scarborough-primary-schools/', council: 'North Yorkshire', district: 'Scarborough', home: ['E07000168'], example: ['YO12 7HU', 'Scarborough'] },
  selby: { label: 'Selby and Tadcaster', short: 'Selby', name: 'Selby and Tadcaster', page: 'selby-primary-schools/', council: 'North Yorkshire', district: 'Selby', home: ['E07000169'], example: ['YO8 4QB', 'Selby'] },
  // East Riding has no districts: its areas are its parliamentary constituencies, as the DfE names them (cut at 30 letters)
  bridlington: { label: 'Bridlington, Driffield and the Wolds', short: 'Bridlington', name: 'Bridlington, Driffield and Hornsea', page: 'bridlington-primary-schools/', council: 'East Riding of Yorkshire', constituencies: ['Bridlington and The Wolds'], home: ['E06000011'], example: ['YO16 7AQ', 'Bridlington'] },
  beverley: { label: 'Beverley and Holderness', short: 'Beverley', name: 'Beverley, Hedon and Withernsea', page: 'beverley-primary-schools/', council: 'East Riding of Yorkshire', constituencies: ['Beverley and Holderness'], home: ['E06000011'], example: ['HU17 9LW', 'Beverley'] },
  goole: { label: 'Goole, Howden and Pocklington', short: 'Goole', name: 'Goole, Howden and Pocklington', page: 'goole-primary-schools/', council: 'East Riding of Yorkshire', constituencies: ['Goole and Pocklington'], home: ['E06000011'], example: ['DN14 6TL', 'Goole'] },
  cottingham: { label: 'Cottingham, Hessle and Willerby', short: 'Cottingham', name: 'Cottingham, Hessle and Willerby', page: 'cottingham-primary-schools/', council: 'East Riding of Yorkshire', constituencies: ['Kingston upon Hull North and C', 'Kingston upon Hull West and Ha'], home: ['E06000011'], example: ['HU16 5BP', 'Cottingham'] },
  // Hull: its three constituencies. Hull publishes its catchments only as a picture, so these pages can't check them
  hulleast: { label: 'East Hull', short: 'East Hull', name: 'East Hull', page: 'east-hull-primary-schools/', council: 'Kingston upon Hull, City of', constituencies: ['Kingston upon Hull East'], home: ['E06000010'], example: ['HU8 9JH', 'East Hull'] },
  hullnorth: { label: 'North Hull', short: 'North Hull', name: 'North Hull', page: 'north-hull-primary-schools/', council: 'Kingston upon Hull, City of', constituencies: ['Kingston upon Hull North and C'], home: ['E06000010'], example: ['HU5 4ET', 'North Hull'] },
  hullwest: { label: 'West Hull', short: 'West Hull', name: 'West Hull', page: 'west-hull-primary-schools/', council: 'Kingston upon Hull, City of', constituencies: ['Kingston upon Hull West and Ha'], home: ['E06000010'], example: ['HU3 2RA', 'West Hull'] },
  // Teesside, in ceremonial North Yorkshire: one page per council. Neither publishes its admission zones as map data
  middlesbrough: { label: 'Middlesbrough', short: 'Middlesbrough', name: 'Middlesbrough', page: 'middlesbrough-primary-schools/', council: 'Middlesbrough', home: ['E06000002'], example: ['TS5 6EA', 'Middlesbrough'] },
  redcar: { label: 'Redcar, Guisborough and Saltburn', short: 'Redcar', name: 'Redcar, Guisborough and Saltburn', page: 'redcar-primary-schools/', council: 'Redcar and Cleveland', home: ['E06000003'], example: ['TS10 1NL', 'Redcar'] },
  // Calderdale, West Yorkshire: its two constituencies. Its primary schools have no catchments
  halifax: { label: 'Halifax and Sowerby Bridge', short: 'Halifax', name: 'Halifax and Sowerby Bridge', page: 'halifax-primary-schools/', council: 'Calderdale', constituencies: ['Halifax'], home: ['E08000033'], example: ['HX1 3ER', 'Halifax'] },
  caldervalley: { label: 'Brighouse, Elland and the Calder Valley', short: 'Calder Valley', name: 'Brighouse, Elland, Hebden Bridge and Todmorden', page: 'calder-valley-primary-schools/', council: 'Calderdale', constituencies: ['Calder Valley'], home: ['E08000033'], example: ['HX7 6DS', 'Hebden Bridge'] },
};
// The areas' names for the site's wording, so a new area appears everywhere from its line above:
// PLACES "Harrogate, York, Skipton, Northallerton, Richmond, Malton, Scarborough and Selby"; NY_PLACES the same without York
export const listOf = (xs: string[], last = 'and') => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${last} ${xs[xs.length - 1]}`);
export const PLACES = listOf(Object.values(AREA_INFO).map((a) => a.short));
export const NY_PLACES = listOf(Object.values(AREA_INFO).filter((a) => a.council === 'North Yorkshire').map((a) => a.short));

// The councils covered, as parents call them, for wording like "The checker covers North Yorkshire and York schools"
const COUNCIL_SHORT: Record<string, string> = { 'East Riding of Yorkshire': 'East Riding', 'Kingston upon Hull, City of': 'Hull', 'Redcar and Cleveland': 'Redcar' };
export const COVERED = listOf([...new Set(Object.values(AREA_INFO).map((a) => COUNCIL_SHORT[a.council] ?? a.council))]);

// North Yorkshire Council's term and holiday dates, for the area pages' term dates question
export const NY_TERM_DATES = 'https://www.northyorks.gov.uk/education-and-learning/education-and-learning/school-term-and-holiday-dates';
// and East Riding of Yorkshire Council's
export const ER_TERM_DATES = 'https://www.eastriding.gov.uk/learning/schools-colleges-and-academies/school-term-dates/';
// and Hull City Council's (2026 to 2027)
export const HULL_TERM_DATES = 'https://www.hull.gov.uk/schools-2/school-holidays-term-dates/2';
// and Calderdale Council's
export const CALD_TERM_DATES = 'https://new.calderdale.gov.uk/schools-and-learning/schools/school-term-dates';
export const AREAS = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.label])) as Record<Area, string>;
export const AREA_SHORT = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.short])) as Record<Area, string>;
// Used by the admin's coverage map: these districts show as fully covered, others with some of our schools as partly
export const AREA_HOME = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.home])) as Record<Area, string[]>;

type Placed = { council: string; district?: string; con?: string; ll?: [number, number] };
// A school's own area: the one for its district or constituency, or the one covering its whole council (York).
// North Yorkshire schools in a district without an area of its own (none now) fall back to York.
export function areaOf(s: Placed): Area {
  const mine = (Object.keys(AREA_INFO) as Area[]).filter((a) => AREA_INFO[a].council === s.council);
  return mine.find((a) => s.district && AREA_INFO[a].district === s.district)
    ?? mine.find((a) => s.con && AREA_INFO[a].constituencies?.includes(s.con))
    ?? mine.find((a) => !AREA_INFO[a].district && !AREA_INFO[a].constituencies)
    ?? 'york';
}

// North Yorkshire schools outside the Harrogate district within 15 miles of York Minster: before their districts had
// areas of their own these were York's, so they're still listed on the York area page and still show York's ads
const MINSTER: [number, number] = [53.9622, -1.0819];
export const NEAR_YORK_MILES = 15;
export function milesFromYork(ll: [number, number]) {
  const r = Math.PI / 180, [a, b] = MINSTER, [c, d] = ll;
  const h = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}
export const nearYork = (s: Placed) => s.council === 'North Yorkshire' && s.district !== 'Harrogate' && !!s.ll && milesFromYork(s.ll) <= NEAR_YORK_MILES;

// The ad areas a school's ads come from: its own, plus York's when it's near York
export function adAreasOf(s: Placed): Area[] {
  const own = areaOf(s);
  return own !== 'york' && nearYork(s) ? [own, 'york'] : [own];
}

export interface Spot {
  label: string;
  where: string;
  // how many ads can run at once: per area, or per school for the spots tied to schools
  limit: number;
  perSchool?: boolean;
  needsSchools?: boolean;   // must name the schools it appears on
}

export const SPOTS: Record<Placement, Spot> = {
  uniform: { label: 'School uniform', where: 'In the panel for each school the shop supplies, or every school in the area', limit: 1, perSchool: true },
  profile: { label: 'School profile', where: 'Open days and a welcome note in the school’s own panel', limit: 1, perSchool: true, needsSchools: true },
  nearby: { label: 'Near this school', where: 'One local service in each school’s panel, taking turns', limit: 3 },
  results: { label: 'Featured in results', where: 'One card after the 4th school in the search results', limit: 1 },
  plan: { label: 'Get ready for September', where: 'The business cards on every parent’s My plan page', limit: 6 },
  area: { label: 'Area page directory', where: 'The “Local help for families” cards on the area page', limit: 9 },
  pagesponsor: { label: 'Area page sponsor', where: 'One line under the area page heading', limit: 1 },
};

// Character limits for the wording, and the other rules a saved ad must meet
export const LIMITS = { name: 40, category: 30, blurb: 140, cta: 24, offer: 60, openDay: 40, openDays: 6, logoText: 2 } as const;

export const SPEC_NOTES = [
  'Business name up to 40 characters, category (such as “School uniform”) up to 30.',
  'Description up to 140 characters. Plain words, no capitals for emphasis, no prices that might change.',
  'Button text up to 24 characters, for example “Book a visit”.',
  'Offer line (optional) up to 60 characters, for example “10% off with code YSC10”.',
  'Logo: a square PNG or SVG, at least 256 × 256 pixels, on a plain background. Without one, two letters on a coloured tile.',
  'Link: the page the button opens. We add a tag so your own stats show the visits we send.',
  'School profiles: up to 6 open days, each up to 40 characters, for example “Tue 18 November, 9:30am”.',
];
