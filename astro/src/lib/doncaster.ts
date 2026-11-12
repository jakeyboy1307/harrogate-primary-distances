// The questions every Doncaster area page shares (its catchments, rules, dates and term dates), so the four pages
// (doncaster-central, doncaster-north, thorne and conisbrough-primary-schools) only add what's local to them.
import { COUNCILS } from './engine';
import { COVERED } from './specs';
import { url } from './url';
import { termAnswer } from './holidays';

const dn = COUNCILS.Doncaster;
const DFE = 'https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers';

export const dnFaqs = (town: string, open: number, total: number): [string, string][] => [
  [`What is my catchment school in ${town}?`,
    `Put your postcode into the <a href="${url('')}">school catchment checker</a>. It uses the City of Doncaster Council’s own catchment map, so it tells you which catchment you’re in and how popular every primary school nearby has been. Some homes sit in a shared area, in the catchment of two or three schools at once, and the checker shows all of them. Near a boundary? Check your exact address on <a href="${dn.catchMap}" target="_blank" rel="noopener">the council’s catchment finder</a>. Catholic and some Church of England schools have no catchment and set their own rules.`],
  [`Is there a school catchment area map for ${town}?`,
    `Yes. The City of Doncaster Council has <a href="${dn.catchMap}" target="_blank" rel="noopener">an interactive catchment map and a PDF map for each area</a>. The checker uses the same catchments, so your postcode gives you the answer.`],
  ['How do school places work in Doncaster?',
    `When a school has more applicants than places, the City of Doncaster Council gives them to children in care first, then children in the catchment, then brothers and sisters, then the children who live nearest, in a straight line. Most academies use the same rules; church schools set their own. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
  ['How do you know how hard each school is to get into?',
    `Doncaster doesn’t publish how far the last place went. The Department for Education publishes, for every school, <a href="${DFE}" target="_blank" rel="noopener">how many families put it first and how many of them got a place</a>, and the checker shows that for each of the last four years.`],
  ['When do I apply for a Reception place for September 2027?',
    `Apply online to <a href="${dn.apply}" target="_blank" rel="noopener">the City of Doncaster Council</a> by Friday 15 January 2027. You can name up to three schools, in the order you want them, and the council encourages you to include your catchment school.`],
  ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027, by email.'],
  ['Can my child get into a school outside our catchment?',
    `Often. In the latest year, ${open} of the ${total} schools here offered a place to everyone who put them first. Where a school was oversubscribed, the checker says so, and how many first choices missed out.`],
  [`Which are the best primary schools in ${town}?`,
    'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
];
// near: an example from just over the border, "From Bircotes, that’s Nottinghamshire County Council"
export const dnBorder = (town: string, near: string): [string, string] => [
  'We live just over the council border. Which council do I apply to?',
  `The council for where you live, even when you want a school in another council’s area. ${near}, and you can still name ${town} schools on that form. The checker covers ${COVERED} schools.`,
];
export const dnTail: [string, string][] = [
  ['When are the school term dates and holidays?',
    termAnswer('Doncaster', 'Doncaster', url)],
  ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
];
