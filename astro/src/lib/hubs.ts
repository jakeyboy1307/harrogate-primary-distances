// The council pages: one for each council the checker splits into several area pages, so a parent searching
// "Sheffield primary school catchment areas" lands on the whole council, then picks their part of it. Councils
// with one area page (York, Middlesbrough, Redcar) don't need one; Wakefield's and Rotherham's names are already
// their own constituency pages. Each is src/pages/<page>.astro, using CouncilPage.
import { AREA_INFO, type Area } from './specs';

export interface Hub {
  page: string;   // the page's address
  name: string;   // what parents call it: "Sheffield", "the East Riding"
  file: string;   // the council's data file (public/data)
}
// by council, as COUNCILS in lib/engine.ts names them
export const HUBS: Record<string, Hub> = {
  'North Yorkshire': { page: 'north-yorkshire-primary-schools/', name: 'North Yorkshire', file: 'north-yorkshire.json' },
  'East Riding of Yorkshire': { page: 'east-riding-primary-schools/', name: 'East Riding', file: 'east-riding.json' },
  'Kingston upon Hull, City of': { page: 'hull-primary-schools/', name: 'Hull', file: 'hull.json' },
  Leeds: { page: 'leeds-primary-schools/', name: 'Leeds', file: 'leeds.json' },
  Bradford: { page: 'bradford-primary-schools/', name: 'Bradford', file: 'bradford.json' },
  Kirklees: { page: 'kirklees-primary-schools/', name: 'Kirklees', file: 'kirklees.json' },
  Calderdale: { page: 'calderdale-primary-schools/', name: 'Calderdale', file: 'calderdale.json' },
  Sheffield: { page: 'sheffield-primary-schools/', name: 'Sheffield', file: 'sheffield.json' },
  Barnsley: { page: 'barnsley-primary-schools/', name: 'Barnsley', file: 'barnsley.json' },
  Doncaster: { page: 'doncaster-primary-schools/', name: 'Doncaster', file: 'doncaster.json' },
};
export const hubOf = (council: string): Hub | undefined => HUBS[council];
// a council's area pages, in the order AREA_INFO lists them
export const areasOf = (council: string) => (Object.keys(AREA_INFO) as Area[]).filter((a) => AREA_INFO[a].council === council);
