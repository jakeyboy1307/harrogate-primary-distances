// The questions every Bradford area page shares (no catchments for most schools, the thirteen priority areas, rules,
// dates and term dates), so the five pages only add what's local to them.
import type { AreaSchool } from './areas';
import { COUNCILS } from './engine';
import { COVERED, listOf } from './specs';
import { url } from './url';
import { termAnswer } from './holidays';

const bd = COUNCILS.Bradford;
const GUIDE = 'https://www.bradford.gov.uk/media/dy1lr1hm/applying-for-a-primary-school-detailed-guide-for-september-2027.pdf';
const DFE = 'https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers';
const short = (n: string) => n.replace(/,.*$/, '').replace(/\s+(Primary|Village|CofE|Church of England|Catholic|Community).*$/i, '');

export function bdFaqs(town: string, schools: AreaSchool[], open: number): [string, string][] {
  const pa = schools.filter((s) => s.cz?.length || s.cu).map((s) => short(s.name));
  return [
    [`What is my catchment school in ${town}?`,
      `Most Bradford primary schools don’t have catchment areas. After children in care and brothers and sisters, places go to the children who live nearest, measured in a straight line, so your nearest schools are usually your best chance. ${pa.length
        ? `Here, ${listOf(pa)} ${pa.length > 1 ? 'have' : 'has'} a priority area, which gives children living in it priority, and the <a href="${url('')}">school checker</a> tells you whether you’re in it.`
        : `None of the schools here has a priority area.`} Put your postcode into the <a href="${url('')}">school checker</a> to see how far places went at every school near you.`],
    [`Is there a school catchment area map for ${town}?`,
      `Only for the thirteen Bradford schools with a priority area: the council publishes <a href="${bd.catchMap}" target="_blank" rel="noopener">a map of each</a>, and the checker uses twelve of them (St Joseph’s in Bingley’s is a picture). Other schools have no catchment to map.`],
    ['How do school places work in Bradford?',
      `When a school has more applicants than places, Bradford Council gives them to children in care first, then brothers and sisters of pupils, then the children who live nearest. Schools with a priority area put children living in it ahead of others, and church and academy schools can set their own rules, such as faith. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
    ['How do you know how far places went?',
      `Bradford Council’s <a href="${GUIDE}" target="_blank" rel="noopener">guide for parents</a> lists, for every school, how many applied, how many places went under each rule and the furthest distance offered. The checker uses it for 2026 and 2023; the guides with 2024’s and 2025’s figures are no longer online, so those years show the <a href="${DFE}" target="_blank" rel="noopener">Department for Education’s figures</a> for how many families put each school first and how many of them got a place.`],
    ['When do I apply for a Reception place for September 2027?',
      `Apply online to <a href="${bd.apply}" target="_blank" rel="noopener">Bradford Council</a> by Friday 15 January 2027. You can name up to five schools, in the order you want them, and the council advises using all five.`],
    ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027.'],
    ['Will my child get a place at our nearest school?',
      `Usually. In the latest year, ${open} of the ${schools.length} schools here took everyone who applied. Where a school was full, the checker shows how far places went, so you can compare your distance.`],
    [`Which are the best primary schools in ${town}?`,
      'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
  ];
}
// near: an example from just over the border, "From Guiseley, that’s Leeds City Council"
export const bdBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const bdTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    termAnswer('Bradford', 'Bradford', url)],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
