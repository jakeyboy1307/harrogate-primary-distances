# SEO, links and outreach: getting Yorkshire to 1,000 search clicks a week

Written 12 November 2026. Follows on from GROWTH.md (11 November). The aim is to prove the model in Yorkshire, with
traffic that ad buyers will pay for, before the site moves to ukschoolcatchment.co.uk.

**The clock:** Reception applications close on **Friday 15 January 2027**, nine weeks from today. Offer day is
**Friday 16 April 2027**. Most of this year's searches happen between now and 15 January.

## 1. The audit

### Already in good shape

- Every school page and area page has its own title and description, a canonical link, breadcrumb, school and FAQ
  markup, and its own sitemap per area. Pages are small and fast.
- School page titles already match how parents search: "<school> catchment area, Ofsted and admissions".
- Council pages (Leeds, Sheffield and the others) went live yesterday, filling the city-search gap GROWTH.md found.

### Gaps found

| Gap | What parents type (Google's own suggestions, 12 Nov) | Status |
|---|---|---|
| **No page per town.** Knaresborough, Ripon, Otley, Ilkley and the like only appeared inside a district or constituency page | "primary schools in knaresborough", "best primary schools in ripon", "primary schools in otley west yorkshire", "best primary schools in ilkley", "primary schools in roundhay leeds" | **Built today:** 140 town pages |
| **School holidays and term dates.** The biggest searches we saw, every family with a school-age child, all year | "harrogate school holidays 2026 27", "school term dates north yorkshire 2027", "knaresborough school holidays", "<school> term dates" | Next build (section 3) |
| **Key dates** | "reception application 2027", "reception application deadline 2027", "school offer day 2027", "north yorkshire school application login" | Next build |
| **Secondary schools** | "harrogate grammar catchment area", "harrogate grammar catchment map", "secondary schools in knaresborough", "york secondary school catchment areas" | Expansion: plan it now |
| **"Best" and "Outstanding" lists** | "outstanding primary schools leeds", "best primary schools in yorkshire", "ripon primary schools ranking" | Next build |
| **Uniform** | "harrogate school uniform shop", "knaresborough school uniform shop", "<school> uniform" | A sponsor sale, not a page: see MONETISATION.md |

I couldn't get search volumes: the Ahrefs and Similarweb plugins need signing in (`/mcp`). Google's suggestions show
which searches people make, not how many. Search Console will give real numbers from late November.

### One technical problem to fix (on your Mac, not the site)

The project sits on the Desktop, which syncs to iCloud, and macOS has replaced about 9,400 of its files (mostly
`astro/node_modules`) with cloud placeholders. `npm run build` stalls waiting for them. It also explains the
"leeds 2.ts", "morley-primary-schools 2.astro" duplicates: those are iCloud conflict copies, not your files. The live
site is unaffected (Cloudflare builds from GitHub). Fix: move the folder out of Desktop (for example to
`~/Projects/`), or in Finder right-click the folder and choose **Keep Downloaded**. Today's build was done from a
copy outside iCloud.

## 2. Built today: town pages

140 new pages at addresses like `/knaresborough-primary-schools/`, one for every town, village or suburb parents
search by name. Towns that already head an area page (Harrogate, Wetherby, Keighley, Pontefract and so on) don't get
a second page, so pages don't compete with each other.

Each page:

- **Title:** "Primary schools in Knaresborough: catchments, Ofsted and places". **H1:** "Primary schools in
  Knaresborough". Suburbs name their city: "Primary schools in Roundhay, Leeds".
- **Lists** the schools in the town (within 1.5 miles of the centre for a town, 1 mile for a village, ¾ mile for a
  suburb) and the nearest others around it, with the same hardest-to-get-into table, took-everyone list and Ofsted
  list as the area pages.
- **Answers** eight questions in the words parents use: best primary schools in X, hardest to get into, how many
  schools, my catchment school, how to apply for September 2027, offer day, X school holidays, secondary schools.
  Each answer is built from that town's own figures and council, so no two pages say the same thing.
- **Links** both ways: area pages and council pages list their towns; each school page's breadcrumb now runs
  School checker › Harrogate › Knaresborough › St John's, with "See every primary school in Knaresborough".
- Joins its area's sitemap. 1,905 pages in all.

The towns are listed in `astro/src/lib/towns.ts`. To add one, add its name and centre (from postcodes.io).

## 3. What to build next, in order

1. **School holidays pages, one per council** (`/north-yorkshire-school-holidays/` and so on). The 2026–27 and
   2027–28 dates as a table, half terms, INSET-day note, an "add to calendar" file, and every school in the council
   linked. Each town page then gets "Knaresborough school holidays 2026/27" pointing there. These pages draw visitors
   all year, not just in application season, which is what makes ad slots sellable in March and July. Dates must be
   copied from each council's own page and checked by hand.
2. **"Apply for a Reception place, September 2027" and "Offer day 2027" pages**, with every council's deadline, login
   link and what happens next. Live by 20 November and late March.
3. **"Outstanding and hardest-to-get-into primary schools in <council>" pages**: lists parents and local papers
   both want. The data is already in the area pages.
4. **Share cards**: each town and school gets its own picture for WhatsApp and Facebook (GROWTH.md item 6). It
   matters more now that nurseries will be pasting links.
5. **Secondary schools, starting with Harrogate.** "Harrogate Grammar catchment area" is one of the most-suggested
   local searches. North Yorkshire publishes secondary catchments and allocations in the same files we already read.
   This doubles the audience (Year 6 parents apply by 31 October each year), so plan it for spring and launch by
   September 2027.
6. **Weekly, from late November:** Search Console. Pages that are shown but not clicked get better titles; questions
   people search that a page half-answers get answered properly.

## 4. Links: how the site earns trust with Google

No bought links, swaps or directory spam (GROWTH.md's rule). A link a parent might click is a link worth having.
Harrogate and Knaresborough first, then copy what works to the next area.

| Who | What to ask for | Why they'd say yes |
|---|---|---|
| **The Stray Ferret** (Harrogate's news site; it already runs nursery and school Ofsted stories) | A story: "The Harrogate district primary schools that are hardest to get into", with our 2026 figures, before 15 January | Ready-made local data story, with a deadline hook |
| **Harrogate Advertiser, Yorkshire Post** | The same story, cut for their patch | They run "hardest schools" stories every year |
| **Knaresborough, Ripon and Boroughbridge town councils; parish councils** (Killinghall, Pannal, Follifoot, Scotton…) | A line in their "Living here" or news page, or newsletter | A free, local tool for residents; councils like linking to useful things |
| **Family directories**: Harrogate & District Community Action's directory (hadca.org.uk), Mumbler Harrogate, North Yorkshire's Family Information Directory | A listing | Free and quick; they list services for families |
| **NCT Harrogate & District, local baby and toddler classes** | A mention in their newsletter or Facebook group | Their members are exactly the parents applying |
| **Estate agents** (Verity Frearson, Linley & Simpson, Hunters, Bridgfords and others in Harrogate and Knaresborough) | A link from their area guides and "schools near this home" notes | Useful to buyers; and they're the first sponsors MONETISATION.md wants. Ask for the link first, the sponsorship second |
| **Primary school websites** | A link on their "Admissions" page | Many schools link to the council's page already; ours shows their own figures |
| **Nurseries' websites and newsletters** (section 5) | A link on their "Starting school" page | Their parents ask them about school places every winter |

**Target by 15 January:** 20 real links from Harrogate-district sites, two of them from news sites.

## 5. Outreach: nurseries first

Nurseries are the best channel: every family with a child born between September 2022 and August 2023 is choosing a
school right now, and nursery managers get asked about it daily.

**The list:** `outreach/yorkshire-nurseries.xlsx`. Every nursery and preschool on Ofsted's register in the 15 councils
the checker covers, **1,493 in all** (215 in North Yorkshire, 213 in Leeds, 170 in Kirklees…), each with its address,
operator, Ofsted rating, places and **the page it should share** (its own town page where there is one). Links carry
`?from=nursery`, so the admin dashboard counts what nurseries send. Sheets:

- **Knaresborough and Boroughbridge** (12): phone numbers found for most, and email where published. Most nurseries
  don't publish an email, so **phone first and ask for the manager's email**.
- **Harrogate district** (38): Harrogate, Ripon, Pateley Bridge and Masham.
- **All Yorkshire** (1,493), and a **Summary** by council.

Not in the list: childminders (Ofsted doesn't publish their names) and nursery classes in schools (those schools are on
the site already; email the school office instead).

**Shortcuts to many nurseries at once:**

- **Chains:** Busy Bees (Kindercare: 5 in the Harrogate district), Partou (5), Kids Planet, Natures Little
  Learners, Happy Jays, Tiddlywinks. One yes from a regional manager reaches every branch.
- **Each council's early years team** keeps in touch with every setting in its area. Ask if they'll pass it on:
  worth trying, though councils are often careful about third-party sites.

**The email** (after a phone call, or cold if you have an address):

> **Subject:** A free tool for your parents applying for Reception
>
> Hi [name],
>
> I'm Jake, and I built a free website for families choosing a primary school. Put in a
> postcode and it shows every school nearby, whether you're in its catchment, and how far away the last child to get
> a place lived each year, from North Yorkshire Council's own figures.
>
> Applications for September 2027 close on 15 January, so a lot of your parents will be deciding now. Would you be
> happy to share it in your newsletter, on your parents' WhatsApp or Facebook group, or on your noticeboard? Here's
> the page for [Knaresborough]: [link from the sheet]. I can drop off a printed poster too.
>
> It's free, with no sign-up, and it doesn't collect anyone's details.
>
> Thanks, Jake
> [phone]

**On the phone (30 seconds):** who you are, the 15 January deadline, "can I send you a link for your parents?", get
the manager's name and email, send within the hour.

**Also worth a poster or a message:** children's centres and family hubs (Knaresborough Children's Centre, which hosts
Manor Early Years), toddler groups (often in church halls), libraries, baby and toddler class organisers, and local
parents' Facebook groups (ask the admin first; post as yourself; say you built it).

**Pace:** 10 to 15 nurseries a week, Knaresborough and Boroughbridge this week, then Harrogate, Ripon, York and Leeds.
Note who agreed in the sheet, and follow up a week later. In the first week of January, send everyone who agreed a
reminder: "One week left to apply".

## 6. The UK domain

Stay on yorkshireschoolchecker.co.uk until the model is proven: moving now would reset the trust Google is
building. When the UK version is ready, keep the same addresses (`/knaresborough-primary-schools/`,
`/schools/<name>/`) on ukschoolcatchment.co.uk and redirect every old address one-to-one (Cloudflare bulk
redirects), then use Search Console's Change of Address tool. Done that way, rankings carry over.

## 7. How we'll know

GROWTH.md's targets stand (300 search clicks a week by 15 January). New, from the admin dashboard and Search Console:

| By 15 January | Target |
|---|---|
| Town pages in Google's index | 100 of 140 |
| Town pages getting search clicks | 30 |
| Nurseries that agreed to share | 40 (10 in the Harrogate district) |
| Visits tagged `from=nursery` | 500 |
| Links from Harrogate-district sites | 20 |
