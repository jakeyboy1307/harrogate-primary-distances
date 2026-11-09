# Covering the rest of North Yorkshire

Plan, 9 November 2026.

**Status, 9 November 2026:** groundwork and Selby and Hambleton are built on the `selby-hambleton` branch, not yet live. Still to do for this phase: deploy, then the Search Console steps below. Changes from the plan:
- The data download split is held back until Scarborough. With Selby and Hambleton in, it went from about 170 KB to 270 KB compressed, which is fine, and splitting it means changing how the list, map and shortlist find schools.
- Building it turned up three wrong catchment answers on the live site, now fixed: central Selby postcodes in Selby Abbey's own catchment showed no catchment school, Selby Community Primary was missing from the shared Selby Community/Selby Abbey catchment, and Topcliffe was missing from the catchment it shares with Dishforth.
- A "children of staff" cut-off (Pickhill, 2026) is now its own case, worded like the brothers and sisters one.
- Every school's website link was checked by opening it. 33 were broken or missing (old council addresses, trust sites that moved, and Burneston's old domain, now a cashback site); each now has its school's working address. `build/check_websites.py` repeats the check.
- 28 random postcodes across both districts were checked against the council's own catchment map: all agree.

## Where we are

The checker has every primary school in the Harrogate district and City of York, plus the North Yorkshire schools within 15 miles of York Minster. The counts come from the council's 2026 admissions sheet:

| Old district | Schools on the council sheet | In the checker | Left to add | Status |
| --- | --- | --- | --- | --- |
| Harrogate | 69 | 67 | 0 (2 are junior schools) | Full |
| Selby | 40 | 29 | **11** | Partial |
| Hambleton | 51 | 8 | **43** | Partial |
| Ryedale | 30 | 7 | 23 | Partial |
| Scarborough | 41 | 0 | 41 | Not started |
| Richmondshire | 34 | 0 | 34 | Not started |
| Craven | 31 | 0 | 31 | Not started |

All seven districts are one council (North Yorkshire). They use the same admissions sheets, the same catchment map and the same Ofsted file, so each new district is mostly configuration rather than a new data source.

**Timing:** Reception applications close on **15 January 2027**. Parents search the most between now and then, so Selby and Hambleton should go live and be submitted to Google before mid-December.

## The order

1. **Groundwork** (once, makes every later district quick)
2. **Selby and Hambleton** (54 schools, two area pages)
3. **Ryedale** (finish it: Malton, Norton, Pickering, Helmsley)
4. **Scarborough** (Scarborough, Whitby, Filey: the biggest one left)
5. **Richmondshire and Craven** (Richmond, Catterick Garrison, Leyburn; Skipton, Settle)

When step 5 is done, all of North Yorkshire is covered. Steps 3 to 5 each repeat the step 2 checklist.

---

## 1. Groundwork

