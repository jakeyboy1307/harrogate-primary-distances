// The school holiday pages (/north-yorkshire-school-holidays/ and the like): each council's own term and holiday
// dates for 2026 to 2027 and 2027 to 2028, for parents searching "harrogate school holidays 2026 27" or "school term
// dates north yorkshire 2027". Every date below was copied from the council's own page (or the calendar it links
// to) and checked by hand against it on CHECKED. Dates are ISO (yyyy-mm-dd); the weekdays are worked out from them,
// so a slip on a council's page (Redcar's "Friday 25 March 2027", a Thursday) can't creep in.
//
// For each year: each term's first and last day as the council gives them, and each half term's Monday to Friday
// (a half term after a bank holiday Monday starts on that Monday, since schools are shut). The Christmas, Easter and
// summer holidays are the weekdays between terms, worked out here. When a council publishes 2028 to 2029, add it as
// a third year and drop 2026 to 2027 once that summer is over.
import { AREA_INFO } from './specs';
import { areasOf, hubOf } from './hubs';

export const CHECKED = '12 November 2026';

type Span = [string, string];
export interface Year {
  label: string;            // "2026 to 2027"
  autumn: Span; oct: Span;  // term, half term
  spring: Span; feb: Span;
  summer: Span; may: Span;
  sources: { url: string; text: string }[];
  training?: string[];      // training days the council itself sets (North Yorkshire)
  notes?: string[];         // anything else the council says about the year, plain English (HTML)
}
export interface Holidays {
  council: string;          // a key of COUNCILS
  name: string;             // what parents call it: "North Yorkshire", "Hull"
  slug: string;             // "north-yorkshire-school-holidays"
  who: string;              // which schools follow the dates, as the council says (HTML)
  years: Year[];
}

const NY = 'https://www.northyorks.gov.uk/education-and-learning/education-and-learning/school-term-and-holiday-dates';
const ER = 'https://www.eastriding.gov.uk/learning/schools-colleges-and-academies/school-term-dates/';
const MBRO = 'https://www.middlesbrough.gov.uk/schools-and-education/school-term-dates/';
const REDCAR = 'https://www.redcar-cleveland.gov.uk/schools-and-education/school-terms-and-holiday-dates';
const CALD = 'https://new.calderdale.gov.uk/schools-and-learning/schools/school-term-dates';
const KIRK = 'https://www.kirklees.gov.uk/beta/schools/school-term-dates.aspx';
const LEEDS = 'https://www.leeds.gov.uk/schools-and-education/school-holidays-and-term-dates';
const SHEF = 'https://www.sheffield.gov.uk/schools-childcare/school-information-term-dates';
const BARN = 'https://www.barnsley.gov.uk/services/schools-and-education/school-terms-and-holidays/';
const DON = 'https://www.doncaster.gov.uk/services/schools/school-holidays-and-term-dates';
const page = (url: string, text: string) => [{ url, text }];

