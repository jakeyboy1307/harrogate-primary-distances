# Plan: the Humber

The next step after North Yorkshire and York: East Riding, then Hull. Researched 9 November 2026; decisions made the
same evening (at the end). North and North East Lincolnshire are left out for now: they're in Lincolnshire.
North Yorkshire's plan and checklist are in [EXPANSION.md](EXPANSION.md); this plan reuses them and only spells out what's
different.

## The councils

These are new councils, not new districts. Each runs its own admissions, publishes its own figures (or doesn't), and
draws its own catchments. So each needs its own build script, as York did, rather than a line in North Yorkshire's.

| Council | ONS code | Primary and infant schools taking Reception | More first choices than places, 2026 | Catchments | Who got the last place |
|---|---|---|---|---|---|
| **East Riding of Yorkshire** | E06000011 | 118 | 30 | **Map data (ArcGIS), 123 catchments, matched by school number** | **Published**: oversubscribed schools only, 2025 and 2026 (2024 to find) |
| **Hull** (Kingston upon Hull) | E06000010 | 70 | 9 | A scanned PDF map from 2021: a picture, no map data | Not published |
| North Lincolnshire (not doing) | E06000013 | 58 | 11 | One PDF map per school (the council's site sits behind a CAPTCHA) | Not published |
| North East Lincolnshire (not doing) | E06000012 | 45 | 6 | A street-by-street list (house numbers), no map | Not published |

School counts and the "more first choices than places" column are from the DfE file below (entry to Reception, 2026).

### What each council gives us

**East Riding: nearly everything North Yorkshire does.**
- Catchments: the layer behind the council's [catchment finder](https://eastriding.maps.arcgis.com/apps/webappviewer/index.html?id=244a8443912c427e9bef37461ee1942e), `School_Boundaries_23_Update`. Each shape has the council's school number (LEA 811 + code), so shapes match schools exactly. It was last edited in August 2023, so we check it against the 2027 admission arrangements before trusting it.
- Who got in: the council's "Summary of primary school allocations" for each year. For every oversubscribed school (about 30 of 118), it gives places, first, second and third preferences, places given by each rule (EHCP/care/catchment together, brothers and sisters, religion, other, distance) and **the distance of the last place, in miles**. A school not in the table took everyone. That maps straight onto our "who got in" verdicts.
- The catch: the table is a picture inside the PDF, not text, so each year has to be typed in by hand and checked twice. That's about 30 rows a year.
- 2025 and 2026 download fine. The 2024 file has a different address; we need to find it.
- Still to check: whether the council measures distance in a straight line or by walking route, from its oversubscription criteria document (e1).

**Hull: no published cut-offs, and no catchment data.**
Hull doesn't publish the distance of the last place; its parents' guide explains each school's rules but gives no figures. Its catchment map is a scanned image, so it can't be turned into accurate shapes. Hull is built with what we have (decision 3): the DfE figures, distances and each school's rules, with no catchment check.

### A new source for every council: the DfE's school-level figures

The DfE publishes [applications and offers for every school in England](https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers/2026-27), keyed by URN, every year from 2014 to 2026. For each school and year it gives:
- places offered;
- how many put it first, second or third, and in total;
- how many first, second and third choices were offered.

That means for every school, in every council, we can say:
- "Everyone who put it first got a place" (first choices offered = first choices made). That's 88 of East Riding's 118 schools in 2026, and most of the other councils' too.
- Or "60 places, 80 put it first", where a school was oversubscribed.

What it can't give is the distance of the last place, or whether you'd have got in from your address. For East Riding that comes from the council's summary. For Hull, the checker can say how oversubscribed a school is, not where the line fell.

It also gives us the parliamentary constituency of each school, which is a natural way to split the bigger councils into area pages (below).

## What changes in the checker

**1. A new kind of year record, "first choices".**
For years and schools without a cut-off distance, a record built from the DfE figures: applications, first choices and offers. The verdict wording:
- "Everyone who put it first got a place" (shown as open to all, but only to people who put it first);
- or "Oversubscribed: 80 put it first for 60 places. The council doesn't publish who got the last place."

This is the one real engine change. It also lets us fill the York figures' gaps later.

**2. One build script per council**, writing the same shape of file as `data.json`: `build_eastriding.py`, then `build_hull.py`. Shared parts move into `common.py`:
- DfE figures;
- Ofsted;
- school points from Get Information About Schools;
- name cleaning.

`copy-data.mjs` gets one line per council. Catchment shapes already load per file, so new councils cost a Harrogate search nothing.

**3. Councils in the engine.** `COUNCILS` gets an entry for "East Riding of Yorkshire" and "Kingston upon Hull, City of" (the names postcodes.io gives), with each council's apply link, catchment map and rules in brief. A postcode in a council we don't cover yet keeps getting "doesn't cover yet".

**4. Areas.** `AREA_INFO` needs a field other than `district`, because these councils have no districts. Each area gets a `council` and, for East Riding, a list of constituencies. Everything that reads `AREA_INFO` follows automatically:
- area pages;
- footer;
- sitemaps;
- ad areas;
- admin coverage map;
- search stats.

**5. Wording that assumes North Yorkshire and York.** These all need updating as each council goes live:
- The footer: "not run by North Yorkshire Council, City of York Council or any school" becomes "not run by any council or school".
- The home page title, "Harrogate and York".
- How places work: it describes two councils' rules; each new council gets its own short section.
- The sources section: add the DfE and each council.
- The Scarborough, Richmond and Skipton pages' "which council do I apply to" answers. Scarborough's currently says the East Riding isn't covered, so it changes the day East Riding goes live.
- The "outside our areas" stat and the admin coverage map.

**6. Term dates.** Each council's own link, for the area pages' term dates question.

## Area pages

**East Riding (118 schools): four pages, one per constituency.** The DfE file gives each school's constituency:

| Page | Schools | Towns |
|---|---|---|
| Bridlington and Driffield | 33 | Bridlington, Driffield, the Wolds |
| Beverley and Hornsea | 35 | Beverley, Hornsea, Withernsea, Hedon, Holderness |
| Goole and Pocklington | 38 | Goole, Howden, Pocklington, Market Weighton |
| Cottingham and Hessle | 12 | Cottingham, Hessle, Willerby, Anlaby, the villages on Hull's edge |

The last row covers the East Riding schools in Hull's two constituencies.

**Hull (70):** one page, "Hull primary schools", or one per constituency (East, North, West) if it reads better at 70. Constituency splits are the standard from here on (decision 2).

Each page follows the same pattern as before: questions from Google's suggestions, local mix-ups, borders, and computed counts rather than claims.

## Phases

**Phase H0: groundwork (before East Riding)**
1. Add the DfE school-level file to `fetch.sh` and a shared reader in `common.py`.
2. Add the "first choices" year record, its verdicts and its school-page sentences. Check no North Yorkshire or York answer changes.
3. Make `AREA_INFO` work for councils without districts.
4. Generalise the North Yorkshire and York wording (list above).
5. Optional: send Hull the data request below. Hull is built without it (decision 3); if a reply comes, it adds catchments and cut-offs later.

**Phase H1: East Riding (118 schools, 4 pages).** The full checklist from EXPANSION.md, plus:
- type in the 2025 and 2026 allocation tables, and find and type in 2024, each checked twice against the PDF;
- use the DfE figures for years and schools not in the tables;
- check the ArcGIS catchments against the current arrangements, and 15+ postcodes against the council's map;
- schools on the Hull edge, like Cottingham and Hessle, have their own pages;
- update Scarborough's and Selby's border answers, and York's if needed.

**Phase H2: Hull (70 schools).** Built with what we have:
- the DfE figures (first choices and offers for every school);
- distances to every school and each school's own rules;
- no catchment check, with a clear note and a link to Hull's map.

**After the Humber: West and South Yorkshire** (decision 5). Leeds, Bradford, Kirklees, Calderdale and Wakefield, then Sheffield, Doncaster, Rotherham and Barnsley. Much bigger than the Humber; Leeds already publishes cut-off distances. Planned once Hull is live.

Each phase ends the same way as North Yorkshire's: ship, then update the Search Console tasks, the admin and the ad price table.

## Draft data request (optional, for you to send)

To Hull City Council (LSadmissions@hullcc.gov.uk):

> I run Yorkshire School Checker, a free site that helps parents understand their chances of a Reception place. Under the Freedom of Information Act, please could you send:
> 1. the primary school catchment area boundaries as GIS data (shapefile, GeoJSON or similar), and
> 2. for Reception entry in September 2024, 2025 and 2026, for each primary and infant school: the published admission number, applications, places offered, and the oversubscription criterion and distance of the last child offered a place.
>
> Spreadsheet or CSV format would be ideal.

## Decisions (9 November 2026)

1. **No Lincolnshire for now.** North and North East Lincolnshire are left out. The admin coverage map now names their county as Lincolnshire rather than "Yorkshire and The Humber".
2. **Four East Riding pages by constituency**, and constituency splits are the standard for big councils from now on.
3. **Build with what we have.** Hull launches with the DfE figures and no catchment check.
4. (Lincolnshire: not doing yet.)
5. **West and South Yorkshire after the Humber.**
