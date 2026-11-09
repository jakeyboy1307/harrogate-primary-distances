// The ad spots and the rules for what goes in them. One list, used by the admin form, the admin API
// (worker/admin.js, which enforces it) and the ad specs page, so they can't disagree.

export type Area = 'harrogate' | 'york' | 'selby' | 'hambleton';
export type Placement = 'uniform' | 'profile' | 'nearby' | 'results' | 'plan' | 'area' | 'pagesponsor';

// Every area the checker covers, in one place: the area pages, the school pages' breadcrumbs, the ad areas, the
// admin and the coverage map all read this. To add an area: add a line here, build its schools into the data
// (build/build_data.py's FULL list) and give it an area page (src/pages/<page>.astro, using AreaPage).
export interface AreaInfo {
  label: string;          // the ad area's name, and the footer link
  short: string;          // one or two words, for tables and the breadcrumb ("Northallerton primary schools")
  name: string;           // the area page's place names, for links to it ("York primary schools")
  page: string;           // the area page's address
  council: 'North Yorkshire' | 'York';
  district?: string;      // North Yorkshire's old district (the council sheets' "District" column)
  home: string[];         // the council district it covers in full, by ONS code (public/geo/uk-districts.json)
  example: [string, string];   // a postcode to try, and the place it's in
}
export const AREA_INFO: Record<Area, AreaInfo> = {
  harrogate: { label: 'Harrogate and Knaresborough', short: 'Harrogate', name: 'Harrogate and Knaresborough', page: 'harrogate-primary-schools/', council: 'North Yorkshire', district: 'Harrogate', home: ['E07000165'], example: ['HG2 0NA', 'Harrogate'] },
  york: { label: 'York and villages', short: 'York', name: 'York', page: 'york-primary-schools/', council: 'York', home: ['E06000014'], example: ['YO24 1HW', 'York'] },
  hambleton: { label: 'Northallerton, Thirsk and Bedale', short: 'Northallerton', name: 'Northallerton, Thirsk and Bedale', page: 'northallerton-primary-schools/', council: 'North Yorkshire', district: 'Hambleton', home: ['E07000164'], example: ['DL6 1QE', 'Northallerton'] },
  selby: { label: 'Selby and Tadcaster', short: 'Selby', name: 'Selby and Tadcaster', page: 'selby-primary-schools/', council: 'North Yorkshire', district: 'Selby', home: ['E07000169'], example: ['YO8 4QB', 'Selby'] },
};
// North Yorkshire Council's term and holiday dates, for the area pages' term dates question
export const NY_TERM_DATES = 'https://www.northyorks.gov.uk/education-and-learning/education-and-learning/school-term-and-holiday-dates';
export const AREAS = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.label])) as Record<Area, string>;
export const AREA_SHORT = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.short])) as Record<Area, string>;
// Used by the admin's coverage map: these districts show as fully covered, others with some of our schools as partly
export const AREA_HOME = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.home])) as Record<Area, string[]>;

type Placed = { council: string; district?: string; ll?: [number, number] };
// A school's own area: its North Yorkshire district's, or York for York schools and the North Yorkshire schools
// near York in districts we don't cover in full yet (Ryedale)
export function areaOf(s: Placed): Area {
  if (s.council === 'North Yorkshire') {
    const hit = (Object.keys(AREA_INFO) as Area[]).find((a) => AREA_INFO[a].district === s.district);
    if (hit) return hit;
  }
  return 'york';
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