// The same calendar is shared by York, the East Riding and Hull, so it's written once
const YORKISH_2627 = { autumn: ['2026-09-07', '2026-12-18'], oct: ['2026-10-26', '2026-10-30'], spring: ['2027-01-04', '2027-03-19'], feb: ['2027-02-08', '2027-02-12'], summer: ['2027-04-05', '2027-07-26'], may: ['2027-05-31', '2027-06-04'] } as const;
const YORKISH_2728 = { autumn: ['2027-09-06', '2027-12-17'], oct: ['2027-10-25', '2027-10-29'], spring: ['2028-01-05', '2028-04-07'], feb: ['2028-02-21', '2028-02-25'], summer: ['2028-04-24', '2028-07-26'], may: ['2028-05-29', '2028-06-02'] } as const;
// and most of West and South Yorkshire start in September 2026 on Tuesday 1st, with Easter after the bank holidays
const SEPT1_2627 = { autumn: ['2026-09-01', '2026-12-18'], oct: ['2026-10-26', '2026-10-30'], spring: ['2027-01-04', '2027-03-25'], feb: ['2027-02-15', '2027-02-19'], summer: ['2027-04-12', '2027-07-21'], may: ['2027-05-31', '2027-06-04'] } as const;
// South Yorkshire's 2027 to 2028: Wednesday 1 September, Easter starting the week before Good Friday
const SY_2728 = { autumn: ['2027-09-01', '2027-12-17'], oct: ['2027-10-25', '2027-10-29'], spring: ['2028-01-04', '2028-03-31'], feb: ['2028-02-14', '2028-02-18'], summer: ['2028-04-18', '2028-07-21'], may: ['2028-05-29', '2028-06-02'] } as const;
// West Yorkshire's 2027 to 2028 (Kirklees, Bradford, Wakefield): back on Monday 6 September, Easter after Good Friday
const WY_2728 = { autumn: ['2027-09-06', '2027-12-17'], oct: ['2027-10-25', '2027-10-29'], spring: ['2028-01-04', '2028-04-07'], feb: ['2028-02-21', '2028-02-25'], summer: ['2028-04-24', '2028-07-25'], may: ['2028-05-29', '2028-06-02'] } as const;
// Teesside's 2027 to 2028 (Middlesbrough, Redcar): back on Thursday 2 September
const TEES_2728 = { autumn: ['2027-09-02', '2027-12-17'], oct: ['2027-10-25', '2027-10-29'], spring: ['2028-01-04', '2028-04-07'], feb: ['2028-02-21', '2028-02-25'], summer: ['2028-04-24', '2028-07-21'], may: ['2028-05-29', '2028-06-02'] } as const;

const y = (label: string, d: Record<'autumn' | 'oct' | 'spring' | 'feb' | 'summer' | 'may', readonly [string, string]>, rest: Omit<Year, 'label' | 'autumn' | 'oct' | 'spring' | 'feb' | 'summer' | 'may'>): Year =>
  ({ label, ...(Object.fromEntries(Object.entries(d).map(([k, v]) => [k, [...v]])) as Pick<Year, 'autumn'>), ...rest } as Year);