### Data build (`build/build_data.py`, `build/fetch.sh`)
- **Choose districts by name.** Swap the "within 15 miles of York" rule for a `FULL = ('Harrogate', 'Selby', 'Hambleton')` list, and keep the 15-mile rule only for districts still partly covered (Ryedale). Each later phase then adds one word to `FULL`.
- **Fetch the whole county's catchments.** `fetch.sh` currently asks only for a box round Harrogate and York (latitude 53.65 to 54.35). Hambleton reaches up to Stokesley at about 54.5 and Selby goes down to Kirk Smeaton at about 53.64. Drop the box and download every catchment in North Yorkshire.
- **New cut-off wording.** In 2026, Pickhill's last place is listed as "Staff - 10.003 miles", which `parse_cutoff` can't read, so the build would stop. Treat it like "Criteria" (the school's own rules). Ryedale will need the same fix for Sinnington's 2023 figure, which is a bare "3.03" with no label.
- **Clean up names.** Remove "(formerly …)" from names, which affects Leeming St John's. Schools called just "… Academy" (Alanbrooke, Roseberry, Keeble Gateway) shouldn't be renamed "… Primary School" on their pages.
- **Junior and infant schools.** Junior schools are spotted by name at the moment. Use the national schools register's (GIAS) lowest age instead, so a junior school without "Junior" in its name is still left out. Check Roseberry Academy in Great Ayton, which sits beside Marwood Infant School.

### One list of areas (`astro/src/lib`)
Area details are spread across five files today, each assuming there are two areas, "harrogate" or "york": `specs.ts` (AREAS, AREA_HOME), `sponsors.ts` (areaOf), `schoolpages.ts` (areaOf, area page links), `copy-data.mjs` and the Footer. Replace them with one table, where each area has a key, name, page address, its districts, ONS code and an example postcode. A new area then needs one new line.

### Split the data so the checker stays fast
The checker downloads every school before a search: about 170 KB compressed now, rising to about 500 KB once the whole county is in. Split the North Yorkshire file by area, list each area's bounding box in `areas.json`, and download only the areas near the postcode. The York and Harrogate pages stay the same size.

### Protect existing page addresses
School page addresses are worked out from school names, so a new school with the same short name could quietly change an existing school's address. I checked Selby and Hambleton and no existing address changes, but later districts might. Add a `slugs.json` lock file: the build fails if any published address would change, and any planned change gets a 301 redirect.

### Search Console groundwork
- **One sitemap per area.** Split `sitemap.xml` into an index with one sitemap per area. Search Console's Pages report can be filtered by sitemap, which shows how many Selby or Hambleton pages Google has indexed.
- **Honest last-updated dates.** Every page currently says it changed on the day of the build. Use the data refresh date for school and area pages, so Google keeps trusting the dates.

---

## 2. Selby and Hambleton

### Schools to add

**Selby (11):** Brotherton and Byram, Burton Salmon, Camblesforth, Carlton, Chapel Haddlesey, Fairburn, Hensall, Kellington, Kirk Smeaton, Monk Fryston, Whitley and Eggborough.

**Hambleton (43):** Ainderby Steeple, Alanbrooke Academy, All Saints Catholic (Thirsk), Alverton, Applegarth, Appleton Wiske, Bedale, Bilsdale Midcable Chop Gate, Brompton, Broomfield, Burneston, Carlton and Faceby, Carlton Miniott, Crakehall, East Cowton, Great Smeaton, Husthwaite, Hutton Rudby, Ingleby Greenhow, Keeble Gateway, Kirkby and Great Broughton, Knayton, Leeming RAF, Leeming St John's, Marwood Infant, Mill Hill, Oakbridge, Osmotherley, Pickhill, Romanby, Roseberry, Sacred Heart (Northallerton), Sessay, Snape, South Kilvington, South Otterington, Sowerby, St Nicholas (West Tanfield), St Peter's Brafferton, Stokesley, Thirsk, Thornton Watlass, Topcliffe.

### For each school
Built the same way as today's schools, with automatic matching by council code, postcode and name:
- Four years of figures (2023 to 2026): places, applications, first choices and how far the last place went
- Map point, address and website (council school points)
- Catchment area (council catchment map). The Catholic academies, All Saints and Sacred Heart, have no catchment area, which is expected.
- Ofsted outcome
- Phone and email (`fetch_contacts.py`)

The build prints any school it couldn't match. The phase isn't finished until that list is empty or every school on it is explained.

### Pages
- **Two new area pages:**
  - `/selby-primary-schools/`: Selby, Tadcaster, Sherburn in Elmet, Brayton, Barlby, Riccall
  - `/northallerton-primary-schools/`: titled "Northallerton, Thirsk and Bedale primary schools", also covering Stokesley, Great Ayton, Easingwold and the villages. People search for those towns, not "Hambleton". This is your call (decision 1 below).

  Each page gets the usual sections (hardest to get into, took everyone, Outstanding, every school by town) and FAQs based on Google's suggestions, as with Harrogate and York. Local questions to cover: for Selby, families near Leeds and Wakefield and which council to apply to; for Hambleton, forces families at Leeming, Topcliffe and Dishforth, and Stokesley and Hutton Rudby families who look at Teesside schools.
- **54 new school pages,** made automatically. That takes the site from 159 to 213 school pages.
- **The 37 near-York Selby and Hambleton schools already on the site** move their home to their own district page. Their addresses don't change. Only the breadcrumb and the "every school nearby" link change. The York page keeps its "Just outside York" list, chosen by distance instead of "not Harrogate".
- **Copy that names the areas:** the home page title, description and coverage line, the "no schools in range" message, the example postcode buttons (add Northallerton and Selby), the home FAQ about catchment maps, the footer's "Areas we cover", How places work, Privacy and Advertise.

### Map
- **Checker map:** needs no changes. It centres on the postcode, and the new catchments and pins come from the data.
- **Admin coverage map:** add Selby (E07000169) and Hambleton (E07000164) to the area table so they show as fully covered. Ryedale stays partly covered. "Plan the next area" then shows Ryedale and the four untouched districts.

### Ads and admin
- **New ad areas.** Add `selby` and `hambleton` as ad areas. The admin form, the Worker's checks and the dashboard all read the same list, so they pick these up.
- **Schools near York.** Schools within 15 miles of York stay in the `york` ad area as well as their district's, so any ad already sold for "York and villages" keeps showing on them.
- **Search stats.** The stats key each search by area, so Selby and Hambleton get their own counts instead of falling under "york".
- **Pricing.** Add both areas to the price table in MONETISATION.md.

### Checks before going live
1. The build reports no unexplained gaps.
2. Ten test postcodes give the same catchment school as the council's map: DL7 Northallerton, YO7 Thirsk, DL8 Bedale, TS9 Stokesley, DL6 Osmotherley, YO61 Easingwold, YO8 Selby, LS24 Tadcaster, WF11 Brotherton and DN14 Whitley.
3. The figures and wording look right for the odd cases: Pickhill (staff), Burneston and Oakbridge ("criteria"), East Cowton (7.9 miles), and the forces schools.
4. Postcodes just over the border (Leeds, Wakefield, Doncaster, Middlesbrough, Stockton) show "not covered yet" and don't break anything.
5. The data download size and Lighthouse score on a phone haven't got noticeably worse.
6. Check everything on the branch's Cloudflare preview, then merge to `main`.

### Google Search Console (on launch day, then two weeks later)
I'll check the exact menu names against Google's current help pages before you do these.

**On launch day:**
1. **Add the sitemap.** In Search Console go to Sitemaps, add `sitemap.xml` (the new index file) and check it reads "Success" with the right page count.
2. **Request indexing.** In URL inspection, paste each new area page address, then Request indexing. Also request the home page and the York page, since both changed. Google only lets you do a handful a day, so school pages are left to the sitemap and the internal links.
3. **Optional: Bing.** In Bing Webmaster Tools, import the site from Search Console, and switch on Crawler Hints in Cloudflare so Bing hears about changes straight away.

**Two weeks later:** open Pages, filter by the Selby and Hambleton sitemaps, and note:
- **Indexed vs. not indexed:** aim for the area pages within a week and most school pages within four to six weeks.
- **"Crawled, currently not indexed":** if many school pages land here, Google sees them as too alike. Many Hambleton village schools took everyone every year, so their pages are similar. The fix is giving each one more of its own content (applications trend, Ofsted detail, nearby schools), not asking Google again.
- **Search results:** impressions for "Northallerton primary schools", "Selby catchment area" and the school names.

---

## 3 to 5. The rest of the county

Each one follows the step 2 checklist: add the district to `FULL`, add a line to the area table, write the area page's FAQs, check the build's gaps and test postcodes, then do the Search Console steps.

| Phase | Area page | Schools to add | Known quirks |
| --- | --- | --- | --- |
| 3 | Malton and Pickering (Ryedale) | 23 | Sinnington's unlabelled 2023 cut-off |
| 4 | Scarborough, Whitby and Filey | 41 | Biggest page; Whitby may want its own section |
| 5a | Richmond and Catterick | 34 | Big forces population at Catterick Garrison |
| 5b | Skipton and Settle (Craven) | 31 | Borders Lancashire and Bradford |

---

## Decisions for you

1. **Hambleton's page:** `/northallerton-primary-schools/` ("Northallerton, Thirsk and Bedale"), which I recommend, or `/hambleton-primary-schools/`?
2. **Schools near York in Selby and Hambleton:** make their home page their own district's page while they stay listed on the York page (recommended), or leave them under York?
3. **Ads:** should Selby and Hambleton be sold as two separate ad areas from launch?
