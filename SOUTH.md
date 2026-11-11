# Plan: South Yorkshire

Sheffield, Doncaster, Rotherham and Barnsley. Researched 10 November 2026, after West Yorkshire went live. Decisions
are at the end. The checklist in [EXPANSION.md](EXPANSION.md) and the West Yorkshire build ([WEST.md](WEST.md))
still apply; this plan only spells out what's different.

## The size of it

South Yorkshire has **377 primary and infant schools taking Reception**, about half of West Yorkshire's 703. Each council
has its own admissions, figures and catchments, so each gets its own build script and ships on its own.

| Council | ONS code | Schools | First choices refused, 2026 | Choices on the form | Catchments | Who got the last place |
|---|---|---|---|---|---|---|
| **Sheffield** | E08000019 | 121 | 33 | 3 | **Yes**, as open data: the council's [2025-26 primary catchment layer](https://sheffieldcitycouncil.cloud.esriuk.com/server/rest/services/AGOL/OpenData/FeatureServer/1) (101 areas, GeoJSON). Church schools have none | **Published** for every full school: places by rule (catchment with siblings, catchment, siblings, other), the distance of the last child offered a place, and who was refused, by rule. PDFs for 2024, 2025 and 2026 |
| **Doncaster** | E08000017 | 91 | 20 | 3 | **Yes**, as map data: the layers behind the council's [catchment finder](https://maps.doncaster.gov.uk/portal/apps/experiencebuilder/experience/?id=862cc0a6abb244928a1c5ca0462d6f8e) (90 primary and 9 infant areas, each with the school's DfE number) | **Not published**: the guide gives first, second and third preferences agreed and refused, which is what the DfE's figures already say |
| **Rotherham** | E08000018 | 87 | 23 | 3 | **Yes**, in the council's [Cadcorp web map](https://maps.rotherham.gov.uk/intranet/en-gb/PublicMap/Rotherham#/frontPage). Whether its layer can be read as data is still to check | **Partly**: the primary booklet names each full school's last rule (distance, catchment) and how many in that rule missed out, but no distances |
| **Barnsley** | E08000016 | 78 | 18 | 3 | **None**: "Barnsley Council does not operate catchment"; places go by distance after brothers and sisters | **Published**: each full school's distance of the last place offered (2025 and 2026), and places by rule for every school (2026) |

School counts and refusals are from the DfE's school-level file (Reception, 2026), which also gives every school's
constituency and its first-choice figures. Every council can fall back on those.

Every council takes **three** choices, so the "up to three" line on how-places-work gains all four.

### What each council gives us

