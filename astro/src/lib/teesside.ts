// The questions Middlesbrough's and Redcar and Cleveland's area pages share. Neither council publishes its admission
// zones as map data, so the checker can't say which zone you're in; each council's own wording is in lib/engine.ts.
import { COUNCILS, mapTipHtml, placesGo } from './engine';
import { COVERED } from './specs';
import { url } from './url';

export function teesFaqs(key: 'Middlesbrough' | 'Redcar and Cleveland', town: string, open: number, total: number, figures: string): [string, string][] {
  const c = COUNCILS[key];
  return [
    [`What is my catchment school in ${town}?`,
      `Schools here call it an admission zone. ${c.name} ${c.mapNote}, so the checker can’t tell you which zone you’re in. ${mapTipHtml(c)}. Then put your postcode into the <a href="${url('')}">school checker</a> to see how far every school near you is and how hard each has been to get into.`],
    [`How do school places work in ${town}?`,
      `${placesGo(c)}. Catholic schools usually put baptised Catholic children first. <a href="${url('how-places-work/')}">How school catchment areas work</a> explains the queue.`],
    ['How do you know how hard each school is to get into?', figures],
    ['When do I apply for a Reception place for September 2027?',
      `Apply online to <a href="${c.apply}" target="_blank" rel="noopener">${c.name}</a> by Friday 15 January 2027. You can name up to three schools, in the order you want them.`],
    ['When are primary school places announced?', 'Offers go out on national offer day, Friday 16 April 2027.'],
    ['Can my child get into a school outside our zone?',
      key === 'Redcar and Cleveland'
        ? `Often. In the latest year, ${open} of the ${total} schools here offered a place to every family who put them first. Where a school was full, the checker shows how many first choices missed out.`
        : `Often. In the latest year, ${open} of the ${total} schools here offered a place to everyone who applied in time. Where a school was full, the checker shows how far from the school the last place went.`],
    [`Which are the best primary schools in ${town}?`,
      'There’s no official ranking, so be wary of league tables. Ofsted is the fairest guide, alongside a visit. The checker shows each school’s latest Ofsted outcome, and each school’s own page explains it.'],
    ['We live just over the council border. Which council do I apply to?',
      `The council for where you live, even when you want a school in another council’s area. You can name ${town} schools on that form. The checker covers ${COVERED} schools, so you can compare schools on both sides of the border. Stockton-on-Tees schools aren’t in it yet.`],
    ['When are the school term dates and holidays?',
      'Most schools here are academies, which set their own term dates, so check with the school. Its website is on its page in the checker.'],
    ['How do I find open days?', 'Ask the school. Open the school in the checker for its phone number, email and website.'],
  ];
}
