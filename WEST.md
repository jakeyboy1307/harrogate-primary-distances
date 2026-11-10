# Plan: West Yorkshire

The next step after North Yorkshire, York, the Humber, Middlesbrough and Redcar: Leeds, Bradford, Kirklees, Calderdale
and Wakefield. Researched 10 November 2026. Decisions still to make are at the end.
The checklist in [EXPANSION.md](EXPANSION.md) and the Humber's groundwork in [HUMBER.md](HUMBER.md) still apply. This plan
only spells out what's different.

## The size of it

West Yorkshire has **703 primary and infant schools taking Reception**, more than the 604 the checker has today. Each of
the five is a separate council with its own admissions, figures and catchments, so each gets its own build script and
ships on its own, as East Riding and Hull did.

| Council | ONS code | Schools | First choices refused, 2026 | Choices on the form | Catchments | Who got the last place |
|---|---|---|---|---|---|---|
| **Calderdale** | E08000033 | 81 | 12 schools | 5 | **None for primary**: places go by distance after brothers and sisters | **Published**: the furthest place offered at each oversubscribed school, every year since 2015 (open data) |
| **Kirklees** | E08000034 | 132 | 38 | **3** | **Yes** ("priority admission areas"), in a public map with each school's DfE number | **Published**: places by rule (catchment, out of area, siblings) and the last on-time distance in metres, 2019 to 2026, academies included |
| **Leeds** | E08000035 | 224 | 71 | 5 | **Yes** for community and VC schools, as GeoPDF maps with real coordinates | **Published**: furthest distance (miles) and the last rule admitted, 2025 and 2026 |
| **Bradford** | E08000032 | 161 | 54 | 5 | Only 11 schools have "priority areas"; the rest go by distance | In the council's "Guide for Parents 2026-2027"; its site was under maintenance today, so not yet seen |
| **Wakefield** | E08000036 | 105 | 30 | 5 | **Yes**, but only as an address lookup behind a reCAPTCHA, plus rough PDF maps | **Not published** (its "places at each school" PDF is 2022 and has no distances) |

School counts and refusals are from the DfE's school-level file (Reception, 2026), which also gives every school's
constituency and its first-choice figures. Every council can fall back on those, as Hull and Redcar do.

### What each council gives us