export const HOLIDAYS: Holidays[] = [
  { council: 'North Yorkshire', name: 'North Yorkshire', slug: 'north-yorkshire-school-holidays',
    who: 'North Yorkshire Council publishes these dates for community and voluntary controlled schools. Some schools have slightly different dates, and academies, voluntary aided and foundation schools set all of their own.',
    years: [
      y('2026 to 2027', { autumn: ['2026-09-07', '2026-12-18'], oct: ['2026-10-26', '2026-10-30'], spring: ['2027-01-04', '2027-03-19'], feb: ['2027-02-08', '2027-02-12'], summer: ['2027-04-05', '2027-07-26'], may: ['2027-05-31', '2027-06-04'] },
        { sources: page(NY, 'North Yorkshire Council’s school term and holiday dates'), training: ['2026-10-23', '2027-01-04', '2027-07-26'] }),
      y('2027 to 2028', { autumn: ['2027-09-06', '2027-12-17'], oct: ['2027-10-25', '2027-10-29'], spring: ['2028-01-04', '2028-04-07'], feb: ['2028-02-21', '2028-02-25'], summer: ['2028-04-24', '2028-07-25'], may: ['2028-05-29', '2028-06-02'] },
        { sources: page(NY, 'North Yorkshire Council’s school term and holiday dates'), training: ['2027-09-06', '2028-01-04', '2028-07-25'] }),
    ] },
  { council: 'York', name: 'York', slug: 'york-school-holidays',
    who: 'These are City of York Council’s recommended term dates for schools in York. Schools and academies may choose different dates.',
    years: [
      y('2026 to 2027', YORKISH_2627, { sources: page('https://www.york.gov.uk/attendance-truancy/school-term-dates/2', 'City of York Council’s 2026 to 2027 school term dates') }),
      y('2027 to 2028', YORKISH_2728, { sources: page('https://www.york.gov.uk/attendance-truancy/school-term-dates/3', 'City of York Council’s 2027 to 2028 school term dates') }),
    ] },
  { council: 'East Riding of Yorkshire', name: 'East Riding', slug: 'east-riding-school-holidays',
    who: 'These are East Riding of Yorkshire Council’s recommended term dates for schools in the East Riding. Academies and church schools can set their own.',
    years: [
      y('2026 to 2027', YORKISH_2627, { sources: page(ER, 'East Riding of Yorkshire Council’s school term dates') }),
      y('2027 to 2028', YORKISH_2728, { sources: page(ER, 'East Riding of Yorkshire Council’s school term dates') }),
    ] },
  { council: 'Kingston upon Hull, City of', name: 'Hull', slug: 'hull-school-holidays',
    who: 'These are Hull City Council’s school holidays and term dates, the same as the East Riding’s and York’s. Academies can set their own.',
    years: [
      y('2026 to 2027', YORKISH_2627, { sources: page('https://www.hull.gov.uk/schools-2/school-holidays-term-dates/2', 'Hull City Council’s school holidays and term dates 2026 to 2027') }),
      y('2027 to 2028', YORKISH_2728, { sources: page('https://www.hull.gov.uk/schools-2/school-holidays-term-dates/3', 'Hull City Council’s school holidays and term dates 2027 to 2028') }),
    ] },
  { council: 'Middlesbrough', name: 'Middlesbrough', slug: 'middlesbrough-school-holidays',
    who: 'These dates are for maintained schools, the ones Middlesbrough Council runs. Most Middlesbrough primary schools are academies, which set their own, as do voluntary aided schools.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: [{ url: MBRO, text: 'Middlesbrough Council’s school term dates' }, { url: 'https://www.middlesbrough.gov.uk/media/zhidys4r/school-term-dates-2026-2027.pdf', text: 'its 2026 to 2027 calendar' }] }),
      y('2027 to 2028', TEES_2728, { sources: page(MBRO, 'Middlesbrough Council’s school term dates') }),
    ] },
  { council: 'Redcar and Cleveland', name: 'Redcar and Cleveland', slug: 'redcar-school-holidays',
    who: 'Redcar and Cleveland Council says most of its schools keep to these dates. Some schools and academies change them.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: [{ url: REDCAR, text: 'Redcar and Cleveland Council’s school terms and holiday dates' }, { url: 'https://www.redcar-cleveland.gov.uk/sites/default/files/2025-06/School%20Term%20and%20Holiday%20Dates%202026-2027.pdf', text: 'its 2026 to 2027 calendar' }],
        notes: ['The council’s page gives two weekdays wrongly (“Friday 25 March” and “Monday 21 July” 2027). Its calendar shows Thursday 25 March and Wednesday 21 July, which is what’s here.'] }),
      y('2027 to 2028', TEES_2728, { sources: [{ url: 'https://www.redcar-cleveland.gov.uk/sites/default/files/2026-06/Redcar%20and%20Cleveland%20Term%20Dates%202027-2028.pdf', text: 'Redcar and Cleveland Council’s 2027 to 2028 calendar' }] }),
    ] },
  { council: 'Calderdale', name: 'Calderdale', slug: 'calderdale-school-holidays',
    who: 'Calderdale Council’s term dates apply to community, voluntary controlled and special schools. Academy, foundation and voluntary aided schools set their own.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page(CALD, 'Calderdale Council’s school term dates') }),
      y('2027 to 2028', { ...WY_2728, spring: ['2028-01-05', '2028-04-07'], summer: ['2028-04-24', '2028-07-26'] }, { sources: page(CALD, 'Calderdale Council’s school term dates') }),
    ] },
  { council: 'Kirklees', name: 'Kirklees', slug: 'kirklees-school-holidays',
    who: 'Kirklees Council’s term dates apply to community, voluntary controlled and special schools. Academies, free schools, foundation and voluntary aided schools can set their own.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page(KIRK, 'Kirklees Council’s school term dates'),
        notes: ['Election day is Thursday 6 May 2027. Schools used as polling stations can close for one of their training days.'] }),
      y('2027 to 2028', WY_2728, { sources: page(KIRK, 'Kirklees Council’s school term dates'),
        notes: ['Election day is Thursday 4 May 2028. Schools used as polling stations can close for one of their training days.'] }),
    ] },
  { council: 'Leeds', name: 'Leeds', slug: 'leeds-school-holidays',
    who: 'These are Leeds City Council’s term dates. Academies, free schools, foundation schools and voluntary aided faith schools can set their own.',
    years: [
      y('2026 to 2027', { ...SEPT1_2627, spring: ['2027-01-04', '2027-04-02'], summer: ['2027-04-19', '2027-07-22'] }, { sources: page(LEEDS, 'Leeds City Council’s school holidays and term dates'),
        notes: ['Leeds keeps its Easter break to the first two full weeks of April, so schools are shut for the Easter bank holidays in March and open again until Friday 2 April.'] }),
      y('2027 to 2028', { autumn: ['2027-09-06', '2027-12-17'], oct: ['2027-10-25', '2027-10-29'], spring: ['2028-01-04', '2028-03-31'], feb: ['2028-02-21', '2028-02-25'], summer: ['2028-04-18', '2028-07-26'], may: ['2028-05-29', '2028-06-02'] },
        { sources: page(LEEDS, 'Leeds City Council’s school holidays and term dates') }),
    ] },
  { council: 'Bradford', name: 'Bradford', slug: 'bradford-school-holidays',
    who: 'This is Bradford Council’s school calendar. Academies and church schools can set their own dates.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page('https://bso.bradford.gov.uk/userfiles/file/IMT/Bradford%20Term%20Dates%202026-27.pdf', 'Bradford Council’s school calendar 2026/27'),
        notes: ['The likely Eid dates are Wednesday 10 March and Monday 17 May 2027. The council expects schools where many pupils celebrate Eid to bear this in mind when they set their training days.'] }),
      y('2027 to 2028', WY_2728, { sources: page('https://bso.bradford.gov.uk/userfiles/file/IMT/SchoolHolidays/Bradford%20Term%20Dates%202027-28.pdf', 'Bradford Council’s school calendar 2027/28'),
        notes: ['The likely Eid dates are Saturday 26 February and Friday 5 May 2028. The council expects schools where many pupils celebrate Eid to bear this in mind when they set their training days.'] }),
    ] },
  { council: 'Wakefield', name: 'Wakefield', slug: 'wakefield-school-holidays',
    who: 'Most schools in the Wakefield district have these dates, set by Wakefield Council. Some voluntary aided schools and academies set their own.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page('https://www.wakefield.gov.uk/schools-and-education/schools/202627-school-calendar', 'Wakefield Council’s 2026/27 school calendar') }),
      y('2027 to 2028', WY_2728, { sources: page('https://www.wakefield.gov.uk/schools-and-education/schools/202728-school-calendar', 'Wakefield Council’s 2027/28 school calendar') }),
    ] },
  { council: 'Sheffield', name: 'Sheffield', slug: 'sheffield-school-holidays',
    who: 'Sheffield City Council sets these dates for community, voluntary controlled and special schools. Academies, foundation, trust and voluntary aided schools can set their own.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page(SHEF, 'Sheffield City Council’s school term dates') }),
      y('2027 to 2028', SY_2728, { sources: page(SHEF, 'Sheffield City Council’s school term dates') }),
    ] },
  { council: 'Barnsley', name: 'Barnsley', slug: 'barnsley-school-holidays',
    who: 'Barnsley Council sets these dates for community and voluntary controlled schools. Voluntary aided schools, trust schools and academies can set their own.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page(BARN, 'Barnsley Council’s school terms and holidays') }),
      y('2027 to 2028', SY_2728, { sources: page(BARN, 'Barnsley Council’s school terms and holidays') }),
    ] },
  { council: 'Doncaster', name: 'Doncaster', slug: 'doncaster-school-holidays',
    who: 'The City of Doncaster Council sets these dates for its community schools. Academies, free schools and church schools can set their own.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page(DON, 'the City of Doncaster Council’s school holidays and term dates') }),
      y('2027 to 2028', SY_2728, { sources: page(DON, 'the City of Doncaster Council’s school holidays and term dates') }),
    ] },
  { council: 'Rotherham', name: 'Rotherham', slug: 'rotherham-school-holidays',
    who: 'These are Rotherham Council’s term dates. Academies and church schools can set their own.',
    years: [
      y('2026 to 2027', SEPT1_2627, { sources: page('https://www.rotherham.gov.uk/schools-schooling/school-term-dates/2', 'Rotherham Council’s school term dates 2026 to 2027') }),
      y('2027 to 2028', SY_2728, { sources: page('https://www.rotherham.gov.uk/schools-schooling/school-term-dates', 'Rotherham Council’s school term dates 2027 to 2028') }),
    ] },
];

