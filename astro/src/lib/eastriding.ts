// The questions every East Riding area page shares (its catchment map, rules, dates and term dates), so the four
// pages (bridlington, beverley, goole, cottingham-primary-schools) only add what's local to them.
import { COUNCILS } from './engine';

import { url } from './url';
import { termAnswer } from './holidays';

const er = COUNCILS['East Riding of Yorkshire'];
export const ER_RULES = `East Riding of Yorkshire Council fills each school’s places in order: children in care, then children in the catchment, then brothers and sisters of pupils, then everyone else by distance, measured in a straight line from home to school. Church and academy schools can set their own rules. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`;

export const erFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`Is there a school catchment area map for ${town}?`,
    `Yes. East Riding of Yorkshire Council publishes a <a href="${er.catchMap}" target="_blank" rel="noopener">school catchment finder map</a> for every school in the East Riding. The checker uses the same catchment areas, so your postcode gives you the answer. Near a boundary? Check your exact address on the council’s map.`],
  [`How do school catchment areas work in the East Riding?`, ER_RULES],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${er.apply}" target="_blank" rel="noopener">East Riding of Yorkshire Council</a> by Friday 15 January 2027. You can name up to three schools, in the order you want them.`],
  ['When are primary school places announced?',
    'Offers go out on national offer day, Friday 16 April 2027. The council publishes a summary of how places went at every full school soon after.'],
  ['Can my child get into a school outside our catchment?',
    `Often. In the latest year, ${open} of the ${total} schools here took everyone who applied. Where a school was full, the council publishes how far the last place went, and the checker compares that with your distance.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
export const erTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    termAnswer('East Riding of Yorkshire', 'East Riding', url)],
  ['How do I find open days?',
    'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
