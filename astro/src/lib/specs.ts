// The ad spots and the rules for what goes in them. One list, used by the admin form, the admin API
// (worker/admin.js, which enforces it) and the ad specs page, so they can't disagree.

export type Area = 'harrogate' | 'york';
export type Placement = 'uniform' | 'profile' | 'nearby' | 'results' | 'plan' | 'area' | 'pagesponsor';

export const AREAS: Record<Area, string> = {
  harrogate: 'Harrogate and Knaresborough',
  york: 'York and villages',
};

// The council district each area is built around, by ONS code (public/geo/uk-districts.json, used by the admin's
// coverage map). Every primary school in these districts is in the checker, so they show as fully covered; other
// districts with some of our schools in them show as partly covered. Add a line here when a new area goes live.
export const AREA_HOME: Record<Area, string[]> = {
  harrogate: ['E07000165'],   // Harrogate
  york: ['E06000014'],        // York
};

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
