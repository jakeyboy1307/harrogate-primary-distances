// The questions every Hull area page shares (east, north and west-hull-primary-schools). Hull publishes no cut-off
// distances and its catchments only as a scanned map, so these pages say how popular each school is instead.
import { COUNCILS } from './engine';
import { COVERED } from './specs';
import { url } from './url';
import { termAnswer } from './holidays';

const hull = COUNCILS['Kingston upon Hull, City of'];
const DFE = 'https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers';

export const hullFaqs = (part: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${part}?`,
    `Hull City Council publishes its catchment areas only as a printed map, so the checker can’t tell you which one you’re in. Find your address on <a href="${hull.catchMap}" target="_blank" rel="noopener">the council’s primary school catchment map</a> (a PDF). Then put your postcode into the <a href="${url('')}">school checker</a> to see how far every school near you is and how popular it has been.`],
  ['Is there a school catchment area map for Hull?',
    `Yes. Hull City Council publishes a <a href="${hull.catchMap}" target="_blank" rel="noopener">primary school catchment map</a> as a PDF, at the back of its guide to primary admissions. It shows every school’s catchment across the city.`],
  ['How do school places work in Hull?',
    `Every primary school in Hull is an academy, so each sets its own admissions rules, and the council coordinates the applications. Most give places to children in care first, then children in the catchment, then brothers and sisters, then whoever lives nearest by the shortest safe walking route. Catholic and Church of England schools usually put faith first. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
  ['How do you know how hard each school is to get into?',
    `Hull doesn’t publish how far the last place went. The Department for Education publishes, for every school, <a href="${DFE}" target="_blank" rel="noopener">how many families put it first and how many of them got a place</a>, and the council’s guide shows how the latest year’s places were shared out by catchment, brothers and sisters and distance. The checker shows both.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${hull.apply}" target="_blank" rel="noopener">Hull City Council</a> by Friday 15 January 2027. You can name up to three schools, in the order you want them, and the council recommends including your catchment or nearest school.`],
  ['When are primary school places announced?',
    'Offers go out on national offer day, Friday 16 April 2027, through the council’s My School Portal and by email.'],
  [`Can my child get into a school outside our catchment?`,
    `Often. In the latest year, ${open} of the ${total} schools here offered a place to everyone who put them first. Where a school was oversubscribed, the checker says so, and how many first choices missed out.`],
  [`Which are the best primary schools in ${part}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
  ['We live in Cottingham, Hessle or Willerby. Which council do I apply to?',
    `East Riding of Yorkshire Council, as the council where you live, even when you want a Hull school. You can name Hull schools on that form. The checker covers ${COVERED} schools, so you can compare both sides of the boundary, and East Riding’s catchments can be checked.`],
  ['When are the school term dates and holidays?',
    termAnswer('Kingston upon Hull, City of', 'Hull', url)],
  ['How do I find open days?',
    'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
