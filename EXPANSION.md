# Covering the rest of North Yorkshire

Next after North Yorkshire: the Humber councils, planned in [HUMBER.md](HUMBER.md).

Plan, updated 9 November 2026.

## Where we are

| Old district | Area page | Schools | Status |
| --- | --- | --- | --- |
| Harrogate | `/harrogate-primary-schools/` | 67 | Live |
| Hambleton | `/northallerton-primary-schools/` | 51 | Live 9 Nov |
| Selby | `/selby-primary-schools/` | 40 | Live 9 Nov |
| Ryedale | `/malton-primary-schools/` | 29 | Live 9 Nov |
| City of York | `/york-primary-schools/` | 48 | Live |
| Scarborough | `/scarborough-primary-schools/` | 40 | Live 9 Nov |
| Richmondshire | `/richmond-primary-schools/` | 25 | Live 9 Nov |
| Craven | `/skipton-primary-schools/` | 31 | Built 9 Nov, not yet live |

When all three are done the checker covers every Reception place in North Yorkshire and York: about 330 schools.

These figures come from a trial build of all three districts (9 November, in a scratch folder, nothing changed). It ran, with the problems listed under each phase below. Richmondshire is 25, not the 34 rows on the council's sheet: four small Dales schools appear twice, and three of its schools (Askrigg, Gunnerside, Middleham) are, or are becoming, junior schools with no Reception class.

**Timing:** applications close on **15 January 2027**. Aim to have all three live and submitted to Google by early December, so they have a chance to be indexed before the January rush.

## The order

1. **Groundwork** (once, before Scarborough). Fixes all three districts need, and the data split.
2. **Phase A: Scarborough, Whitby and Filey** (40 schools)
3. **Phase B: Richmond, Catterick and Leyburn** (25 schools)
4. **Phase C: Skipton, Settle and the Dales** (31 schools)

Each phase ships on its own, so each can go live as soon as it's checked.

---

## 1. Groundwork (before Scarborough)

### Load catchment shapes only near the postcode
With all three districts in, the North Yorkshire file grows from 1.26 MB to 1.96 MB (312 KB to 492 KB with gzip; Cloudflare serves it with brotli, about 290 KB). Nearly all of it, 458 KB of the 492, is catchment shapes. The school details themselves are only 33 KB.

So the split is:
- **Schools:** stay in one file, so the list, map, shortlist and school numbers work exactly as now.
- **Catchment shapes:** go into one file per area. `areas.json` gives each file's bounding box.
- **Loading:** the checker downloads only the areas within reach of the postcode (the search radius plus a margin), before it works out catchments. A Harrogate search then never downloads Scarborough's shapes.
- **My plan page:** loads the shapes round the saved postcode in the same way.
- **Admin coverage map:** still loads everything.

**Check:** the same results as before for test postcodes in every area, a smaller download for each search, and nothing broken on My plan or the admin.

### Build fixes all three districts need (`build/build_data.py`)
- **Duplicate school codes.** Bainbridge, Reeth and Spennithorne have a "Primary" row and an "Infant" row under one code in the 2026 sheet. Their federations are moving to infant/junior pairs: Bainbridge with Askrigg, Reeth with Gunnerside, Spennithorne with Middleham. The fix:
  - keep one school per code, the row with Reception places;
  - name it after that row (for example "Reeth Community Infant School");
  - show the earlier years with a note: "as Reeth Community Primary School".
- **Schools becoming junior schools.** Askrigg's only row with places in 2026 is "Askrigg Junior School", so it has no Reception intake from 2027, even though the national register still lists it from age 4. Leave it out, like the other junior schools: a school whose places in the latest sheet are only on a "Junior" row isn't a Reception school.
- **Shared infant/junior catchments.** For example "Reeth Community Infant School & Gunnerside Methodist (VC) Junior School" goes to the infant school, which the existing shared-catchment matching already does.
- **"Cof E" spelling.** Carleton Endowed is spelt "Cof E" in the sheet and "CofE" on the map, so its catchment doesn't match. Treat "Cof E" as "CE" when comparing names.
- **Cut-off with no group.** Stakesby (Whitby) 2026 reads "Distance - 0.314 miles" and doesn't say who the last place went to. Show it as not published, with a note, as for Sinnington 2023 (decision 2).
- **2023 names to match by hand,** because their 2023 names differ too much to match automatically:
  - the two Sutton-in-Craven schools ("Sutton in Craven C of E (VC)" and "Sutton in Craven Comm.");
  - Filey Infants ("Filey C of E (VC) Infant and Nursery School (N)");
  - St Peter's Catholic, Scarborough ("St Peters Roman Catholic Primary School, Scarborough").
