// The questions both Calderdale area pages share (no catchments, the council's rules, dates and term dates), so the
// two pages (halifax, calder-valley-primary-schools) only add what's local to them.
import { COUNCILS } from './engine';
import { CALD_TERM_DATES, COVERED } from './specs';
import { url } from './url';

const cd = COUNCILS.Calderdale;
const DATA = 'https://dataworks.calderdale.gov.uk/dataset/vq9q6';

export const cdFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${town}?`,
    `Calderdale’s primary schools don’t have catchment areas, so there’s no catchment school to find. Places go to children in care first, then brothers and sisters of pupils, then the children who live nearest, measured in a straight line. Put your postcode into the <a href="${url('')}">school checker</a> to see how your distance compares with how far places have gone at every school near you.`],
  [`Is there a school catchment area map for ${town}?`,
    `No, because Calderdale Council doesn’t use catchment areas for primary schools. A few church schools and academies set their own rules, such as a faith priority or, at Bolton Brow, a catchment of its own, so check those schools’ admissions policies.`],
  ['How do you know how far places went?',
    `Calderdale Council publishes, every year, <a href="${DATA}" target="_blank" rel="noopener">how many families applied to each school and, at a full school, how far away the furthest child offered a place lived</a>. Brothers and sisters come before distance, so that child could be a brother or sister living further away, and the council doesn’t say. The checker compares your distance with it.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${cd.apply}" target="_blank" rel="noopener">Calderdale Council</a> by Friday 15 January 2027. You can name up to five schools, in the order you want them.`],
  ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027.'],
  ['Will my child get a place at our nearest school?',
    `Usually. In the latest year, ${open} of the ${total} schools here offered a place to everyone who applied in time. Where a school was full, the checker shows how far places went, so you can see whether you’d have got in.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Queensbury, that’s Bradford Council"
export const cdBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const cdTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    `Community and voluntary controlled schools follow <a href="${CALD_TERM_DATES}" target="_blank" rel="noopener">Calderdale Council’s term dates</a>. Academies and church schools can set their own, so check with the school.`],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