**Sheffield: the richest, like Kirklees.** Its [oversubscribed schools PDF](https://www.sheffield.gov.uk/sites/default/files/2026-04/oversubscribed_infant_and_primary_schools_2026.pdf)
lists, for every full community school, places by rule, the last child's distance in miles and the refusals by rule
(2024 and 2025 are at the same address with the year changed). So a full school reads "everyone in the catchment, plus
others within X" when "Other" children got in, and "only children in the catchment" when catchment children were refused
(Netherthorpe in 2026). Schools that weren't full took everyone. Catholic and Church of England schools are named only as
"also oversubscribed", so they get the DfE's figures. 2023 has no PDF at that address: DfE figures unless one turns up.
The catchment layer is the 2025-26 set; church schools have no catchment.

**Barnsley: like Calderdale.** No catchments, so the search says so (`noCatch`) and full schools read "brothers and
sisters, then children within X" (`near`). The [2027 parents' guide](https://www.barnsley.gov.uk/media/sydlk4be/pimary-school-admission-booklet-2027.pdf)
has 2026's last distances and every school's places by rule; the [2026 guide](https://www.barnsley.gov.uk/media/locjtvek/primary-school-admissions-2026-booklet.pdf)
has 2025's distances. 2023 and 2024 are the DfE's figures unless older guides turn up.

**Doncaster: catchments yes, figures no.** The catchment layers can be read directly (as Kirklees's were), matched by
DfE number, so the checker can say "you're in the catchment for X". Who got in is the DfE's first-choice figures for
every year, as in Redcar, since the council's own table says the same thing. Infant and junior catchments are separate
layers; only primary and infant matter for Reception.

**Rotherham: catchments probably, figures partly.** The booklet's "Further information on the 2026/27 allocations"
names the rule the last places went by at each full school (for example "places filled from category 7 by children
who lived nearest"; Waverley Junior Academy's last places went to catchment children, 49 of them refused). That becomes
a note on 2026, as Hull's and Wakefield's guide notes did, on top of the DfE's figures. Catchments: the Cadcorp map
draws them from a layer; if that layer answers as GeoJSON or WFS without a sign-in or CAPTCHA, read it; otherwise mark
them "not checked" (`cu`) and point to the map.

## What changes in the checker

Little that's new: every piece has been built for an earlier council.
- Four councils in `COUNCILS` (engine.ts), keyed by postcodes.io's names: Sheffield, Doncaster, Rotherham, Barnsley.
- Barnsley's `noCatch` line; Rotherham's `mapData: false` only if its layer can't be read.
- The home page's "Just having a look? Try" list shows one place per council (decision 4), instead of one per area page.

## Area pages (constituencies, as in West Yorkshire)

| Council | Pages |
|---|---|
| **Sheffield (121)**, 6 pages | Brightside and Hillsborough (28) · Heeley (23) · South East: Mosborough, Darnall, Handsworth (23) · Hallam: Crookes, Fulwood, Dore (19) · Central (12) · Stocksbridge and the Sheffield half of Penistone and Stocksbridge (16) |
| **Doncaster (91)**, 4 pages | Doncaster North: Adwick, Bentley, Askern (32) · Doncaster Central: Balby, Wheatley, Bessacarr (30) · Doncaster East: Armthorpe, Thorne, Hatfield (20) · Mexborough and Conisbrough, Doncaster's part of Rawmarsh and Conisbrough (9) |
| **Rotherham (87)**, 3 pages | Rotherham (36) · Rother Valley: Maltby, Dinnington, Wales (30) · Rawmarsh, Wath and Swinton, Rotherham's part of Rawmarsh and Conisbrough (21) |
| **Barnsley (78)**, 3 pages | Barnsley South: Wombwell, Hoyland, Darfield (34) · Barnsley North: Royston, Cudworth, Mapplewell (30) · Penistone, Barnsley's part of Penistone and Stocksbridge (14) |

That's **16 area pages**, each with its own sitemap, and 377 school pages.

## Phases

- **S1: Sheffield (121, 6 pages).** Catchment layer, the three PDFs read by word position (as Kirklees's), DfE for 2023 and church schools.
- **S2: Barnsley (78, 3 pages).** `noCatch` and `near`, from the two guides.
- **S3: Doncaster (91, 4 pages).** Catchment layers, DfE figures.
- **S4: Rotherham (87, 3 pages).** Catchments if the layer reads, DfE figures with a 2026 note from the booklet.

Each phase ships on its own: build, title check, browser and phone checks, admin coverage, docs, then your yes to
push. After each, its sitemaps join the Search Console task.

## Progress

- **Sheffield (S1), 10 November:** live.
  - 121 schools on six pages: `/central-sheffield-`, `/hillsborough-`, `/heeley-`, `/mosborough-`, `/hallam-` and `/stocksbridge-primary-schools/`, one a constituency.
  - Who got in, 2024 to 2026: the council's oversubscribed schools PDFs, read by `build/sheffield_tables.py` into `build/sheffield/allocations.json`. 74 rows, each school's places by rule adding up to its total. Two misprints in 2026 are corrected in the script: Hunters Bar Infant's "114" other places (14) and Mosborough's total of 30 (60).
  - A full school reads "everyone in the catchment, plus others within X" (62 school years), "plus brothers and sisters" (6), or "only children in the catchment, within X" where catchment children were refused (6: Netherthorpe every year, and Dore, Springfield and Wybourn in 2024).
  - Every other year is the DfE's first choices: 2023, schools that weren't full, and the church schools the PDFs only name.
  - Catchments: all 101 from the council's 2025-26 open data layer, each school inside its own. An infant and junior pair's catchment goes to the infant school. Church schools and Broomhill Infant (a foundation school) have none.
  - Renumbered schools: Bankwood, Brigantia Hill Fort (Wincobank Infant and Concord Junior, merged in 2025) and St Patrick's (renumbered on 1 November 2026) are linked to their old numbers. Five more 2025-26 academy conversions are linked by school number.
  - Places: where the register gives only "Sheffield", the school's ward, using the part of a two-part ward named in the school's name ("Totley" in Dore and Totley).
  - Page names: "Nursery & Primary", "Nursery Infant", "Nursery, Infant and Junior School" (Sharrow, a primary) and "Catholic and CofE" (Emmaus) are tidied. Every earlier title is unchanged.
  - Websites added or fixed for four schools; Nether Edge's sits behind a bot check that people pass. 119 phone numbers and 104 emails (Fox Hill's was a named member of staff).
  - The home page's examples are now one per council (decision 4), and the Calderdale and Kirklees pages no longer say "the rest of West Yorkshire is coming".

- **Barnsley (S2), 11 November:** built on the `barnsley` branch, not yet live.
  - 78 schools on three pages: `/barnsley-north-`, `/barnsley-south-` and `/penistone-primary-schools/`, one a constituency.
  - No catchments, as Calderdale: the search says so (`noCatch`) and Barnsley gets the "Ask the school" map line.
  - Who got in, 2024 to 2026: the council's guides for parents, read by `build/barnsley_guide.py` into `build/barnsley/allocations.json`. Each lists every school that was full, with the distance of the last place offered, and an appendix of every school's places by rule. The guide with 2024's figures is gone from the council's site, so it comes from the Internet Archive's copy of April 2025. 2023 is the DfE's first choices.
  - A school not on a year's oversubscribed list took everyone (the council lists every full school); a full school on the council's rules reads "brothers and sisters, then children within X" (55 school years); a full school with its own rules (faith, parish, a village) reads "by the school's own rules, to X" (11). One full school whose places didn't go by distance keeps the DfE's figures.
  - The guide spells some names differently from the register ("Shafton Primary Academy" is "Lift Shafton", Cudworth Churchfield is now Churchfield), so those are matched by number. Hoylandswaine and Summer Lane are linked to their old numbers.
  - Places: the register's village where it has one, else the ward; Gooseacre's "Off Merrill Road, Rotherham" is Thurnscoe.
  - Page names: "Primary Learning Centre" reads as a primary school, and Holy Trinity Catholic and Church of England School drops both faiths. Every earlier title is unchanged.
  - Websites: Gawber's and Sandhill's domains have lapsed and are for sale, so they have none; five more added or fixed. 78 phone numbers (the register's site timed out on the first run, so a second filled them) and 51 emails; six left out (two Enhance Academy Trust inboxes, four named members of staff).
  - Sources download with `build/fetch_barnsley.sh`.

## Decisions (10 November 2026)

1. **Sheffield first**, then Barnsley, Doncaster and Rotherham.
2. **Rotherham catchments: try reading the Cadcorp map's layer**, and mark them "not checked" if it needs a sign-in or blocks automated reads.
3. **Mexborough and Conisbrough gets its own page** (9 schools), so Doncaster has four.
4. **The home page's example places: one per council** (about 15), instead of one per area page. Done with Sheffield.