- **Places:** St Mary's Catholic, Richmond comes out as "Cross Lanes" from its address. Set it to Richmond.

### Naming rules (`astro/src/lib/schoolpages.ts`)
- **Drop more abbreviations.** "VA" and "VC" (Austwick, Burnsall, Cracoe and Rylstone), "Cof E" (Carleton Endowed) and "Primary & Nursery Academy" (Braeburn).
- **Set two addresses by hand** in `slugs.json` before their first build, so they're clear from day one:
  - `sutton-in-craven-ce-primary-school` and `sutton-in-craven-community-primary-school`, since otherwise the two get the same name;
  - `richmond-methodist-primary-school`, because people search "methodist primary school richmond north yorkshire".
- **Check before building:** none of the 235 live addresses change (the lock file guarantees it), and existing schools' displayed names don't change.

### Area wording from the area table
Each new area has meant hand-editing the area list in eight places: the home page title, description, coverage line, heading and "no schools" message, How places work, My plan, Advertise and the share image text. Generate those lists from `AREA_INFO` instead, so a new area is one line in `specs.ts` plus its page.

---

## The checklist for each phase

The same steps for every district. Phase A, B and C below only list what's specific to each.

1. **Data:** add the district to `FULL`, run the build, and explain or fix every gap it prints:
   - a school without a map point, Ofsted record or catchment;
   - a missing year;
   - new cut-off wording.
2. **Review every new school:**
   - four years of figures;
   - a matched 2023 row that is really that school;
   - catchment, town or village, and type.
3. **Contacts and websites:**
   - `fetch_contacts.py`, which looks up only the new schools;
   - `check_websites.py`;
   - every broken or hijacked link replaced with the school's real site (add to `WEB`), checked in a browser where a site blocks automated checks;
   - web host emails kept out.
4. **Area:** one line in `AREA_INFO`: key, label, short name, page name, address, district, ONS code and example postcode. Then the area page, using `AreaPage`, with questions from Google's suggestions and that area's local mix-ups.
5. **Build and check:**
   - `npm run build`, then `npm run lock-slugs`;
   - every live address still works (compare with the live sitemaps);
   - new addresses read cleanly;
   - at least 15 random postcodes across the district match the council's own catchment map;
   - pages checked in the browser on desktop and phone;
   - the admin coverage map shows the district as fully covered.
6. **Ship:** commit, merge to `main`, push, then check the live pages and sitemaps.
7. **Search Console:**
   - add `sitemap-<area>.xml` with its full address;
   - request indexing for the area page;
   - two weeks later, check the Pages report filtered by that sitemap.

   Google's daily limit on indexing requests is small, so one area page a day.
8. **Ads:** the new ad area appears in the admin automatically. Add it to the price table in MONETISATION.md.

---

## Phase A: Scarborough, Whitby and Filey (40 schools)

**Area page:** `/scarborough-primary-schools/`, titled "Scarborough, Whitby and Filey primary schools". The district code is E07000168. Possible groups on the page: Scarborough and Eastfield, Whitby and the moors villages, Filey and Hunmanby, the villages inland.

**Schools:** 40 primary and infant schools. These include the Scarborough town schools (Friarage, Gladstone Road, Northstead, Overdale, Seamer and Irton, Thomas Hinderwell, Wheatcroft, Braeburn, Barrowcliff, Lindhead, Newby and Scalby, West Cliff), Whitby (East Whitby, Stakesby, Airy Hill, Ruswarp, Sleights), Filey Infants, Hunmanby, and the moors villages.

