// The questions every Kirklees area page shares (its priority admission areas, rules, dates and term dates), so the
// five pages (huddersfield, dewsbury, spen-valley, colne-valley, denby-dale-primary-schools) only add what's local.
import { COUNCILS } from './engine';
import { COVERED, KIRK_TERM_DATES } from './specs';
import { url } from './url';

const k = COUNCILS.Kirklees;
const FIGURES = 'https://www.kirklees.gov.uk/beta/admissions/pdf/reception-by-preference-and-criteria-26.pdf';

export const kFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${town}?`,
    `Put your postcode into the <a href="${url('')}">school catchment checker</a>. Kirklees calls catchments “priority admission areas”, and the checker uses the council’s own map of them, so it tells you which one you’re in and your chances at every primary school nearby. Catholic schools and some church schools and academies have no priority area and set their own rules.`],
  [`Is there a school catchment area map for ${town}?`,
    `Yes. Kirklees Council’s <a href="${k.catchMap}" target="_blank" rel="noopener">map of priority admission areas</a> covers every school that has one. The checker uses the same areas, so your postcode gives you the answer. Near a boundary? Check your exact address on the council’s map.`],
  ['How do school places work in Kirklees?',
    `When a school has more applicants than places, Kirklees Council gives them in this order: children in care, then children in the priority area with a brother or sister at the school, then the rest of the priority area, then brothers and sisters from outside it, then everyone else, nearest first in a straight line. Church schools and academies can set their own rules. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
  ['How do you know how far places went?',
    `Kirklees Council publishes, every year, <a href="${FIGURES}" target="_blank" rel="noopener">how many places each school gave under each rule and how far away the last on-time place went</a>. The checker reads that as who got in, and compares your distance with it.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${k.apply}" target="_blank" rel="noopener">Kirklees Council</a> by Friday 15 January 2027. You can name three schools, in the order you want them, and the council advises including your priority area school.`],
  ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027.'],
  ['Can my child get into a school outside our priority area?',
    `Often. In the latest year, ${open} of the ${total} schools here took everyone who applied on time. Where a school was full, the checker shows whether children from outside its area got in and how far away.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Ossett, that’s Wakefield Council"
export const kBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const kTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    `Community and voluntary controlled schools follow Kirklees Council’s school calendar, in its <a href="${KIRK_TERM_DATES}" target="_blank" rel="noopener">admissions publications</a>. Academies and church schools can set their own, so check with the school.`],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
