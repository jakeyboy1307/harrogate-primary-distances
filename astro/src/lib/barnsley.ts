// The questions every Barnsley area page shares (no catchments, the council's rules, dates and term dates), so the
// three pages (barnsley-north, barnsley-south and penistone-primary-schools) only add what's local to them.
import { COUNCILS } from './engine';
import { BARN_TERM_DATES, COVERED } from './specs';
import { url } from './url';

const bn = COUNCILS.Barnsley;
const GUIDE = 'https://www.barnsley.gov.uk/media/sydlk4be/pimary-school-admission-booklet-2027.pdf';

export const bnFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${town}?`,
    `Barnsley’s primary schools don’t have catchment areas, so there’s no catchment school to find. Places go to children in care first, then brothers and sisters of pupils, then the children who live nearest, measured in a straight line. Put your postcode into the <a href="${url('')}">school checker</a> to see how your distance compares with how far places have gone at every school near you.`],
  [`Is there a school catchment area map for ${town}?`,
    `No, because Barnsley Council doesn’t use catchment areas. Church schools and some academies set their own rules, such as a faith or parish priority, so check those schools’ admissions policies.`],
  ['How do you know how far places went?',
    `Barnsley Council’s <a href="${GUIDE}" target="_blank" rel="noopener">guide for parents</a> lists every school that was full, with the distance of the last place offered, and how every school’s places were shared out. The checker uses the guides for 2024 to 2026. Brothers and sisters come before distance, so the last place can only tell you how far places went to everyone else. For 2023 it shows the Department for Education’s figures for how many families put each school first and how many of them got a place.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${bn.apply}" target="_blank" rel="noopener">Barnsley Council</a> by Friday 15 January 2027. You can name three schools, in the order you want them, and the council recommends using all three.`],
  ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027.'],
  ['Will my child get a place at our nearest school?',
    `Usually. In the latest year, ${open} of the ${total} schools here offered a place to everyone who applied in time. Where a school was full, the checker shows how far places went, so you can see whether you’d have got in.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Stocksbridge, that’s Sheffield City Council"
export const bnBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const bnTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    `Community and voluntary controlled schools follow <a href="${BARN_TERM_DATES}" target="_blank" rel="noopener">Barnsley Council’s term dates</a>. Academies and church schools can set their own, so check with the school.`],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