**Specific to Scarborough:**
- **Filey:** Filey Junior School starts at Year 3 and stays out; Filey Infants is in. The page should explain the infant-to-junior move, as the Malton page does for Pickering.
- **Stakesby (Whitby):** its 2026 figure has no group (see groundwork).
- **No council catchment, as expected:** St George's (Eastfield), St Hedda's (Egton Bridge), St Peter's (Scarborough), St Martin's CE (voluntary aided).
- **Town schools are likely to fill.** The "hardest to get into" table will have rows here, unlike Ryedale.
- **Search mix-ups (Google suggestions):**
  - "Scarborough primary school" also brings up Scarborough in Western Australia.
  - "Whitby primary school" brings up Whitby in Ellesmere Port, Cheshire.
  - Parents search "Scarborough school catchment areas".
  - Answer each on the page.
- **Borders:** East Riding (Bridlington) and Redcar and Cleveland (Loftus). Those postcodes should show "not covered", and the page should say which council to apply to.
- **This is the biggest phase.** It's the one that needs the catchment loading from the groundwork.

## Phase B: Richmond, Catterick and Leyburn (25 schools)

**Area page:** `/richmond-primary-schools/`, titled "Richmond, Catterick and Leyburn primary schools, North Yorkshire" (decision 1). The district code is E07000166.

