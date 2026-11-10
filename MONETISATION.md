# Making money from Yorkshire School Checker

Draft plan, 8 November 2026. Branch: `sponsored-placements`. Nothing here is live.

## The one rule

Paying never changes what the checker tells a parent. No school moves up the results, gets a better label or is hidden because someone paid. Every paid box says **Sponsored**. That trust is the product: if parents stop believing the labels, the traffic and the ad income both go.

## Who pays

| Who | Why they'd pay | Best slot |
| --- | --- | --- |
| School uniform shops | Each supplier holds contracts for named schools, and every new Reception family has to buy from them | School uniform (in that school's panel) |
| Independent schools and preps | Parents comparing state schools are their exact audience, and they already spend on marketing | Featured in results |
| Estate agents, mortgage brokers | Families move house to get into a catchment. One instruction pays for a year of ads | Area page sponsor, Near this school |
| Wraparound care, breakfast clubs, nurseries | Need families at named schools | Near this school, Get ready for September |
| Shoe shops, tutors, swimming, clubs | Seasonal back-to-school demand | Get ready for September |
| State schools and academy trusts | Undersubscribed schools want more first choices | School profile (open days) |

## The six slots (built on the branch, with demo businesses)

1. **School uniform**: one card in a school's panel, only for schools that supplier stocks.
2. **Featured in results**: one card after the 4th school in the search results. Never at the top.
3. **School profile**: a school's own open days and a "Book a tour" button, in its panel, marked "From the school".
4. **Near this school**: one local service in each school's panel, taking turns between sponsors.
5. **Get ready for September**: a grid of partners on the My plan page.
6. **Area page sponsor and directory**: a "supported by" line under the Harrogate or York area page heading, plus a "Local help for families" grid.

Plus an **Advertise with us** page at /advertise/ (kept out of search) that explains the slots, the season and the rules, for sending to prospects.

## Draft prices

These are a starting point to test, not researched market rates. Set them properly once there are visitor numbers.

| Slot | Price | Per area, fully sold |
| --- | --- | --- |
| School uniform | £40 a month | 2 suppliers: £80 |
| Featured in results | £150 a month | 1: £150 |
| Near this school | £60 a month | 3 taking turns: £180 |
| Get ready for September | £50 a month | 4: £200 |
| Area page sponsor | £100 a month | 1: £100 |
| School profile | £150 a year | 20 schools: £250 a month |

Fully sold, that's about **£960 a month per area**. With the 41 areas live in November 2026 (North Yorkshire, York, East Riding, Hull, Middlesbrough, Redcar and all of West Yorkshire), that's about £39,400 a month if every slot sold, which it won't: expect a small share in the first year, starting with the busiest areas. Each new area page adds another £960 of slots; South Yorkshire would be next.

Sell by **season**, not just by month: September to January is when parents choose and apply (forms close 15 January), April is offer day, and May to August is uniform, shoes and care. A "September to January" package for independent schools and estate agents is the easiest first sale.

## What to do first

1. **Get visitor numbers.** Turn on Cloudflare Web Analytics (still waiting on the snippet). No sponsor will pay without "X parents a month in Harrogate".
2. **Set up the advertise@ email address** (Cloudflare Email Routing, free) or change the address on /advertise/.
3. **Sell three founding sponsors by hand**: one uniform shop, one independent school, one estate agent per area. Offer a founding rate (half price for the first season) in exchange for feedback.
4. **Take payment simply**: Stripe Payment Links or invoices to start. No self-serve system until there are 10 or more sponsors.
5. **Keep sponsors in a file**: `astro/src/lib/sponsors.ts` holds them now. Past about 20 sponsors, move them to a JSON file or Cloudflare KV so they can change without a code change.
6. **Report results to sponsors**: every sponsor link carries `utm_source=yorkshireschoolchecker`, so they see our visits in their own stats. Later, a small click counter on our Worker (no cookies) can send monthly reports.

## Rules to keep

- Every paid box says "Sponsored" (the CAP Code requires ads to be obviously ads). Sponsor links use `rel="sponsored"` so Google doesn't count them as endorsements.
- No ad networks (Google AdSense and the like). They pay little at this traffic level, slow the site, and would need a cookie banner. The privacy page now explains the listings.
- No gambling, payday loans, alcohol, or anything not for families.
- A paid school profile can add open days and a welcome note. It can't change the school's figures, Ofsted grade or label.

## Before this goes live

Done on the branch:
- Demo businesses only show on preview builds (any branch except `main`) and local builds. A build of `main` leaves them out completely.
- Every sponsor has optional `start` and `end` dates. Ads switch themselves off outside those dates, with no code change. The area pages check the dates in the browser, so they don't need a rebuild.
- School profiles are labelled "Sponsored · From the school".
- "Near this school" picks a sponsor at random on each visit, so sponsors share the views evenly.
- A uniform shop that holds a school's contract (listed with that school's `urns`) always comes before a general uniform shop.

Still to do:
- Add real sponsors to `REAL` in `astro/src/lib/sponsors.ts`, each with start and end dates.
- Decide whether to launch with all six slots or start with uniform, featured results and area sponsor.
- Set up email for the enquiry form (Cloudflare Email Service > Email Routing).
