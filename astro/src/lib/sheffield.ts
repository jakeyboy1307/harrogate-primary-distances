// The questions every Sheffield area page shares (its catchments, rules, dates and term dates), so the six pages
// (central-sheffield, hillsborough, heeley, mosborough, hallam and stocksbridge-primary-schools) only add what's local.
import { COUNCILS } from './engine';
import { COVERED, SHEF_TERM_DATES } from './specs';
import { url } from './url';

const sh = COUNCILS.Sheffield;
const FIGURES = 'https://www.sheffield.gov.uk/sites/default/files/2026-04/oversubscribed_infant_and_primary_schools_2026.pdf';

export const shFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${town}?`,
    `Put your postcode into the <a href="${url('')}">school catchment checker</a>. It uses Sheffield City Council’s own catchment map, so it tells you which catchment you’re in and your chances at every primary school nearby. Sheffield’s catchments are set by postcode and house number, so if you live near a boundary, check your exact address with <a href="${sh.catchMap}" target="_blank" rel="noopener">the council’s catchment search</a>. Catholic and Church of England schools have no catchment and set their own rules.`],
  [`Is there a school catchment area map for ${town}?`,
    `Yes. Sheffield City Council publishes <a href="${sh.catchMap}" target="_blank" rel="noopener">a map of every primary school’s catchment</a>, and the checker uses the same areas, so your postcode gives you the answer.`],
  ['How do school places work in Sheffield?',
    `When a school has more applicants than places, Sheffield City Council gives them in this order: children in care, then children in the catchment with an older brother or sister at the school, then the rest of the catchment, then brothers and sisters from outside it, then everyone else, nearest first in a straight line. Church schools and some academies set their own rules. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
  ['How do you know how far places went?',
    `Every year, Sheffield City Council publishes, for each school that was full, <a href="${FIGURES}" target="_blank" rel="noopener">how many places went under each rule, how far away the last child offered a place lived, and how many were refused</a>. The checker uses it for 2024 to 2026. For 2023, and for church schools, which the council lists without figures, it shows the Department for Education’s figures for how many families put each school first and how many of them got a place.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${sh.apply}" target="_blank" rel="noopener">Sheffield City Council</a> by Friday 15 January 2027. You can name three schools, in the order you want them, and the council advises including your catchment school.`],
  ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027.'],
  ['Can my child get into a school outside our catchment?',
    `Often. In the latest year, ${open} of the ${total} schools here took everyone who applied on time. Where a school was full, the checker shows whether children from outside its catchment got in, and how far away.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Dronfield, that’s Derbyshire County Council"
export const shBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const shTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    `Community and voluntary controlled schools follow <a href="${SHEF_TERM_DATES}" target="_blank" rel="noopener">Sheffield City Council’s term dates</a>. Academies and church schools can set their own, so check with the school.`],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