**Schools:** 25, including:
- Richmond (Richmond Methodist, St Mary's Catholic, Trinity Academy);
- the Catterick Garrison schools (Cambrai, Carnagill, Le Cateau, Wavell, Hipswell, Colburn);
- Leyburn, Hawes, Middleton Tyas, Barton, Melsonby;
- the Dales schools (Bainbridge, Reeth, Spennithorne, Hunton and Arrathorne).

**Specific to Richmondshire:**
- **Dales schools:** the duplicate rows and Askrigg's move to a junior school (see groundwork). The page explains the three infant/junior pairs: Bainbridge and Askrigg, Reeth and Gunnerside, Spennithorne and Middleham.
- **Forces families:** Catterick Garrison is the biggest army garrison in the country.
  - The page answers applying before a posting under the School Admissions Code, as the Northallerton page does for RAF Leeming.
  - Cambrai is a free school with no catchment.
  - Garrison schools have many in-year moves, but the checker only covers Reception entry.
- **Names:** keep "Methodist" in Richmond Methodist's name and address. St Mary's place becomes Richmond.
- **Shared catchment with Hambleton.** One catchment is shared by Hunton and Arrathorne and Michael Syddall (both Richmondshire) with Crakehall and Leeming St John's (Hambleton). It's already on the site for the two Hambleton schools. This phase adds the two Richmondshire schools to it. Check Crakehall's and Leeming St John's answers don't change.
- **Search mix-ups:** "Richmond primary school" searches are dominated by Richmond in London, which is why the title and page say North Yorkshire. Parents also search "methodist primary school richmond north yorkshire" and "st mary's primary school richmond north yorkshire".
- **Borders:** Darlington, County Durham (Barnard Castle) and Westmorland and Furness (Kirkby Stephen).

## Phase C: Skipton, Settle and the Dales (31 schools)

**Area page:** `/skipton-primary-schools/`, titled "Skipton, Settle and the Dales primary schools". The district code is E07000163.

**Schools:** 31, including:
- Skipton (Water Street, Greatwood, Skipton Parish, Christ Church, St Stephen's Catholic);
- Settle, Giggleswick, Ingleton, Bentham, Grassington, Gargrave, Embsay;
- Cononley, Cowling, Glusburn, Sutton-in-Craven (two schools), Kildwick, Bradleys Both, Carleton Endowed;
- the Dales villages.

**Specific to Craven:**
- **Sutton-in-Craven:** two schools with near-identical names, so hand-matched 2023 rows and hand-set addresses (see groundwork).
- **Carleton Endowed:** the "Cof E" catchment fix.
- **"VA" and "VC" in names:** Austwick, Burnsall, Cracoe and Rylstone.
- **No council catchment, as expected:** St Stephen's Catholic.
- **Secondary and grammar schools.** Parents search "Skipton Academy / Skipton Grammar / Skipton Girls' High catchment area". The page should say the checker covers primary schools only, and that Ermysted's and Skipton Girls' High are grammar schools with their own tests.
- **Borders:** Bradford (Keighley, Silsden, Steeton), Lancashire (Barnoldswick and Earby are Lancashire, not North Yorkshire, which trips people up) and Westmorland and Furness (Sedbergh). The page should say which council to apply to.

---

## What's already done (9 November 2026)

- **Selby and Hambleton:**
  - 54 schools, the Northallerton and Selby pages, a sitemap per area and locked page addresses.
  - Three catchment errors on the live site fixed: Selby Abbey's own catchment, Selby Community's shared one, and Topcliffe/Dishforth.
  - A "children of staff" cut-off case.
  - 33 broken or hijacked school website links replaced.
- **Ryedale:**
  - 22 schools and the Malton page.
  - Sinnington 2023 shown as not published rather than guessed.
  - Cut-off shared catchment names matched (Pickering Infant).
  - Clearer names for the Catholic academies.
  - Area pages say when no school stands out as hard to get into.
- **Groundwork:** done (see section 1). Catchment shapes now load per district, only near the postcode searched.
- **Scarborough:**
  - 40 schools and the Scarborough page, with Scarborough and Filey, and Whitby and the Esk Valley, listed separately.
  - Northstead gets its two shared catchments, with Gladstone Road and with Friarage.
  - Four website links fixed: Gladstone Road, Overdale, Sleights and St Hedda's. Hackness and Wykeham's shared site blocks automated checks.
  - 36 random postcodes match the council's map. The check script now sends the council's map grid references, because latitude and longitude come out about 70 m off near boundaries.
- **Richmondshire:**
  - 25 schools and the Richmond page, with Richmond and Catterick, and Wensleydale and Swaledale, listed separately.
  - Bainbridge, Reeth and Spennithorne: their 2026 figures sit on the old primary row and their 2027 places on the new infant row, so the build joins the two.
  - Hunton and Arrathorne now gets the catchment it shares with Michael Syddall, Crakehall and Leeming St John's. Shared catchment names are also matched two parts at a time, because "Hunton & Arrathorne" has its own "&".
  - "Trinity Academy Richmond" keeps "Academy" where it is in its name and address.
  - North and South Cowton and Melsonby share a federation site; each gets its own office email. Barton gets its own email, not its trust's.
  - 28 random postcodes match the council's map.
- **Craven:**
  - 31 schools and the Skipton page, with Skipton and South Craven, and Settle, Grassington and the Dales, listed separately.
  - Websites fixed: Greatwood (now .org.uk), Skipton Parish (parish.ycst.co.uk) and Cracoe and Rylstone (its own domain has lapsed, so it links to its page on the Upper Wharfedale federation's site).
  - Giggleswick, Hellifield and Long Preston share the Ribblesdale Federation site; each gets its own office email.
  - 26 random postcodes match the council's map.
  - With Craven, every North Yorkshire district is fully covered. The admin's "2 left to add" are Askrigg, which the national register still lists from age 4, and one Harrogate school that was already counted before.
- **Admin:** the coverage page's live areas are now a sortable table below the map, with a totals row.
- **Search Console:** sitemaps submitted on 9 November. Scheduled tasks on 10 and 11 November add the Ryedale sitemap and request indexing for the Selby, Northallerton, Malton, home and York pages. Check the Pages report around 23 November.

---

## Decisions for you

1. **Richmondshire's page address:**
   - `/richmond-primary-schools/`, titled "… North Yorkshire" (recommended: short, and the title tells it apart from Richmond in London);
   - or `/richmond-north-yorkshire-primary-schools/`;
   - or `/catterick-and-richmond-primary-schools/`.
2. **Stakesby's 2026 figure** ("Distance - 0.314 miles", no group):
   - show 2026 as not published, with a note (recommended);
   - or you email the council to ask who the last place went to, and we use their answer.
3. **Askrigg:** leave it out, as it has no Reception class from 2027 (recommended), or show it with a note saying Reception is now at Bainbridge?