// The bank holidays in each school year that fall in or next to term (GOV.UK; every council's page agrees)
export const BANK: Record<string, [string, string][]> = {
  '2026 to 2027': [['2027-03-26', 'Good Friday'], ['2027-03-29', 'Easter Monday'], ['2027-05-03', 'May Day'], ['2027-05-31', 'spring bank holiday']],
  '2027 to 2028': [['2028-04-14', 'Good Friday'], ['2028-04-17', 'Easter Monday'], ['2028-05-01', 'May Day'], ['2028-05-29', 'spring bank holiday']],
};

// ---- dates, in words ----
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const at = (iso: string) => new Date(`${iso}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const step = (s: string, n: number) => { const d = at(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const weekday = (s: string) => at(s).getUTCDay();
// the next and previous weekdays, for the holidays between terms
const nextWeekday = (s: string) => { let d = step(s, 1); while ([0, 6].includes(weekday(d))) d = step(d, 1); return d; };
const prevWeekday = (s: string) => { let d = step(s, -1); while ([0, 6].includes(weekday(d))) d = step(d, -1); return d; };

// "Monday 7 September 2026"; without the year: "Monday 7 September"
export function day(s: string, year = true) {
  const d = at(s);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${year ? ` ${d.getUTCFullYear()}` : ''}`;
}
// "Monday 26 October to Friday 30 October 2026", the year once unless it changes
export const range = ([a, b]: Span) => `${day(a, a.slice(0, 4) !== b.slice(0, 4))} to ${day(b)}`;
// "26 to 30 October 2026", for answers in a sentence
export function short([a, b]: Span) {
  const x = at(a), z = at(b);
  if (a.slice(0, 7) === b.slice(0, 7)) return `${x.getUTCDate()} to ${z.getUTCDate()} ${MONTHS[z.getUTCMonth()]} ${z.getUTCFullYear()}`;
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}${a.slice(0, 4) !== b.slice(0, 4) ? ` ${x.getUTCFullYear()}` : ''} to ${z.getUTCDate()} ${MONTHS[z.getUTCMonth()]} ${z.getUTCFullYear()}`;
}

// ---- a year's rows, terms and holidays in order ----
export interface Row { what: string; kind: 'term' | 'half' | 'holiday' | 'bank' | 'training'; dates: string; span?: Span }
export const christmas = (yr: Year): Span => [nextWeekday(yr.autumn[1]), prevWeekday(yr.spring[0])];
export const easter = (yr: Year): Span => [nextWeekday(yr.spring[1]), prevWeekday(yr.summer[0])];
export const summerFrom = (yr: Year) => nextWeekday(yr.summer[1]);
// the summer holidays' last weekday: the day before the next year's first day, or the end of August if that isn't known
export const summerTo = (h: Holidays, i: number) => h.years[i + 1] ? prevWeekday(h.years[i + 1].autumn[0]) : `${h.years[i].label.slice(-4)}-08-31`;

export function rows(h: Holidays, i: number): Row[] {
  const yr = h.years[i], next = h.years[i + 1];
  const back = next ? `, back ${day(next.autumn[0])}` : '';
  const bank = BANK[yr.label] ?? [];
  const list = (xs: [string, string][]) => xs.map(([d, n]) => `${day(d, false)} (${n})`).join(', ');
  return [
    { what: 'Autumn term', kind: 'term', dates: range(yr.autumn), span: yr.autumn },
    { what: 'October half term', kind: 'half', dates: range(yr.oct), span: yr.oct },
    { what: 'Christmas holidays', kind: 'holiday', dates: range(christmas(yr)), span: christmas(yr) },
    { what: 'Spring term', kind: 'term', dates: range(yr.spring), span: yr.spring },
    { what: 'February half term', kind: 'half', dates: range(yr.feb), span: yr.feb },
    { what: 'Easter holidays', kind: 'holiday', dates: range(easter(yr)), span: easter(yr) },
    { what: 'Summer term', kind: 'term', dates: range(yr.summer), span: yr.summer },
    { what: 'May half term', kind: 'half', dates: range(yr.may), span: yr.may },
    { what: 'Summer holidays', kind: 'holiday', dates: `From ${day(summerFrom(yr))}${back}` },
    ...(bank.length ? [{ what: 'Bank holidays', kind: 'bank' as const, dates: `${list(bank)} ${yr.label.slice(-4)}. Schools are shut.` }] : []),
    ...(yr.training?.length ? [{ what: 'Training days set by the council', kind: 'training' as const, dates: `${yr.training.map((d) => day(d, false)).join('; ')} ${yr.label.slice(-4)}. No school for pupils.` }] : []),
  ];
}

// ---- checks, run at build: a date that doesn't add up stops the build rather than reaching parents ----
for (const h of HOLIDAYS) for (const yr of h.years) {
  const where = `${h.name} ${yr.label}`;
  const spans: [string, Span][] = [['autumn', yr.autumn], ['oct', yr.oct], ['spring', yr.spring], ['feb', yr.feb], ['summer', yr.summer], ['may', yr.may]];
  for (const [k, [a, b]] of spans) {
    if ([0, 6].includes(weekday(a)) || [0, 6].includes(weekday(b))) throw new Error(`holidays: ${where} ${k} starts or ends at a weekend`);
    if (a > b) throw new Error(`holidays: ${where} ${k} ends before it starts`);
  }
  for (const [k, [a, b]] of [['oct', yr.oct], ['feb', yr.feb], ['may', yr.may]] as [string, Span][])
    if (weekday(a) !== 1 || weekday(b) !== 5) throw new Error(`holidays: ${where} ${k} half term isn't Monday to Friday`);
  const inside = (s: Span, t: Span) => s[0] > t[0] && s[1] < t[1];
  if (!inside(yr.oct, yr.autumn) || !inside(yr.feb, yr.spring) || !inside(yr.may, yr.summer)) throw new Error(`holidays: ${where} a half term is outside its term`);
  if (!(yr.autumn[1] < yr.spring[0] && yr.spring[1] < yr.summer[0])) throw new Error(`holidays: ${where} terms out of order`);
}

