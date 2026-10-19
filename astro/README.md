# Yorkshire School Checker (Astro redesign)

The "exercise book" redesign from the Paper file *Yorkshire school check*, built with Astro. It uses the same school data and the same admissions logic as the live single-page checker in the folder above.

## Pages

- `/` Find schools: postcode onboarding, then results with your ranked list, every school in range, a map view and the school slide-out (a bottom sheet on phones).
- `/plan/` My plan: countdown to the closing date, the timeline, your list in order, a plan check and other schools near you.
- `/how-places-work/` How places work: the admissions queue, what "last place" means, reading the year by year, picking your five and the data sources.

## Running it

```sh
npm install
npm run dev        # copies ../build/data.json into public/, then starts Astro on http://localhost:4321
npm run build      # writes the static site to dist/
```

For GitHub Pages under the repo's sub-path, build with the base set:

```sh
SITE_BASE=/harrogate-primary-distances npm run build
```

## Data and services

- School data comes from `../build/data.json`, produced by the yearly refresh described in the main README. `npm run data` copies it in and adds each school's office phone and email from `../build/contacts.json`.
- Postcodes: postcodes.io. Walking routes: the FOSSGIS OSRM table service, cached for the browser session because it's rate-limited. Map tiles: Esri World Street Map. Catchments: North Yorkshire Council.
- Your list is stored in `localStorage` under `ysc-shortlist`, the same key as the live site, so existing shortlists carry over. The last search is stored under `ysc-search`.

## Where the logic lives

- `src/lib/engine.ts`: catchment checks, distances and the year-by-year verdicts, ported from `build/template.html`.
- `src/lib/plist.ts`: the draggable list (SortableJS, press-and-hold on touch, arrow keys on the handle).
- `src/lib/panel.ts`: the school slide-out.
- `src/lib/map.ts`: the Leaflet map with list-numbered pins.
