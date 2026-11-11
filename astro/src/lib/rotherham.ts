// The questions every Rotherham area page shares (rotherham, rother-valley and wath-primary-schools). Every school has a
// catchment, but the council draws them only on its web map, and publishes no cut-off distances, so these pages say how
// popular each school is and how its last places went instead.
import { COUNCILS } from './engine';
import { COVERED, ROT_TERM_DATES } from './specs';
import { url } from './url';

const rt = COUNCILS.Rotherham;
const BOOKLET = 'https://www.rotherham.gov.uk/downloads/download/728/primary-application-booklet';
const DFE = 'https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers';

export const rtFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${town}?`,
    `Every community primary school and academy in Rotherham has a catchment area, but Rotherham Council draws them only on its web map, so the checker can’t tell you which one you’re in. Find your address on <a href="${rt.catchMap}" target="_blank" rel="noopener">the council’s map</a>: open Layers, then Education, and turn on Primary Catchment. Then put your postcode into the <a href="${url('')}">school checker</a> to see how far every school near you is and how popular it has been. Catholic and voluntary aided Church of England schools have no catchment and set their own rules.`],
  ['Is there a school catchment area map for Rotherham?',
    `Yes, on <a href="${rt.catchMap}" target="_blank" rel="noopener">the council’s web map</a>, under Layers, Education, Primary Catchment. Click inside an area to see its school. The council’s <a href="${BOOKLET}" target="_blank" rel="noopener">booklet for parents</a> says a few streets fall into two schools’ catchments, and the School Organisation team will confirm yours.`],
  ['How do school places work in Rotherham?',
    `When a school has more applicants than places, Rotherham Council’s rules give them to children in care first, then children in the catchment (those with an older brother or sister at the school first), then brothers and sisters from outside it, then the children who live nearest, in a straight line. Most academies use much the same rules; church schools set their own. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
  ['How do you know how hard each school is to get into?',
    `Rotherham Council doesn’t publish how far the last place went. The Department for Education publishes, for every school, <a href="${DFE}" target="_blank" rel="noopener">how many families put it first and how many of them got a place</a>, and the council’s <a href="${BOOKLET}" target="_blank" rel="noopener">booklet for parents</a> lists the schools that were full in the latest year, how many places were left for children applying on distance, and how many of them missed out. The checker shows both.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online through <a href="${rt.apply}" target="_blank" rel="noopener">Rotherham Council’s parent portal</a> by Friday 15 January 2027. You can name up to three schools, in the order you want them, and the council strongly advises naming all three.`],
  ['When are primary school places announced?',
    'Offers go out on national offer day, Friday 16 April 2027, by email if you applied online.'],
  ['Can my child get into a school outside our catchment?',
    `Often. In the latest year, ${open} of the ${total} schools here offered a place to everyone who put them first. Where a school was oversubscribed, the checker says so, how many first choices missed out, and, from the council’s booklet, how many children applying on distance did.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Mexborough, that’s the City of Doncaster Council"
export const rtBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const rtTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    `Community schools follow <a href="${ROT_TERM_DATES}" target="_blank" rel="noopener">Rotherham Council’s term dates</a>. Academies and church schools can set their own, so check with the school.`],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
