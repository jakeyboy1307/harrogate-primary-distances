# Getting parents to the site: SEO and traffic plan

Written 11 November 2026, the day South Yorkshire went live. The checker now covers 1,682 primary schools in North,
West and South Yorkshire, York, East Riding, Hull and Teesside, on 57 area pages. What it needs now is parents.

## Where we stand

- **Search engines haven't picked the site up yet.** A web search for the site's name finds nothing of ours. That's
  normal for a site a few weeks old: Search Console has read 18 of its 59 sitemaps (about 650 pages found) and has
  queued the rest. Search will be slow to build, so the next nine weeks need other channels as well.
- **The pages themselves are in good shape.** Every school and area page has a unique title and description, a canonical
  link, school, breadcrumb and FAQ markup, and loads in under 0.2 seconds at about 45 KB. No rebuild needed.
- **The gaps:**
  - **No city pages.** `/sheffield-`, `/leeds-`, `/bradford-`, `/hull-`, `/doncaster-`, `/barnsley-`, `/kirklees-` and
    `/calderdale-primary-schools/` don't exist: those councils are split into constituency pages ("Hallam", "Heeley").
    Parents search "Sheffield primary school catchment areas", not "Hallam".
  - **We can't tell where visitors come from.** The admin counts page views and searches, but not whether they came
    from Google, Facebook or a newspaper link. Every channel below needs that to be judged.
  - **Every page shares one picture** when posted to Facebook or WhatsApp.
  - The home page has two `<h1>` headings.
