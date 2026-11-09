# Yorkshire school checker

A map tool for parents choosing a Reception place anywhere in North Yorkshire (every old district: Harrogate, Craven, Hambleton, Richmondshire, Ryedale, Scarborough and Selby), in York and in the East Riding of Yorkshire. Enter a postcode and every primary school nearby is shown with your walking or straight-line distance, whether you're in its catchment, and how far the last place went on national offer day in 2023, 2024, 2025 and 2026. Modelled on [SW London primary school distances](https://peterstuart3-arch.github.io/sw-primary-distances/), reworked for North Yorkshire's catchment-first admissions.

Live at **https://yorkshireschoolchecker.co.uk**. The site is built from `astro/` (see `astro/README.md`) and needs a connection for the map tiles, postcode lookups (postcodes.io) and walking routes (FOSSGIS OSRM). The `index.html` at the top of this folder is the earlier single-page version.

## Hosting

- **Cloudflare Worker `yorkshire-school-checker`** serves the built site as static files. Cloudflare builds it from this repo on every push to `main`, with root directory `astro`, build command `npm run build` and deploy command `npx wrangler deploy` (settings in `astro/wrangler.jsonc`). It's also at `yorkshire-school-checker.jake-adams1307.workers.dev`.
- **Domain:** `yorkshireschoolchecker.co.uk` is registered at GoDaddy with its nameservers pointed at Cloudflare. Both it and `www` are custom domains on the Worker.
- **Old address:** `jakeyboy1307.github.io/harrogate-primary-distances` is a GitHub Pages redirect (`pages-redirect/`, published by `.github/workflows/deploy.yml`) that sends people to the same page on the new domain.

## Refreshing the data

Each autumn Data North Yorkshire publishes the new year's admissions sheet. Add its link to `build/fetch.sh`, add the year to `DATASETS` in `build/build_data.py` and to the year menu in `build/template.html`, swap in the latest Ofsted CSV, then:

```sh
sh build/fetch.sh /tmp/harrogate-raw
python3 -I build/build_data.py /tmp/harrogate-raw build/data.json   # needs openpyxl and shapely
python3 -I build/assemble.py build/data.json                         # writes index.html
```

The Astro redesign (`astro/`) also shows each school's office phone and email. Refresh them after the data:

```sh
python3 -I build/fetch_contacts.py build/data.json build/contacts.json --all   # phones from GIAS, emails from school websites
```

Without `--all` it only looks up schools that aren't in `contacts.json` yet, which is what you want when adding an area.

Phone numbers come from Get Information about Schools. GIAS doesn't publish emails, so they're read from each school's own website, and the page each was found on is saved in `contacts.json`. Some school sites block automated visits, so expect a few gaps; those schools show their phone number and a pointer to their website.

The build prints any school it can't match to a map point, Ofsted record or catchment. Faith academies and free schools (14 at the last build) have no council catchment, which is expected: the build lists them. Oakbridge opened in 2024, so it has no 2023 figures.

## Adding a North Yorkshire district

The plan and what's left are in `EXPANSION.md`. For each district:

1. Add it to `FULL` in `build/build_data.py` (and take it out of `NEAR_YORK` if it's there), then run the data build. Check what it prints: any new cut-off wording, renamed or renumbered schools (`FORMERLY`, `KEYS_2023`) and broken school websites (`WEB`).
2. Run `fetch_contacts.py` without `--all` to add the new schools' phones and emails, and `python3 build/check_websites.py` to catch website links that are dead or now belong to someone else.
3. Add the area to `AREA_INFO` in `astro/src/lib/specs.ts`, and give it a page in `astro/src/pages/` using `AreaPage`, like `selby-primary-schools.astro`. The footer, sitemap, school pages, ads and admin all read `AREA_INFO`.
4. `npm run build` in `astro/`, then `npm run lock-slugs` so the new school pages' addresses never change, and commit `src/lib/slugs.json`.

## Adding a new council

The Humber plan is in `HUMBER.md`. A council is more than a district: it has its own figures, catchment map and rules.

1. Write its own build, like `build/build_york.py`, writing the same shape of file as `data.json`. Shared pieces are in `build/common.py`: Ofsted, school types, and the DfE's applications and offers (`read_dfe`, `firsts_year`), which `fetch.sh` downloads for every school in England. Where a council publishes no cut-offs, a year is a `firsts` record: how many put the school first and how many of them got it.
2. Give each school a `con` (its parliamentary constituency, from `read_dfe`) if the council will be split into areas by constituency.
3. Add the council to `areas` in `astro/scripts/copy-data.mjs` and to `COUNCILS` in `astro/src/lib/engine.ts`, keyed by the name postcodes.io gives it.
4. Add its areas to `AREA_INFO` with `council` and, to split it, `constituencies`. Wording like "the checker covers North Yorkshire and York schools" is generated from `AREA_INFO` (`COVERED`), so it updates itself.
5. Then steps 2 to 4 above.

## Feedback form (parked)

The page has a name, email and comments form that sends to the site owner's inbox through [FormSubmit](https://formsubmit.co). It stays hidden until `FEEDBACK_ID` in `build/template.html` is set to the FormSubmit form ID (the random string FormSubmit sends after activation). Set it, then run `assemble.py` again.

## Sources

- North Yorkshire Council admissions statistics, 2022 to 2026 entry ([Data North Yorkshire](https://hub.datanorthyorkshire.org/dataset/school-admissions-2026-2027-yearly-statistics-primary-and-secondary-school)). The 2022 sheet is only used for the 2023 admission numbers.
- Catchment areas and school locations from the layers behind the council's [Finding a school map](https://experience.arcgis.com/experience/4dd5b97eae514b31a067137ebf7cdd6a) (September 2025). The council says the map is for reference only.
- Ofsted management information, state-funded schools, latest inspections as at 30 September 2026.
- East Riding of Yorkshire Council's summaries of primary school allocations, 2024 to 2026 (`build/east-riding/allocations.csv`), catchment areas from the layer behind its catchment finder, and admission numbers. School locations, types and websites from Get Information About Schools.
- DfE [primary and secondary school applications and offers](https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers), school level, 2014 to 2026 entry: for councils that publish no cut-offs, and for each school's constituency.

## Known limits

- Distances run from the postcode centre, not the exact address, and walking routes use OpenStreetMap rather than the council's own network, so there's a 0.1 mile margin of error.
- Sibling priority isn't modelled.
- Academies, voluntary aided and foundation schools set their own policies. Where the council didn't publish a year for them, it's shown as "not published".
- The 2023 sheet labels its distance column "2022", but its figures differ from the 2022 sheet, so they're treated as 2023.
