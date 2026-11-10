// The questions every Leeds area page shares (its catchments, rules, dates and term dates), so the eight pages only
// add what's local to them.
import { COUNCILS } from './engine';
import { COVERED, LEEDS_TERM_DATES } from './specs';
import { url } from './url';

const ld = COUNCILS.Leeds;
const CUTOFFS = 'https://www.leeds.gov.uk/sites/default/files/2026-04/cut%20off%20distances%20and%20criteria%20for%20primary%20and%20junior%20schools%202026.pdf';

export const ldFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${town}?`,
    `Put your postcode into the <a href="${url('')}">school catchment checker</a>. Every Leeds community and voluntary controlled primary school has a catchment (the council calls it a catchment priority area), and the checker uses the council’s own catchment maps, so it tells you which you’re in and your chances at every school nearby. Church schools and academies can set their own rules.`],
  [`Is there a school catchment area map for ${town}?`,
    `Yes. Leeds City Council publishes <a href="${ld.catchMap}" target="_blank" rel="noopener">a catchment map for each school</a>. The checker reads the same maps, so your postcode gives you the answer. Near a boundary? Check your exact address with the council.`],
  ['How do school places work in Leeds?',
    `When a school has more applicants than places, Leeds City Council gives them in this order: children in care, then children with exceptional needs that only that school can meet, then brothers and sisters of pupils, then children in the catchment, then everyone else, nearest first in a straight line. Brothers and sisters come before the catchment in Leeds. Church schools and academies can set their own rules. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
  ['How do you know how far places went?',
    `Leeds City Council publishes, every year, <a href="${CUTOFFS}" target="_blank" rel="noopener">the furthest distance offered at every school and the last priority admitted</a>. The checker compares your distance with it.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${ld.apply}" target="_blank" rel="noopener">Leeds City Council</a> by Friday 15 January 2027. You can name up to five schools, in the order you want them.`],
  ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027.'],
  ['Can my child get into a school outside our catchment?',
    `Often. In the latest year, ${open} of the ${total} schools here took everyone who applied. Where a school was full, the checker shows whether children from outside its catchment got in and how far away.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Baildon, that’s Bradford Council"
export const ldBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const ldTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    `Community and voluntary controlled schools follow <a href="${LEEDS_TERM_DATES}" target="_blank" rel="noopener">Leeds City Council’s term dates</a>. Academies and church schools can set their own, so check with the school.`],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