- **Who we're up against.** For "Sheffield/Leeds/Harrogate catchment" searches, Google shows the councils and two
  national sites, [catchment.school](https://catchment.school/council/sheffield/) and
  [schoolcatchmentchecker.co.uk](https://schoolcatchmentchecker.co.uk/school-catchment-checker-leeds.html). Both have a
  page for every school and city, but neither has the councils' real catchment maps with how far places went, year by
  year. We do, and that's the pitch in every channel: **"See your real chances at every school near you, from the
  council's own figures."**

## The calendar decides everything

| When | What parents are doing | What we do |
|---|---|---|
| **Now to 15 January 2027** | Choosing schools; the application deadline is 15 January | Every channel at full push. This is the biggest window of the year |
| 16 January to mid-April | Waiting | Build offer-day and appeals pages; plan the press |
| **16 April 2027 (offer day)** | "Did we get in?", waiting lists, appeals | Press, social and the offer-day pages; second biggest spike |
| May to August | Appeals; next year's parents start looking | Fix what Search Console shows; refresh with 2027's figures |
| September onwards | The next cycle starts | Repeat, with a year of search history behind us |

## 1. Search (SEO): what I can build

Done on 11 November (the `growth` branch): items 1 and 5, the council pages and counting where visits come from. The checker also now opens on the map on desktop, and its button reads "See school details".

In priority order. Each is a normal ship: built, checked, then your yes.

1. **City and council pages (this week).** One page for each of Sheffield, Leeds, Bradford, Hull, Kirklees, Calderdale,
   Doncaster, Barnsley, North Yorkshire and East Riding. Each one gives the whole council's picture (closing date,
   how places work, its hardest-to-get-into schools) and links to its constituency pages and schools. These target the
   searches with the most volume, and are what the press and Facebook posts will link to.
2. **"Hardest primary schools to get into" pages, one per council.** Built from our figures: the shortest last distances
   and the most first choices turned away. In 2026, for example, the last place at St Anthony's Catholic Primary in
   Leeds went 0.09 miles, and Waverley in Rotherham turned away 46 first choices. Local papers run exactly this story
   every year (the [Yorkshire Evening Post](https://www.yorkshireeveningpost.co.uk/education/hardest-leeds-primary-schools-to-get-into-new-data-9284853),
   [The Star](https://www.thestar.co.uk/education/hardest-sheffield-primary-schools-sept-2026-8956376)), so these pages
   are both something parents search for and something journalists can link to.
3. **Key-date pages.** "Primary school applications for September 2027: every Yorkshire council's deadline and how to
   apply" now; "National offer day 2027" and "Waiting lists and appeals, council by council" before April. Searches for
   these jump around each date.
4. **Bing and IndexNow (an hour, and you do the clicks).** Import the site from Search Console into Bing Webmaster
   Tools, and turn on Cloudflare's Crawler Hints so new pages are announced to Bing and others as they go live. Bing
   also feeds ChatGPT search, Copilot and DuckDuckGo. I'll write the click-by-click steps.
5. **Count where visits come from.** Add the referring site's name (google, facebook, thestar.co.uk; never the full
   address) to the admin's daily counts, plus a `?from=` tag for flyers and posts. Still no cookies and nothing that
   identifies anyone, as the privacy page promises.
6. **Share cards.** A picture for each area page and school page ("Coleridge Primary School: who got in, 2023 to 2026"),
   so a link pasted into a Facebook group or WhatsApp looks worth tapping.
7. **Small fixes.** One `<h1>` on the home page; "Updated for September 2027 entry" and a modified date on each page.
8. **From late November, weekly:** read Search Console's Performance report. Pages that appear in searches but don't get
   clicked get better titles and descriptions; queries we half-answer get answered properly on the page.

## 2. Press and links: the fastest way to be found and trusted

A link from a local paper does two things: sends parents today, and tells Google the site is trustworthy.

- **Who:** the National World titles that run the yearly "hardest schools" stories (Yorkshire Evening Post, Yorkshire
  Post, The Star, Halifax Courier, Huddersfield Examiner, Harrogate Advertiser, Doncaster Free Press), plus the Telegraph
  & Argus, York Press, Northern Echo (Newsquest), Hull Daily Mail and Teesside Live (Reach), and BBC Radio Sheffield, Leeds
  and York for a phone-in.
- **Two pitches a year.** Now: "Applications close on 15 January. Here's how close you have to live to get into the most
  popular schools." Offer day: "Who got in this year", the day the councils' figures come out.
- **What I'll prepare:** a short press release, and for each paper a cut of its own area's figures with the five
  tightest schools, a quote from you, and the link to its city page. **You send them** (I won't send anything on your
  behalf); a personal email to the education reporter by name works best.
- **Other links worth asking for:** parish and town council websites, community and village sites, NCT branches, and
  local parenting blogs. One friendly email each.

## 3. Where parents already are

The parents we want have a child aged three or four. They're easy to find.

- **Nurseries and preschools: the best channel we have.** Every family there applies this winter. An A5 poster and
  flyer with a QR code to the area page ("Applying for a Reception place? Check your chances at every school near you"),
  and an email to nursery managers asking them to pin it or put it in their newsletter. I'll make the poster and the
  email; you send them, starting with the areas where competition is tightest (Harrogate, Leeds, Sheffield, York).
  Family hubs, children's centres and libraries take posters too.
- **Local parents' Facebook groups** ("Harrogate Mums", "Sheffield Mums" and the like). Ask the admin first, post once
  as a person, not a brand, answer questions in the comments, and say plainly that you made it. One helpful post in a
  50,000-member group can be worth a month of search.
- **Mumsnet** (the Primary Education and local Talk boards), **Reddit** (r/Sheffield, r/Leeds, r/york, r/Harrogate) and
  **Nextdoor:** answer the "which school?" threads people are already asking, linking to the page that answers them.
  Each has rules on self-promotion; read them and declare you built it.
- **Estate agents.** They're also the people MONETISATION.md wants as advertisers: an agent who links to our area pages
  from their listings or area guides becomes the obvious first sponsor.
- **A small paid test (optional, about £100 in early December):** a Facebook and Instagram ad shown only around one
  town, pointing at its area page. If it brings searches cheaply (we'll know, once visits are counted by source), repeat
  it for 1 to 15 January in every area.

## 4. Getting each visitor to bring another

- **"Send this to your partner"**, after a search, with WhatsApp and copy-link buttons. Choosing a school is a joint
  decision, and this is how it spreads.
- **A deadline reminder.** "Email me a reminder before 15 January, and on offer day." This needs a small mailing list
  and a privacy page update, so it's a decision for you, but it brings people back at the two moments that matter.

## What we won't do

No bought links, link swaps or directory spam (Google penalises them, and they'd undercut the site's trust). No
thin, machine-written pages: every new page carries real figures. No posting the same message in every group. No
"Request indexing" campaigns: the sitemaps do the job.

## How we'll know it's working

From the admin dashboard and Search Console, checked weekly. These are first guesses, to be revised once we see real
numbers:

| By | Pages in Google's index | Search clicks a week | Postcode searches a day |
|---|---|---|---|
| 15 December | 500 | 50 | 20 |
| 15 January | 1,200 | 300 | 100 at the peak |
| 16 April (offer day) | 1,600 | 500 | spike |
| September 2027 | all | 1,000 | steady |

Plus, by source once it's counted: how many visits come from the press, Facebook, nurseries (the `?from=` tag) and
search, so we put more into what works.

## The next three weeks

| Week | I build | You do |
|---|---|---|
| 11 to 17 November | City pages; source counting; the deadline page; press pack | Bing Webmaster Tools and Crawler Hints (my steps); pick 10 nurseries and 3 Facebook groups to start with |
| 18 to 24 November | "Hardest to get into" pages; share cards; poster and nursery email | Send the press pitches; email the nurseries; first Facebook posts |
| 25 November to 15 December | Fixes from Search Console; the reminder emails if you want them | Follow up the press; more nurseries and groups; the ad test |
| 1 to 15 January | Last-chance banner and deadline content | Second round of posts: "a week left to apply" |
