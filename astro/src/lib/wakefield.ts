// The questions every Wakefield area page shares (wakefield, ossett, pontefract and hemsworth-primary-schools). Every
// school has a catchment, but the council publishes them only as an address search, and no cut-off distances, so these
// pages say how popular each school is and how its places were shared out instead.
import { COUNCILS } from './engine';
import { COVERED, WAKE_TERM_DATES } from './specs';
import { url } from './url';

const wk = COUNCILS.Wakefield;
const GUIDE = 'https://www.wakefield.gov.uk/media/43xpw5x4/primaryguide-27-28.docx';
const DFE = 'https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers';

export const wkFaqs = (part: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${part}?`,
    `Every primary school in the Wakefield district has a catchment area, but Wakefield Council publishes them only as an address search, so the checker can’t tell you which one you’re in. Enter your address in <a href="${wk.catchMap}" target="_blank" rel="noopener">the council’s catchment search</a>. Then put your postcode into the <a href="${url('')}">school checker</a> to see how far every school near you is and how popular it has been.`],
  ['Is there a school catchment area map for Wakefield?',
    `Only a rough one. The council’s admissions policy has a map of each area’s catchments, but says it can’t show the full detail. The accurate answer for your address comes from <a href="${wk.catchMap}" target="_blank" rel="noopener">its catchment search</a>.`],
  ['How do school places work in Wakefield?',
    `When a school has more applicants than places, Wakefield Council’s rules give them to children in care first, then children in the catchment (those with a brother or sister at the school first), then brothers and sisters from outside it, then the children who live nearest, in a straight line. Most academies use the same rules. Church schools, the Outwood primary academies and the Ossett trust’s schools set their own. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
  ['How do you know how hard each school is to get into?',
    `Wakefield Council doesn’t publish how far the last place went. The Department for Education publishes, for every school, <a href="${DFE}" target="_blank" rel="noopener">how many families put it first and how many of them got a place</a>, and the council’s <a href="${GUIDE}" target="_blank" rel="noopener">guide for parents</a> shows how the latest year’s places were shared out between children in the catchment, brothers and sisters, and others. The checker shows both.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online through <a href="${wk.apply}" target="_blank" rel="noopener">Wakefield Council’s Parent Portal</a> by Friday 15 January 2027. You can name up to five schools, in the order you want them.`],
  ['When are primary school places announced?',
    'Offers go out on national offer day, Friday 16 April 2027, on the Parent Portal and by email.'],
  ['Can my child get into a school outside our catchment?',
    `Often. In the latest year, ${open} of the ${total} schools here offered a place to everyone who put them first. Where a school was oversubscribed, the checker says so, how many first choices missed out, and how many places went to children from outside the catchment.`],
  [`Which are the best primary schools in ${part}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Rothwell, that’s Leeds City Council"
export const wkBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const wkTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    `Community and voluntary controlled schools follow <a href="${WAKE_TERM_DATES}" target="_blank" rel="noopener">Wakefield Council’s term dates</a>. Academies and church schools can set their own, so check with the school.`],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
