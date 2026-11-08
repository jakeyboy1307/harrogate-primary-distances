// Made-up businesses for designing and showing the ad slots. They have no real links and are tagged "Demo".
// They only appear on preview builds (a branch other than main) and local builds, never on the live site:
// see __DEMO_SPONSORS__ in astro.config.mjs.
import type { Sponsor } from './sponsors';

export const DEMO_SPONSORS: Sponsor[] = [
  // School uniform: the obvious fit. Suppliers hold contracts for named schools, so show them only on those schools.
  { demo: true, id: 'uni-hg', name: 'Spa Town Schoolwear', category: 'School uniform', logo: 'ST', colour: '#2747D8',
    blurb: 'Stocks the logo jumpers, book bags and PE kit for this school. Order online or try on in store.',
    cta: 'Shop uniform', url: '#demo', offer: '10% off your first order with code YSC10',
    placements: ['uniform', 'plan', 'area'], areas: ['harrogate'] },
  { demo: true, id: 'uni-yk', name: 'Minster Uniforms', category: 'School uniform', logo: 'MU', colour: '#7A3FB8',
    blurb: 'Badged uniform for this school, with a fitting service on Saturdays.',
    cta: 'Shop uniform', url: '#demo', offer: 'Free name labels with every order',
    placements: ['uniform', 'plan', 'area'], areas: ['york'] },

  // Independent schools buy attention while parents are comparing: one featured card in the results.
  { demo: true, id: 'ind-hg', name: 'Harlow Hill Prep', category: 'Independent school', logo: 'HP', colour: '#1D6B36',
    blurb: 'Co-ed prep for ages 3 to 13. Small classes, wraparound care until 6pm, and a minibus from Knaresborough.',
    cta: 'Book an open morning', url: '#demo', offer: 'Open mornings every Friday this term',
    placements: ['results', 'area'], areas: ['harrogate'] },
  { demo: true, id: 'ind-yk', name: 'Ouse Bank School', category: 'Independent school', logo: 'OB', colour: '#1D6B36',
    blurb: 'Independent primary in York for ages 4 to 11, with forest school and specialist music from Reception.',
    cta: 'Book a visit', url: '#demo',
    placements: ['results', 'area'], areas: ['york'] },

  // Family services: wraparound care, clubs, tutors, shoes, and the house move into a catchment.
  { demo: true, id: 'care-hg', name: 'Busy Bees Breakfast Club', category: 'Wraparound care', logo: 'BB', colour: '#C8382C',
    blurb: 'Breakfast and after-school club with a walking pick-up from six Harrogate primaries.',
    cta: 'Check for a space', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['harrogate'] },
  { demo: true, id: 'care-yk', name: 'Riverside Kids Club', category: 'Wraparound care', logo: 'RK', colour: '#C8382C',
    blurb: 'Before and after school care and holiday clubs across York, with pick-ups from local primaries.',
    cta: 'Check for a space', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['york'] },
  { demo: true, id: 'shoe', name: 'Little Steps Shoes', category: 'School shoes', logo: 'LS', colour: '#8A5300',
    blurb: 'Fitted school shoes for small feet, in Harrogate and York. Book a fitting before the September rush.',
    cta: 'Book a fitting', url: '#demo',
    placements: ['plan', 'area'], areas: ['harrogate', 'york'] },
  { demo: true, id: 'move-hg', name: 'Nidd Valley Homes', category: 'Moving house', logo: 'NV', colour: '#14182B',
    blurb: 'Thinking of moving into a catchment? See homes for sale near the schools you like.',
    cta: 'See homes for sale', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['harrogate'] },
  { demo: true, id: 'move-yk', name: 'Walls & Bar Estates', category: 'Moving house', logo: 'WB', colour: '#14182B',
    blurb: 'Local estate agent covering York and the villages. Free valuation if you’re moving for a school.',
    cta: 'See homes for sale', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['york'] },
  { demo: true, id: 'tutor', name: 'First Words Tutoring', category: 'Tutoring', logo: 'FW', colour: '#2747D8',
    blurb: 'Phonics and reading support for Reception and Year 1, at home or online.',
    cta: 'Find a tutor', url: '#demo',
    placements: ['plan', 'area'], areas: ['harrogate', 'york'] },

  // School profiles: a school (often an academy trust) pays to add open days and a welcome note to its own panel.
  { demo: true, id: 'prof-western', name: 'Western Primary School', category: 'From the school', logo: 'WP', colour: '#2747D8',
    blurb: 'We’d love to show you round. Tours are led by our Year 6 pupils and last about 45 minutes.',
    cta: 'Book a tour', url: '#demo', openDays: ['Tue 18 November, 9:30am', 'Thu 4 December, 1:30pm', 'Wed 7 January, 9:30am'],
    placements: ['profile'], areas: ['harrogate'], urns: [142220] },
  { demo: true, id: 'prof-scarcroft', name: 'Scarcroft Primary School', category: 'From the school', logo: 'SP', colour: '#2747D8',
    blurb: 'Come and see us in action. Bring your child, and meet our Reception team.',
    cta: 'Book a tour', url: '#demo', openDays: ['Wed 19 November, 10am', 'Sat 29 November, 10am'],
    placements: ['profile'], areas: ['york'], urns: [142637] },
];