// ---- for the pages and links ----
export const holidaysFor = (council: string) => HOLIDAYS.find((h) => h.council === council);
export const holidayPage = (h: Holidays) => `${h.slug}/`;
// the council's own primary schools page, for the breadcrumb: its council page, or its one area page (York...)
export function schoolsPageOf(council: string) {
  const hub = hubOf(council);
  if (hub) return { page: hub.page, name: `${hub.name} primary schools` };
  const a = AREA_INFO[areasOf(council)[0]];
  return { page: a.page, name: `${a.short} primary schools` };
}

// The answer to "When are the school holidays?" on the area and town pages: this year's half terms and summer, and a
// link to the full page. `place` is the area or town ("Harrogate"); `link` makes the href (the page's url()).
export function termAnswer(council: string, place: string, link: (p: string) => string) {
  const h = holidaysFor(council);
  if (!h) return `Each school publishes its own term dates. Open the school here for its phone number and website.`;
  const yr = h.years[0];
  return `${place === h.name ? `Council schools across ${h.name} follow the council’s own dates.` : `Council schools in ${place} follow ${h.name}’s dates.`} In ${yr.label} the half terms are ${short(yr.oct)}, ${short(yr.feb)} and ${short(yr.may)}, and the summer holidays start on ${day(summerFrom(yr))}. See <a href="${link(holidayPage(h))}">${h.name} school holidays and term dates</a> for every date up to summer ${h.years[h.years.length - 1].label.slice(-4)}, copied from the council’s own page. Academies, free schools and voluntary aided schools can set their own, so check with the school.`;
}