**Calderdale: the simplest.** Places go to children in care, then brothers and sisters, then by distance. No catchments
to draw or check. Its open data has the furthest pupil offered a place at each oversubscribed school, by year:
[Primary Preferences and Allocations by School](https://dataworks.calderdale.gov.uk/dataset/vq9q6) (CSV, 2015 to 2026).
The catch is that it gives no rule, so we can't tell whether the last place went to a brother or sister. The wording has
to say "the furthest place offered", not "everyone within".

**Kirklees: the richest figures.** [Reception by preference and criteria](https://www.kirklees.gov.uk/beta/admissions/pdf/reception-by-preference-and-criteria-26.pdf)
(one PDF a year, 2023 to 2026 downloaded) gives, for every school:
- places given in catchment and out of area, with and without brothers and sisters;
- whether the school was oversubscribed;
- the distance of the last on-time place, in metres.

That reads straight into "everyone in the catchment, plus others within X" or "only some of the catchment". The figures
cover academies too, in a second table.

Catchments are the "Priority Admission Areas" layer in the council's [public map](https://mapping.kirklees.gov.uk/connect/analyst/mobile/#/main?mapcfg=Priority%20Admission%20Areas%20(Public)).
Its `PrimaryPAA` table has each school's DfE number. Reading the shapes out of the map service needs your OK (see
decision 2): the automatic permission check stopped my test query. The other route is asking Kirklees for the file.

Kirklees is the only one of the five with **three** choices.

**Leeds: good figures, catchments from the maps.** The council's [cut-off distances and criteria](https://www.leeds.gov.uk/sites/default/files/2026-04/cut%20off%20distances%20and%20criteria%20for%20primary%20and%20junior%20schools%202026.pdf)
give, for every school, either "All applicants admitted" (154 of them in 2026) or the furthest distance in miles and
the last rule admitted (mostly "Any Other Children", sometimes "In defined catchment area" or a church rule).
- **Years:** 2026 and [2025](https://www.leeds.gov.uk/sites/default/files/2025-04/primary%20school%20cut%20off%20distances.pdf) found; 2024 and 2023 still to find (the school pages on leeds.gov.uk quote them).
- **Rules:** places go to children in care, exceptional needs, brothers and sisters, the catchment priority area, then everyone else, all by straight-line distance from the school building.
- **Catchments:** published only as PDF maps (in several parts), but they're Esri GeoPDFs. Every page carries British National Grid coordinates, so the boundary lines can be read out as real shapes. That needs GDAL (a free install through Homebrew) and a test on a handful of schools first. The council's address checker is a form, so we check the shapes against the PDFs by eye and with school locations.

**Bradford: mostly distance.** Brothers and sisters, then distance, for most schools. Only 11 have "priority areas".
- Five choices.
- The booklet says the last child's distance for each school is in the "Guide for Parents 2026-2027". That file came back empty today (the council's site said it was under maintenance), so the first build step is fetching it.
- If it has distances for every school, Bradford is as good as Calderdale; if not, it falls back on the DfE figures.
- The 11 priority-area schools are marked `cu` (a catchment the checker can't check).

**Wakefield: like Hull.**
- Catchments exist, but the only accurate source is the council's address search, which sits behind a reCAPTCHA (never automated), and its pyramid maps say they can't show the full detail.
- No cut-offs are published.
- So: DfE first-choice figures, catchments marked `cu`, and the page points to the council's catchment search.
- An optional data request (below) could add both later.

## What changes in the checker

Most of it was built for the Humber and Teesside and carries straight over: per-council build scripts, `common.py`'s
register and DfE readers, councils with three or five choices, `cu` schools, constituency areas and generated coverage
wording. New this time:

1. **Distance without a catchment** (Calderdale, most of Bradford). The year record's "who got in" wording needs a form that doesn't mention a catchment, and for Calderdale doesn't claim everyone nearer got in.
2. **Catchments from a GeoPDF** (Leeds): a new reader, `build/leeds_maps.py`, turning each page's boundary into a shape matched to its school by name.
3. **Kirklees's counts by rule** go into each year's note, as Hull's guide does.
4. **Scale.** 703 more schools roughly doubles the build. To check: build time, the map data's size on a phone, and school names that clash ("St Mary's", "St Joseph's"). Existing pages keep their locked addresses and titles. The title check catches any that change.
5. **The home page title** still says "Harrogate and York". With West Yorkshire it should say Yorkshire (decision 5).

## Area pages (constituencies, the standard since decision 2)

Each page is one constituency within one council. A handful of schools in a constituency that crosses a council
border join their nearest page.

| Council | Pages |
|---|---|
| **Leeds (224)**, 8 pages | Leeds Central and Headingley (19) · Leeds East, with Garforth and Kippax (34 + 7 from Selby) · Leeds North East (26) · Leeds North West: Horsforth, Otley, Guiseley (26 + 1) · Leeds South, with Rothwell (35 + 7 from Wakefield and Rothwell) · Morley and Leeds South West (23) · Pudsey and Leeds West (29) · Wetherby, Boston Spa and the villages (17) |
| **Bradford (161)**, 5 pages | Bradford West (37) · Bradford East (36) · Bradford South (31) · Keighley and Ilkley (30) · Shipley, Baildon and Bingley (26) |
| **Kirklees (132)**, 5 pages | Dewsbury and Batley (32) · Colne Valley and Holmfirth (31) · Spen Valley: Mirfield, Cleckheaton, Heckmondwike (29) · Huddersfield (25) · Denby Dale and Kirkburton (15) |
| **Calderdale (81)**, 2 pages | Halifax and Sowerby Bridge (37) · Calder Valley: Brighouse, Elland, Hebden Bridge, Todmorden (44) |
| **Wakefield (105)**, 4 pages | Normanton, Hemsworth and South Elmsall (32) · Pontefract, Castleford and Knottingley (30) · Wakefield (23) · Ossett and Horbury (20) |

That's **24 area pages**, each with its own sitemap.

## Phases

One council at a time, each shipped on your "Yes, ship it". Each ends the usual way: the Search Console task (sitemaps
only), the admin coverage map and table, and the ad price table in MONETISATION.md.

- **W1: Calderdale (81 schools, 2 pages).** Council figures 2023 to 2026, no catchments, five choices. The quickest, and it builds the "distance without a catchment" wording that Bradford reuses.
- **W2: Kirklees (132, 5 pages).** Council figures with counts by rule; catchments from the PAA layer (decision 2); three choices.
- **W3: Leeds (224, 8 pages).** Council figures (2025 and 2026, plus earlier years if found); catchments from the GeoPDF maps, tested first on a few schools; five choices.
- **W4: Bradford (161, 5 pages).** Distances from the Guide for Parents if it has them, otherwise the DfE figures; 11 schools marked `cu`.
- **W5: Wakefield (105, 4 pages).** DfE first-choice figures and `cu` catchments, as Hull.

**After West Yorkshire: South Yorkshire** (Sheffield, Doncaster, Rotherham, Barnsley), then Stockton-on-Tees if wanted.

## Draft data requests (optional, for you to send)

To Wakefield Council's school admissions team:

> Hello. I run yorkshireschoolchecker.co.uk, a free site that helps parents see their chances at each primary school.
> Could you share, for Reception entry in 2023 to 2026, each school's distance of the last place offered and the rule
> it was offered under? And are your primary catchment areas available as a shapefile or GeoJSON? I'd credit the
> council on every page that uses them. Thank you.

The same note to Kirklees, asking only for the primary priority admission areas as a shapefile or GeoJSON, is the
alternative to reading them from the map (decision 2).

## Progress

- **Calderdale (W1), 10 November:** live.
  - 80 schools (the DfE's 81 less Tuel Lane Infant, which has since closed), on two pages: `/halifax-primary-schools/` and `/calder-valley-primary-schools/`.
  - Every year, 2023 to 2026, from the council's open data, matched to the register by name (with the town where two schools share one, and Whitehill's old name before 2026). A school with no distance, or "All on time prefs met", took everyone.
  - A distance becomes the new "near" record: "Brothers and sisters, then children within X". The council's figure is the furthest child offered a place, which could be a brother or sister, and the area pages say so. Church schools with faith rules read "by the school's own rules"; Bolton Brow, the one academy with a catchment of its own, is marked "not checked".
  - The search says Calderdale's schools have no catchments (a new `noCatch` council field) instead of "you're not in a catchment", and school pages ask "Could you get a place?" rather than "What is your catchment school?".
  - Register names in shorthand ("J, I & N", "Junior, Infant and Nursery", "& Pre School", "In Rishworth") are spelled out before the page names are made, and "Junior and Infant School" is its own kind of school. No school published before had these forms; every earlier title is unchanged.
  - The home page title now says Yorkshire, and the site's descriptions name the councils covered rather than all 19 areas.
  - 80 phone numbers and 63 emails; St Joseph's, Todmorden's website added, and three emails set by hand (Central Street's site also lists the council's web team).

- **Kirklees (W2), 10 November:** live.
  - 132 schools on five pages: `/huddersfield-primary-schools/`, `/dewsbury-primary-schools/`, `/spen-valley-primary-schools/`, `/colne-valley-primary-schools/` and `/denby-dale-primary-schools/`.
  - Who got in, 2023 to 2026, from the council's PDFs, read by word position (`build/kirklees_tables.py`, saved in `build/kirklees/allocations.json`) because blank cells shift the columns. Every community and VC row's places by rule add up to its total. A refused year reads "everyone in the catchment, plus others within X" when out-of-area children got in, "plus brothers and sisters" when only they did, and "only children in the catchment" otherwise; schools with their own rules read "by the school's own rules".
  - The 114 priority admission areas come from the council's public map, three queries (`build/fetch_kirklees.sh`), and are matched to the school that takes Reception. No two overlap; every school sits inside its own area except Luck Lane, whose area is Leymoor in Golcar, as the council's own map shows. 16 schools (mostly Catholic and church academies) have none, matching the council's list.
  - Six schools became academies after the DfE’s 2026 figures; they’re linked to their old numbers (Golcar Junior Infant and Nursery is now Manor Road Academy).
  - Page names: "First School" is its own kind (Reception to Year 5, in the three-tier villages), "Batley Grammar School" keeps its name, and more shorthand is spelled out. Every earlier title is unchanged.
  - "Places go …" now reads "to children in care" or "by each academy's own rules" where the council's rules start that way; Middlesbrough's and Hull's pages had "Places go children in care" and "Places go each academy's".
  - Websites fixed for six schools (four moved from kgfl.dbprimary.com; Whitechapel's shows only an error page, so it has none). 132 phone numbers and 102 emails; seven left out (a trust inbox shared by five Enhance schools, a named member of staff, a SENCo).

- **Leeds (W3), 10 November:** live.
  - 224 schools on eight pages: `/headingley-`, `/east-leeds-`, `/north-east-leeds-`, `/horsforth-`, `/south-leeds-`, `/morley-`, `/pudsey-` and `/wetherby-primary-schools/`. Kippax and Methley's schools (in Selby's constituency) join East Leeds, Rothwell's (Wakefield and Rothwell's) join South Leeds, and one Otley school joins Horsforth.
  - 2024 to 2026 from the council's cut-off PDFs, read by word position (`build/leeds_tables.py`): every school's furthest distance or "All applicants admitted", the last priority and its description. Rows printed above a page's header and names wrapped above their number are handled; All Saints' Richmond Hill's 2026 "314" is read as 0.314 miles. 2023 has no PDF: Data Mill North's file covers the schools on the council's rules (a school counts as full when it gave every place and has a distance, which matches the PDFs about 96% of the time); other schools' 2023 is the DfE's first choices.
  - A refused year reads "everyone in the catchment, plus others within X" when the last place was "any other children" at a school with a catchment, "brothers and sisters, then children within X" at one without, "only children in the catchment" when the last went by catchment, and otherwise "by the school's own rules", with the rule named in a note.
  - Catchments: GDAL wouldn't install (Homebrew was compiling it from source), so `build/leeds_maps.py` reads the council's GeoPDF maps with PyMuPDF instead. Each page's map frame gives its corners, so the "Catchment Area" layer's boundary is placed exactly; all 90 schools sit inside their own catchment. These are the maps for 2026 admissions, the latest published; check for a 2027 set in the spring.
  - Renumbered schools: Roundhay School and Carr Manor's primary phases (8901 and 8902 in Data Mill North), Cobden (an academy from September 2026) and Cockburn Ingram Road are linked to their old numbers; older academy conversions take their 2023 DfE figures from the closed school with the same number. `successors()` is now in `common.py`.
  - Places: where the register gives only "Leeds", the school's ward (`build/leeds/wards.json`).
  - Names that differ only by an apostrophe now count as the same, so both Lady Elizabeth Hastings' schools get their village. Every earlier title is unchanged.
  - A postcode in a covered council but in no catchment (much of Leeds: only community schools have one) no longer says it's "outside the areas this checker covers".
  - Websites fixed for eight schools; 223 phone numbers and 168 emails, ten left out (four named staff, a business manager, a bursar, two trust inboxes, another school's and a photographer's).

- **Bradford (W4), 10 November:** built on the `bradford` branch, not yet live.
  - 160 schools on five pages: `/bradford-west-`, `/bradford-east-`, `/bradford-south-`, `/keighley-` and `/shipley-primary-schools/`, one a constituency.
  - Who got in comes from the council's primary guides, read by `build/bradford_guide.py`: the September 2027 guide for 2026 and the September 2024 guide for 2023. They give each school's applications considered, places by rule and the furthest distance offered. The guides with 2024's and 2025's figures are no longer online, so those years are the DfE's first choices. Where the national figures show a refusal, the page says they "don't say who got the last one", because the council's own figures for those years are gone, not unpublished.
  - Reading 2026: 103 schools took everyone. 48 went by distance after brothers and sisters ("near"), 6 priority-area schools also took others by distance ("out"), 2 went by faith ("by the school's own rules"), and 1 has the DfE's figures only.
  - Priority areas: most schools have none (`noCatch`), and their pages say so. `build/bradford_maps.py` reads 12 of the 13 maps (GeoPDFs in National Grid metres whose outlines don't close, so they're chained into rings). St Joseph's, Bingley's map is a picture, so its area is marked "not checked". Each school sits inside its own area except Victoria, Keighley, which is about 100 m south of it, as the council's own map shows.
  - Places: where the register gives only "Bradford", the school's ward (`build/bradford/wards.json`), with City as "Bradford city centre".
  - Page names: "Primary School & Nursery" and "Aided Primary" are shortened, and "Primary Leadership Academy" counts as an academy. Every earlier title is unchanged.
  - Websites fixed for five schools. 160 phone numbers and 117 emails; ten left out (nine give their trust's inbox, one a named member of staff).
  - Sources download with `build/fetch_bradford.sh`.

## Decisions (10 November 2026)

1. **Calderdale first**, then Kirklees, Leeds, Bradford and Wakefield.
2. **Kirklees catchments: read from the council's public map.** The query will need approving in the permission prompt during the Kirklees build.
3. **Leeds catchments: install GDAL and read the GeoPDFs**, tested on a few schools first.
4. **Wakefield: build with the DfE figures**, as Hull. The data request above is optional and yours to send.
5. **Home page title: change "Harrogate and York" to Yorkshire** as part of W1.
