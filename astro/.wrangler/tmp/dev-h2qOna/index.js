var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/specs.ts
var AREA_INFO = {
  harrogate: { label: "Harrogate and Knaresborough", short: "Harrogate", name: "Harrogate and Knaresborough", page: "harrogate-primary-schools/", council: "North Yorkshire", district: "Harrogate", home: ["E07000165"], example: ["HG2 0NA", "Harrogate"] },
  york: { label: "York and villages", short: "York", name: "York", page: "york-primary-schools/", council: "York", home: ["E06000014"], example: ["YO24 1HW", "York"] },
  craven: { label: "Skipton, Settle and the Dales", short: "Skipton", name: "Skipton, Settle and the Dales", page: "skipton-primary-schools/", council: "North Yorkshire", district: "Craven", home: ["E07000163"], example: ["BD23 1ND", "Skipton"] },
  hambleton: { label: "Northallerton, Thirsk and Bedale", short: "Northallerton", name: "Northallerton, Thirsk and Bedale", page: "northallerton-primary-schools/", council: "North Yorkshire", district: "Hambleton", home: ["E07000164"], example: ["DL6 1QE", "Northallerton"] },
  richmondshire: { label: "Richmond, Catterick and Leyburn", short: "Richmond", name: "Richmond, Catterick and Leyburn", page: "richmond-primary-schools/", council: "North Yorkshire", district: "Richmondshire", home: ["E07000166"], example: ["DL10 4EJ", "Richmond"] },
  ryedale: { label: "Malton, Pickering and Ryedale", short: "Malton", name: "Malton, Norton and Pickering", page: "malton-primary-schools/", council: "North Yorkshire", district: "Ryedale", home: ["E07000167"], example: ["YO17 7XJ", "Malton"] },
  scarborough: { label: "Scarborough, Whitby and Filey", short: "Scarborough", name: "Scarborough, Whitby and Filey", page: "scarborough-primary-schools/", council: "North Yorkshire", district: "Scarborough", home: ["E07000168"], example: ["YO12 7HU", "Scarborough"] },
  selby: { label: "Selby and Tadcaster", short: "Selby", name: "Selby and Tadcaster", page: "selby-primary-schools/", council: "North Yorkshire", district: "Selby", home: ["E07000169"], example: ["YO8 4QB", "Selby"] },
  // East Riding has no districts: its areas are its parliamentary constituencies, as the DfE names them (cut at 30 letters)
  bridlington: { label: "Bridlington, Driffield and the Wolds", short: "Bridlington", name: "Bridlington, Driffield and Hornsea", page: "bridlington-primary-schools/", council: "East Riding of Yorkshire", constituencies: ["Bridlington and The Wolds"], home: ["E06000011"], example: ["YO16 7AQ", "Bridlington"] },
  beverley: { label: "Beverley and Holderness", short: "Beverley", name: "Beverley, Hedon and Withernsea", page: "beverley-primary-schools/", council: "East Riding of Yorkshire", constituencies: ["Beverley and Holderness"], home: ["E06000011"], example: ["HU17 9LW", "Beverley"] },
  goole: { label: "Goole, Howden and Pocklington", short: "Goole", name: "Goole, Howden and Pocklington", page: "goole-primary-schools/", council: "East Riding of Yorkshire", constituencies: ["Goole and Pocklington"], home: ["E06000011"], example: ["DN14 6TL", "Goole"] },
  cottingham: { label: "Cottingham, Hessle and Willerby", short: "Cottingham", name: "Cottingham, Hessle and Willerby", page: "cottingham-primary-schools/", council: "East Riding of Yorkshire", constituencies: ["Kingston upon Hull North and C", "Kingston upon Hull West and Ha"], home: ["E06000011"], example: ["HU16 5BP", "Cottingham"] },
  // Hull: its three constituencies. Hull publishes its catchments only as a picture, so these pages can't check them
  hulleast: { label: "East Hull", short: "East Hull", name: "East Hull", page: "east-hull-primary-schools/", council: "Kingston upon Hull, City of", constituencies: ["Kingston upon Hull East"], home: ["E06000010"], example: ["HU8 9JH", "East Hull"] },
  hullnorth: { label: "North Hull", short: "North Hull", name: "North Hull", page: "north-hull-primary-schools/", council: "Kingston upon Hull, City of", constituencies: ["Kingston upon Hull North and C"], home: ["E06000010"], example: ["HU5 4ET", "North Hull"] },
  hullwest: { label: "West Hull", short: "West Hull", name: "West Hull", page: "west-hull-primary-schools/", council: "Kingston upon Hull, City of", constituencies: ["Kingston upon Hull West and Ha"], home: ["E06000010"], example: ["HU3 2RA", "West Hull"] },
  // Teesside, in ceremonial North Yorkshire: one page per council. Neither publishes its admission zones as map data
  middlesbrough: { label: "Middlesbrough", short: "Middlesbrough", name: "Middlesbrough", page: "middlesbrough-primary-schools/", council: "Middlesbrough", home: ["E06000002"], example: ["TS5 6EA", "Middlesbrough"] },
  redcar: { label: "Redcar, Guisborough and Saltburn", short: "Redcar", name: "Redcar, Guisborough and Saltburn", page: "redcar-primary-schools/", council: "Redcar and Cleveland", home: ["E06000003"], example: ["TS10 1NL", "Redcar"] },
  // Calderdale, West Yorkshire: its two constituencies. Its primary schools have no catchments
  halifax: { label: "Halifax and Sowerby Bridge", short: "Halifax", name: "Halifax and Sowerby Bridge", page: "halifax-primary-schools/", council: "Calderdale", constituencies: ["Halifax"], home: ["E08000033"], example: ["HX1 3ER", "Halifax"] },
  caldervalley: { label: "Brighouse, Elland and the Calder Valley", short: "Calder Valley", name: "Brighouse, Elland, Hebden Bridge and Todmorden", page: "calder-valley-primary-schools/", council: "Calderdale", constituencies: ["Calder Valley"], home: ["E08000033"], example: ["HX7 6DS", "Hebden Bridge"] },
  // Kirklees, West Yorkshire: its constituencies (the Kirklees half of Ossett and Denby Dale). Its catchments are
  // "priority admission areas"
  huddersfield: { label: "Huddersfield", short: "Huddersfield", name: "Huddersfield", page: "huddersfield-primary-schools/", council: "Kirklees", constituencies: ["Huddersfield"], home: ["E08000034"], example: ["HD5 8YE", "Almondbury"] },
  dewsbury: { label: "Dewsbury and Batley", short: "Dewsbury", name: "Dewsbury and Batley", page: "dewsbury-primary-schools/", council: "Kirklees", constituencies: ["Dewsbury and Batley"], home: ["E08000034"], example: ["WF17 6BS", "Batley"] },
  spenvalley: { label: "Mirfield, Cleckheaton and Heckmondwike", short: "Spen Valley", name: "Mirfield, Cleckheaton, Heckmondwike and Birstall", page: "spen-valley-primary-schools/", council: "Kirklees", constituencies: ["Spen Valley"], home: ["E08000034"], example: ["WF14 8PR", "Mirfield"] },
  colnevalley: { label: "Holmfirth and the Colne Valley", short: "Colne Valley", name: "Holmfirth, Meltham and the Colne Valley", page: "colne-valley-primary-schools/", council: "Kirklees", constituencies: ["Colne Valley"], home: ["E08000034"], example: ["HD9 2RG", "Holmfirth"] },
  denbydale: { label: "Denby Dale and Kirkburton", short: "Denby Dale", name: "Denby Dale, Kirkburton and Skelmanthorpe", page: "denby-dale-primary-schools/", council: "Kirklees", constituencies: ["Ossett and Denby Dale"], home: ["E08000034"], example: ["HD8 8SG", "Denby Dale"] },
  // Leeds: its constituencies, with the few schools in constituencies that cross the council border joining the
  // nearest (Kippax and Methley in Selby's, Rothwell in Wakefield and Rothwell's, one Otley school in Skipton and Ripon's)
  headingley: { label: "Headingley, Kirkstall and central Leeds", short: "Headingley", name: "Headingley, Kirkstall and central Leeds", page: "headingley-primary-schools/", council: "Leeds", constituencies: ["Leeds Central and Headingley"], home: ["E08000035"], example: ["LS6 2DT", "Headingley"] },
  eastleeds: { label: "East Leeds, Garforth and Kippax", short: "East Leeds", name: "Cross Gates, Seacroft, Garforth and Kippax", page: "east-leeds-primary-schools/", council: "Leeds", constituencies: ["Leeds East", "Selby"], home: ["E08000035"], example: ["LS15 8HS", "Cross Gates"] },
  neleeds: { label: "Roundhay, Moortown and Alwoodley", short: "North East Leeds", name: "Roundhay, Moortown, Alwoodley and Chapel Allerton", page: "north-east-leeds-primary-schools/", council: "Leeds", constituencies: ["Leeds North East"], home: ["E08000035"], example: ["LS8 1ND", "Roundhay"] },
  horsforth: { label: "Horsforth, Otley, Guiseley and Yeadon", short: "Horsforth", name: "Horsforth, Otley, Guiseley and Yeadon", page: "horsforth-primary-schools/", council: "Leeds", constituencies: ["Leeds North West", "Skipton and Ripon"], home: ["E08000035"], example: ["LS18 4QP", "Horsforth"] },
  southleeds: { label: "South Leeds, Middleton and Rothwell", short: "South Leeds", name: "Beeston, Hunslet, Middleton and Rothwell", page: "south-leeds-primary-schools/", council: "Leeds", constituencies: ["Leeds South", "Wakefield and Rothwell"], home: ["E08000035"], example: ["LS10 4NU", "Middleton"] },
  morley: { label: "Morley, Farnley and Wortley", short: "Morley", name: "Morley, Farnley, Wortley and Gildersome", page: "morley-primary-schools/", council: "Leeds", constituencies: ["Leeds South West and Morley"], home: ["E08000035"], example: ["LS27 8LA", "Morley"] },
  pudsey: { label: "Pudsey, Bramley and Armley", short: "Pudsey", name: "Pudsey, Farsley, Bramley and Armley", page: "pudsey-primary-schools/", council: "Leeds", constituencies: ["Leeds West and Pudsey"], home: ["E08000035"], example: ["LS28 5BH", "Farsley"] },
  wetherby: { label: "Wetherby, Boston Spa and the villages", short: "Wetherby", name: "Wetherby, Boston Spa and the villages", page: "wetherby-primary-schools/", council: "Leeds", constituencies: ["Wetherby and Easingwold"], home: ["E08000035"], example: ["LS22 6RT", "Wetherby"] }
};
var listOf = /* @__PURE__ */ __name((xs, last = "and") => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${last} ${xs[xs.length - 1]}`, "listOf");
var PLACES = listOf(Object.values(AREA_INFO).map((a) => a.short));
var NY_PLACES = listOf(Object.values(AREA_INFO).filter((a) => a.council === "North Yorkshire").map((a) => a.short));
var COUNCIL_SHORT = { "East Riding of Yorkshire": "East Riding", "Kingston upon Hull, City of": "Hull", "Redcar and Cleveland": "Redcar" };
var COVERED = listOf([...new Set(Object.values(AREA_INFO).map((a) => COUNCIL_SHORT[a.council] ?? a.council))]);
var AREAS = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.label]));
var AREA_SHORT = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.short]));
var AREA_HOME = Object.fromEntries(Object.entries(AREA_INFO).map(([k, a]) => [k, a.home]));
var SPOTS = {
  uniform: { label: "School uniform", where: "In the panel for each school the shop supplies, or every school in the area", limit: 1, perSchool: true },
  profile: { label: "School profile", where: "Open days and a welcome note in the school\u2019s own panel", limit: 1, perSchool: true, needsSchools: true },
  nearby: { label: "Near this school", where: "One local service in each school\u2019s panel, taking turns", limit: 3 },
  results: { label: "Featured in results", where: "One card after the 4th school in the search results", limit: 1 },
  plan: { label: "Get ready for September", where: "The business cards on every parent\u2019s My plan page", limit: 6 },
  area: { label: "Area page directory", where: "The \u201CLocal help for families\u201D cards on the area page", limit: 9 },
  pagesponsor: { label: "Area page sponsor", where: "One line under the area page heading", limit: 1 }
};
var LIMITS = { name: 40, category: 30, blurb: 140, cta: 24, offer: 60, openDay: 40, openDays: 6, logoText: 2 };

// worker/admin.js
var today = /* @__PURE__ */ __name(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(/* @__PURE__ */ new Date()), "today");
var parse = /* @__PURE__ */ __name((v) => {
  try {
    const a = JSON.parse(v ?? "null");
    return Array.isArray(a) ? a : null;
  } catch {
    return null;
  }
}, "parse");
var STATUSES = ["draft", "live", "paused", "ended"];
var DATE = /^\d{4}-\d{2}-\d{2}$/;
var Bad = class extends Error {
  static {
    __name(this, "Bad");
  }
  constructor(msg, status = 400) {
    super(msg);
    this.status = status;
  }
};
function shapeAd(r) {
  const day = today();
  const showing = r.status === "live" && (!r.start_date || r.start_date <= day) && (!r.end_date || r.end_date >= day);
  return {
    id: r.id,
    advertiserId: r.advertiser_id,
    advertiser: r.advertiser_name ?? null,
    status: r.status,
    state: r.status !== "live" ? r.status : showing ? "showing" : r.start_date && r.start_date > day ? "scheduled" : "finished",
    placements: parse(r.placements) ?? [],
    areas: parse(r.areas) ?? [],
    urns: parse(r.urns),
    name: r.name,
    category: r.category,
    blurb: r.blurb,
    cta: r.cta,
    url: r.url,
    logoText: r.logo_text,
    logoUrl: r.logo_url,
    colour: r.colour,
    offer: r.offer,
    openDays: parse(r.open_days),
    start: r.start_date,
    end: r.end_date,
    pricePence: r.price_pence,
    pricePeriod: r.price_period,
    paid: !!r.paid,
    demo: !!r.demo,
    created: r.created_at,
    updated: r.updated_at
  };
}
__name(shapeAd, "shapeAd");
var str = /* @__PURE__ */ __name((v, max, label, required = false) => {
  const s = String(v ?? "").trim();
  if (required && !s) throw new Bad(`${label} is needed.`);
  if (s.length > max) throw new Bad(`${label} is ${s.length} characters; the limit is ${max}.`);
  return s || null;
}, "str");
function cleanAd(b) {
  const placements = [...new Set((b.placements ?? []).filter((p) => SPOTS[p]))];
  if (!placements.length) throw new Bad("Choose at least one ad spot.");
  const areas = [...new Set((b.areas ?? []).filter((a) => AREAS[a]))];
  if (!areas.length) throw new Bad("Choose at least one area.");
  const urns = Array.isArray(b.urns) && b.urns.length ? [...new Set(b.urns.map(Number).filter(Number.isInteger))] : null;
  if (placements.some((p) => SPOTS[p].needsSchools) && !urns) throw new Bad("A school profile needs the school (or schools) it belongs to.");
  let url = String(b.url ?? "").trim();
  if (!url) throw new Bad("Add the link the button opens.");
  if (!/^https?:\/\//i.test(url) && !url.startsWith("#")) url = "https://" + url;
  if (!url.startsWith("#")) {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) throw 0;
    } catch {
      throw new Bad("That link doesn\u2019t look like a web address.");
    }
  }
  const colour = String(b.colour ?? "").trim();
  if (colour && !/^#[0-9a-f]{6}$/i.test(colour)) throw new Bad("Colour should look like #2747D8.");
  for (const [k, label] of [["start", "Start date"], ["end", "End date"]]) if (b[k] && !DATE.test(b[k])) throw new Bad(`${label} should be a date.`);
  if (b.start && b.end && b.start > b.end) throw new Bad("The end date is before the start date.");
  const openDays = (Array.isArray(b.openDays) ? b.openDays : []).map((d) => String(d).trim()).filter(Boolean);
  if (openDays.length > LIMITS.openDays) throw new Bad(`Up to ${LIMITS.openDays} open days.`);
  openDays.forEach((d) => {
    if (d.length > LIMITS.openDay) throw new Bad(`Open day \u201C${d}\u201D is over ${LIMITS.openDay} characters.`);
  });
  const price = b.pricePence === "" || b.pricePence == null ? null : Math.round(Number(b.pricePence));
  if (price != null && (!Number.isFinite(price) || price < 0)) throw new Bad("Price should be a positive number.");
  return {
    advertiser_id: b.advertiserId ? Number(b.advertiserId) : null,
    placements: JSON.stringify(placements),
    areas: JSON.stringify(areas),
    urns: urns ? JSON.stringify(urns) : null,
    name: str(b.name, LIMITS.name, "Business name", true),
    category: str(b.category, LIMITS.category, "Category", true),
    blurb: str(b.blurb, LIMITS.blurb, "Description", true),
    cta: str(b.cta, LIMITS.cta, "Button text", true),
    url,
    logo_text: str(b.logoText, LIMITS.logoText, "Logo letters"),
    logo_url: str(b.logoUrl, 500, "Logo link"),
    colour: colour || null,
    offer: str(b.offer, LIMITS.offer, "Offer"),
    open_days: openDays.length ? JSON.stringify(openDays) : null,
    start_date: b.start || null,
    end_date: b.end || null,
    price_pence: price,
    price_period: ["month", "year", "once"].includes(b.pricePeriod) ? b.pricePeriod : null,
    paid: b.paid ? 1 : 0
  };
}
__name(cleanAd, "cleanAd");
async function clash(env, ad, id) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, placements, areas, urns, start_date, end_date FROM ads WHERE status = 'live' AND id != ?`
  ).bind(id ?? -1).all();
  const mine = { placements: parse(ad.placements), areas: parse(ad.areas), urns: parse(ad.urns) };
  const overlaps = /* @__PURE__ */ __name((o) => (!ad.end_date || !o.start_date || o.start_date <= ad.end_date) && (!o.end_date || !ad.start_date || o.end_date >= ad.start_date), "overlaps");
  for (const p of mine.placements) {
    const spot = SPOTS[p];
    for (const a of mine.areas) {
      const others = results.filter((o) => parse(o.placements)?.includes(p) && parse(o.areas)?.includes(a) && overlaps(o));
      if (spot.perSchool) {
        const hit2 = others.filter((o) => {
          const u = parse(o.urns);
          return !u && !mine.urns ? true : u && mine.urns ? u.some((x) => mine.urns.includes(x)) : false;
        });
        if (hit2.length >= spot.limit) return `${spot.label} in ${AREAS[a]} is already taken by ${hit2.map((o) => o.name).join(", ")} for those dates, ${mine.urns ? "on the same school" : "across every school"}.`;
      } else if (others.length >= spot.limit) {
        return `${spot.label} in ${AREAS[a]} is full for those dates (${spot.limit} at once): ${others.map((o) => o.name).join(", ")}.`;
      }
    }
  }
  return null;
}
__name(clash, "clash");
var getAd = /* @__PURE__ */ __name((env, id) => env.DB.prepare(
  "SELECT ads.*, advertisers.name AS advertiser_name FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id WHERE ads.id = ?"
).bind(id).first(), "getAd");
async function ads(request, env, parts) {
  const m = request.method, id = parts[0] ? Number(parts[0]) : null;
  if (!id && m === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT ads.*, advertisers.name AS advertiser_name FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id ORDER BY ads.updated_at DESC, ads.id DESC"
    ).all();
    return results.map(shapeAd);
  }
  if (!id && m === "POST") {
    const b = await request.json(), ad = cleanAd(b);
    const status = STATUSES.includes(b.status) ? b.status : "draft";
    if (status === "live") {
      const c = await clash(env, ad, null);
      if (c) throw new Bad(c, 409);
    }
    const cols = Object.keys(ad);
    const r = await env.DB.prepare(`INSERT INTO ads (${cols.join(", ")}, status) VALUES (${cols.map(() => "?").join(", ")}, ?) RETURNING id`).bind(...Object.values(ad), status).first();
    return shapeAd(await getAd(env, r.id));
  }
  if (!id) throw new Bad("Not found", 404);
  const row = await getAd(env, id);
  if (!row) throw new Bad("That ad doesn\u2019t exist.", 404);
  if (!parts[1] && m === "GET") return shapeAd(row);
  if (!parts[1] && m === "PUT") {
    const ad = cleanAd(await request.json());
    if (row.status === "live") {
      const c = await clash(env, ad, id);
      if (c) throw new Bad(c, 409);
    }
    const cols = Object.keys(ad);
    await env.DB.prepare(`UPDATE ads SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).bind(...Object.values(ad), id).run();
    return shapeAd(await getAd(env, id));
  }
  if (!parts[1] && m === "DELETE") {
    await env.DB.prepare("DELETE FROM ads WHERE id = ?").bind(id).run();
    return { ok: true };
  }
  if (parts[1] === "status" && m === "POST") {
    const { status } = await request.json();
    if (!STATUSES.includes(status)) throw new Bad("Unknown status.");
    if (status === "live") {
      const c = await clash(env, row, id);
      if (c) throw new Bad(c, 409);
    }
    await env.DB.prepare(`UPDATE ads SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(status, id).run();
    return shapeAd(await getAd(env, id));
  }
  if (parts[1] === "duplicate" && m === "POST") {
    const r = await env.DB.prepare(
      `INSERT INTO ads (advertiser_id, status, placements, areas, urns, name, category, blurb, cta, url, logo_text, logo_url, colour, offer, open_days, start_date, end_date, price_pence, price_period, paid, demo)
       SELECT advertiser_id, 'draft', placements, areas, urns, name, category, blurb, cta, url, logo_text, logo_url, colour, offer, open_days, start_date, end_date, price_pence, price_period, 0, demo
       FROM ads WHERE id = ? RETURNING id`
    ).bind(id).first();
    return shapeAd(await getAd(env, r.id));
  }
  throw new Bad("Not found", 404);
}
__name(ads, "ads");
var shapeAdvertiser = /* @__PURE__ */ __name((r) => ({
  id: r.id,
  name: r.name,
  contactName: r.contact_name,
  email: r.email,
  phone: r.phone,
  notes: r.notes,
  demo: !!r.demo,
  created: r.created_at,
  ads: r.ads ?? 0,
  live: r.live ?? 0,
  bookedPence: r.booked ?? 0
}), "shapeAdvertiser");
function cleanAdvertiser(b) {
  const email = str(b.email, 200, "Email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Bad("That email doesn\u2019t look right.");
  return {
    name: str(b.name, 160, "Business name", true),
    contact_name: str(b.contactName, 120, "Contact name"),
    email,
    phone: str(b.phone, 40, "Phone"),
    notes: str(b.notes, 4e3, "Notes")
  };
}
__name(cleanAdvertiser, "cleanAdvertiser");
async function advertisers(request, env, parts) {
  const m = request.method, id = parts[0] ? Number(parts[0]) : null;
  if (!id && m === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT advertisers.*, count(ads.id) AS ads, sum(ads.status = 'live') AS live,
              sum(CASE WHEN ads.status IN ('live', 'ended') THEN ads.price_pence ELSE 0 END) AS booked
       FROM advertisers LEFT JOIN ads ON ads.advertiser_id = advertisers.id GROUP BY advertisers.id ORDER BY advertisers.name COLLATE NOCASE`
    ).all();
    return results.map(shapeAdvertiser);
  }
  if (!id && m === "POST") {
    const a = cleanAdvertiser(await request.json());
    const r = await env.DB.prepare("INSERT INTO advertisers (name, contact_name, email, phone, notes) VALUES (?, ?, ?, ?, ?) RETURNING *").bind(a.name, a.contact_name, a.email, a.phone, a.notes).first();
    return shapeAdvertiser(r);
  }
  if (!id) throw new Bad("Not found", 404);
  if (m === "GET") {
    const r = await env.DB.prepare("SELECT * FROM advertisers WHERE id = ?").bind(id).first();
    if (!r) throw new Bad("That advertiser doesn\u2019t exist.", 404);
    return shapeAdvertiser(r);
  }
  if (m === "PUT") {
    const a = cleanAdvertiser(await request.json());
    const r = await env.DB.prepare("UPDATE advertisers SET name = ?, contact_name = ?, email = ?, phone = ?, notes = ? WHERE id = ? RETURNING *").bind(a.name, a.contact_name, a.email, a.phone, a.notes, id).first();
    return shapeAdvertiser(r);
  }
  if (m === "DELETE") {
    const n = await env.DB.prepare("SELECT count(*) AS n FROM ads WHERE advertiser_id = ?").bind(id).first();
    if (n.n) throw new Bad("This advertiser still has ads. Delete or move those first.", 409);
    await env.DB.prepare("UPDATE enquiries SET advertiser_id = NULL WHERE advertiser_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM advertisers WHERE id = ?").bind(id).run();
    return { ok: true };
  }
  throw new Bad("Not found", 404);
}
__name(advertisers, "advertisers");
async function enquiries(request, env, parts) {
  const m = request.method, id = parts[0] ? Number(parts[0]) : null;
  if (!id && m === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM enquiries ORDER BY created_at DESC, id DESC").all();
    return results.map((r) => ({ ...r, slots: parse(r.slots) ?? [], emailed: !!r.emailed }));
  }
  if (!id) throw new Bad("Not found", 404);
  const row = await env.DB.prepare("SELECT * FROM enquiries WHERE id = ?").bind(id).first();
  if (!row) throw new Bad("That enquiry doesn\u2019t exist.", 404);
  if (!parts[1] && m === "PUT") {
    const { status } = await request.json();
    if (!["new", "replied", "won", "lost"].includes(status)) throw new Bad("Unknown status.");
    await env.DB.prepare("UPDATE enquiries SET status = ? WHERE id = ?").bind(status, id).run();
    return { ok: true };
  }
  if (!parts[1] && m === "DELETE") {
    await env.DB.prepare("DELETE FROM enquiries WHERE id = ?").bind(id).run();
    return { ok: true };
  }
  if (parts[1] === "convert" && m === "POST") {
    if (row.advertiser_id) return { advertiserId: row.advertiser_id };
    const notes = [row.type && `Type: ${row.type}`, row.area && `Area: ${row.area}`, parse(row.slots)?.length && `Interested in: ${parse(row.slots).join(", ")}`, row.message].filter(Boolean).join("\n");
    const a = await env.DB.prepare("INSERT INTO advertisers (name, contact_name, email, phone, notes) VALUES (?, ?, ?, ?, ?) RETURNING id").bind(row.business, row.name, row.email, row.phone, notes || null).first();
    await env.DB.prepare(`UPDATE enquiries SET advertiser_id = ?, status = CASE WHEN status = 'new' THEN 'replied' ELSE status END WHERE id = ?`).bind(a.id, id).run();
    return { advertiserId: a.id };
  }
  throw new Bad("Not found", 404);
}
__name(enquiries, "enquiries");
async function spots(env) {
  const day = today();
  const { results } = await env.DB.prepare(`SELECT ads.*, advertisers.name AS advertiser_name FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id WHERE status = 'live'`).all();
  const live = results.map(shapeAd);
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  return Object.entries(SPOTS).map(([p, spot]) => ({
    placement: p,
    ...spot,
    areas: Object.keys(AREAS).map((a) => {
      const here = live.filter((x) => x.placements.includes(p) && x.areas.includes(a));
      return {
        area: a,
        showing: here.filter((x) => x.state === "showing").map((x) => ({ id: x.id, name: x.name, end: x.end, urns: x.urns, endingSoon: !!x.end && x.end <= soon })),
        scheduled: here.filter((x) => x.state === "scheduled").map((x) => ({ id: x.id, name: x.name, start: x.start }))
      };
    })
  }));
}
__name(spots, "spots");
async function stats(env, url) {
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days")) || 30));
  const end = today();
  const from = new Date(Date.parse(end + "T12:00:00Z") - (days - 1) * 864e5).toISOString().slice(0, 10);
  const q = /* @__PURE__ */ __name((sql, ...args) => env.DB.prepare(sql).bind(from, end, ...args).all().then((r) => r.results), "q");
  const [totals, series, pages, searches, schools, adRows, ads2] = await Promise.all([
    q("SELECT kind, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? GROUP BY kind"),
    q(`SELECT day, sum(CASE WHEN kind = 'page' THEN n ELSE 0 END) AS pages, sum(CASE WHEN kind = 'search' THEN n ELSE 0 END) AS searches
       FROM daily_counts WHERE day BETWEEN ? AND ? AND kind IN ('page', 'search') GROUP BY day`),
    q(`SELECT key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind = 'page' GROUP BY key ORDER BY n DESC LIMIT 15`),
    q(`SELECT key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind = 'search' GROUP BY key ORDER BY n DESC`),
    q(`SELECT key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind = 'panel' GROUP BY key ORDER BY n DESC LIMIT 20`),
    q(`SELECT kind, key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind IN ('ad_view', 'ad_click') GROUP BY kind, key`),
    env.DB.prepare("SELECT ads.id, ads.name, ads.status, ads.advertiser_id, ads.demo, advertisers.name AS advertiser FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id").all().then((r) => r.results)
  ]);
  const byDay = new Map(series.map((r) => [r.day, r]));
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.parse(from + "T12:00:00Z") + i * 864e5).toISOString().slice(0, 10);
    return { day: d, pages: byDay.get(d)?.pages ?? 0, searches: byDay.get(d)?.searches ?? 0 };
  });
  const perAd = /* @__PURE__ */ new Map();
  for (const r of adRows) {
    const [id, slot] = r.key.split(":");
    const a = perAd.get(id) ?? { id: Number(id), views: 0, clicks: 0, slots: {} };
    const s = a.slots[slot] ??= { views: 0, clicks: 0 };
    if (r.kind === "ad_view") {
      a.views += r.n;
      s.views += r.n;
    } else {
      a.clicks += r.n;
      s.clicks += r.n;
    }
    perAd.set(id, a);
  }
  const names = new Map(ads2.map((a) => [String(a.id), a]));
  const adStats = [...perAd.values()].map((a) => {
    const info = names.get(String(a.id));
    return { ...a, name: info?.name ?? `Deleted ad ${a.id}`, advertiser: info?.advertiser ?? null, advertiserId: info?.advertiser_id ?? null, status: info?.status ?? "deleted", demo: !!info?.demo };
  }).sort((x, y) => y.views - x.views);
  const total = Object.fromEntries(totals.map((r) => [r.kind, r.n]));
  return { from, to: end, days, total, daily, pages, searches, schools, ads: adStats };
}
__name(stats, "stats");
async function adminApi(request, env, pathname) {
  if (!env.DB) throw new Bad("The admin database isn\u2019t connected.", 500);
  const [section, ...parts] = pathname.replace(/^\/api\/admin\//, "").split("/").filter(Boolean);
  try {
    if (section === "ads") return { body: await ads(request, env, parts) };
    if (section === "advertisers") return { body: await advertisers(request, env, parts) };
    if (section === "enquiries") return { body: await enquiries(request, env, parts) };
    if (section === "spots" && request.method === "GET") return { body: await spots(env) };
    if (section === "stats" && request.method === "GET") return { body: await stats(env, new URL(request.url)) };
    if (section === "school-opens" && request.method === "GET") {
      const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
      const from = new Date(Date.parse(today() + "T12:00:00Z") - (days - 1) * 864e5).toISOString().slice(0, 10);
      const { results } = await env.DB.prepare(`SELECT key, sum(n) AS n FROM daily_counts WHERE kind = 'panel' AND day >= ? GROUP BY key`).bind(from).all();
      return { body: Object.fromEntries(results.map((r) => [r.key, r.n])) };
    }
    return { status: 404, body: { error: "Not found" } };
  } catch (e) {
    if (e instanceof Bad) return { status: e.status, body: { error: e.message } };
    if (e instanceof SyntaxError) return { status: 400, body: { error: "That request wasn\u2019t valid." } };
    throw e;
  }
}
__name(adminApi, "adminApi");

// worker/auth.js
var allowed = /* @__PURE__ */ __name((env, email) => !!email && (env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase()), "allowed");
var keys = { at: 0, list: [] };
async function publicKeys(team) {
  if (Date.now() - keys.at < 36e5 && keys.list.length) return keys.list;
  const r = await fetch(`${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error(`certs ${r.status}`);
  keys = { at: Date.now(), list: (await r.json()).keys ?? [] };
  return keys.list;
}
__name(publicKeys, "publicKeys");
var b64url = /* @__PURE__ */ __name((s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0)), "b64url");
var text = /* @__PURE__ */ __name((s) => new TextDecoder().decode(b64url(s)), "text");
async function fromToken(request, env) {
  const team = (env.ACCESS_TEAM_DOMAIN || "").replace(/\/$/, "");
  const auds = (env.ACCESS_AUD || "").split(",").map((s) => s.trim()).filter(Boolean);
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!team || !auds.length || !token) return null;
  const [h, p, sig] = token.split(".");
  if (!h || !p || !sig) return null;
  const head = JSON.parse(text(h)), claims = JSON.parse(text(p));
  if (head.alg !== "RS256") return null;
  const jwk = (await publicKeys(team)).find((k) => k.kid === head.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  const now = Date.now() / 1e3;
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!ok || claims.iss !== team || !aud.some((a) => auds.includes(a)) || !(claims.exp > now) || claims.nbf && claims.nbf > now + 60) return null;
  return claims.email ?? null;
}
__name(fromToken, "fromToken");
async function adminEmail(request, env, ctx) {
  let email = null;
  try {
    if (ctx?.access) email = (await ctx.access.getIdentity())?.email ?? null;
    if (!email) email = await fromToken(request, env);
  } catch (e) {
    console.error("admin auth", e);
    return null;
  }
  return allowed(env, email) ? email : null;
}
__name(adminEmail, "adminEmail");

// worker/index.js
var FROM = "enquiries@yorkshireschoolchecker.co.uk";
var TO = "jake.adams1307@gmail.com";
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var json = /* @__PURE__ */ __name((body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } }), "json");
var clip = /* @__PURE__ */ __name((v, n) => String(v ?? "").trim().slice(0, n), "clip");
var list = /* @__PURE__ */ __name((v) => {
  try {
    const a = JSON.parse(v ?? "null");
    return Array.isArray(a) ? a : null;
  } catch {
    return null;
  }
}, "list");
var today2 = /* @__PURE__ */ __name(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(/* @__PURE__ */ new Date()), "today");
async function sponsors(env) {
  if (!env.DB) return json([], 200);
  const day = today2();
  const { results } = await env.DB.prepare(
    `SELECT * FROM ads WHERE status = 'live'
       AND (start_date IS NULL OR start_date <= ?1) AND (end_date IS NULL OR end_date >= ?1)
     ORDER BY id`
  ).bind(day).all();
  const out = results.map((r) => ({
    id: String(r.id),
    name: r.name,
    category: r.category,
    blurb: r.blurb,
    cta: r.cta,
    url: r.url,
    placements: list(r.placements) ?? [],
    areas: list(r.areas) ?? [],
    urns: list(r.urns) ?? void 0,
    logo: r.logo_text ?? "",
    logoUrl: r.logo_url ?? void 0,
    colour: r.colour ?? "#14182B",
    offer: r.offer ?? void 0,
    openDays: list(r.open_days) ?? void 0,
    start: r.start_date ?? void 0,
    end: r.end_date ?? void 0,
    demo: !!r.demo
  }));
  return json(out, 200, { "Cache-Control": "public, max-age=60" });
}
__name(sponsors, "sponsors");
var SPOT_KEYS = "uniform|profile|nearby|results|plan|area|pagesponsor";
var HIT_KEYS = {
  page: /^(404|\/[a-z0-9\-\/]{0,80})$/,
  search: new RegExp(`^(${Object.keys(AREAS).join("|")}|outside)$`),
  // the area searched (lib/specs.ts)
  panel: /^\d{5,7}$/,
  ad_view: new RegExp(`^\\d{1,9}:(${SPOT_KEYS})$`),
  ad_click: new RegExp(`^\\d{1,9}:(${SPOT_KEYS})$`)
};
var BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|curl|wget|python|httpclient|monitor/i;
async function hit(request, env) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const origin = request.headers.get("Origin");
  const same = origin ? origin === new URL(request.url).origin : request.headers.get("Sec-Fetch-Site") === "same-origin";
  if (!same || BOT.test(request.headers.get("User-Agent") ?? "") || !env.DB) return new Response(null, { status: 204 });
  let body;
  try {
    body = JSON.parse((await request.text()).slice(0, 8e3));
  } catch {
    return new Response(null, { status: 400 });
  }
  const events = (Array.isArray(body?.e) ? body.e : []).slice(0, 40).filter((x) => Array.isArray(x) && HIT_KEYS[x[0]]?.test(String(x[1])) && Number.isInteger(x[2]) && x[2] > 0 && x[2] <= 20);
  if (!events.length) return new Response(null, { status: 204 });
  const day = today2();
  const add = env.DB.prepare("INSERT INTO daily_counts (day, kind, key, n) VALUES (?, ?, ?, ?) ON CONFLICT (day, kind, key) DO UPDATE SET n = n + excluded.n");
  await env.DB.batch(events.map(([kind, key, n]) => add.bind(day, kind, String(key), n)));
  return new Response(null, { status: 204 });
}
__name(hit, "hit");
async function enquiry(request, env) {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  const origin = request.headers.get("Origin");
  if (origin !== new URL(request.url).origin) return json({ error: "origin" }, 403);
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "json" }, 400);
  }
  if (b.website) return json({ ok: true });
  const f = {
    name: clip(b.name, 120),
    business: clip(b.business, 160),
    email: clip(b.email, 200),
    phone: clip(b.phone, 40),
    type: clip(b.type, 80),
    area: clip(b.area, 40),
    message: clip(b.message, 4e3),
    slots: (Array.isArray(b.slots) ? b.slots : []).map((s) => clip(s, 60)).slice(0, 10)
  };
  if (!f.name || !f.business || !EMAIL_RE.test(f.email)) return json({ error: "fields" }, 400);
  let id = null;
  if (env.DB) {
    try {
      const r = await env.DB.prepare(
        "INSERT INTO enquiries (name, business, email, phone, type, area, slots, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id"
      ).bind(f.name, f.business, f.email, f.phone || null, f.type || null, f.area || null, JSON.stringify(f.slots), f.message || null).first();
      id = r?.id ?? null;
    } catch (e) {
      console.error("enquiry save failed", e);
    }
  }
  const lines = [
    `Name: ${f.name}`,
    `Business: ${f.business}`,
    `Email: ${f.email}`,
    `Phone: ${f.phone || "not given"}`,
    `Type: ${f.type || "not given"}`,
    `Area: ${f.area || "not given"}`,
    `Interested in: ${f.slots.length ? f.slots.join(", ") : "not sure yet"}`,
    "",
    f.message || "(no message)"
  ];
  let emailed = false;
  try {
    await env.ENQUIRY.send({
      to: TO,
      from: FROM,
      replyTo: f.email,
      subject: `Advertising enquiry: ${f.business}`.replace(/[\r\n]+/g, " ").slice(0, 150),
      text: lines.join("\n")
    });
    emailed = true;
    if (id != null) await env.DB.prepare("UPDATE enquiries SET emailed = 1 WHERE id = ?").bind(id).run();
  } catch (e) {
    console.error("enquiry email failed", e);
  }
  return id != null || emailed ? json({ ok: true }) : json({ error: "send" }, 502);
}
__name(enquiry, "enquiry");
var DENIED = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Not allowed</title>
<body style="font:17px/1.5 system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#14182B">
<h1 style="font-size:28px">You can\u2019t see this page</h1><p>This part of the site is for the people who run it.</p>
<p><a href="/">Back to the school checker</a></p></body>`;
var PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-Frame-Options": "DENY" };
async function admin(request, env, ctx, pathname) {
  const email = await adminEmail(request, env, ctx);
  if (pathname.startsWith("/api/admin/")) {
    if (!email) return json({ error: "not allowed" }, 403, PRIVATE);
    if (pathname === "/api/admin/me") return json({ email, environment: env.ENVIRONMENT ?? "unknown" }, 200, PRIVATE);
    if (pathname === "/api/admin/summary") {
      const day = today2();
      const r2 = env.DB ? await env.DB.prepare(
        `SELECT
           (SELECT count(*) FROM ads WHERE status = 'live' AND (start_date IS NULL OR start_date <= ?1) AND (end_date IS NULL OR end_date >= ?1)) AS showing,
           (SELECT count(*) FROM ads) AS ads,
           (SELECT count(*) FROM advertisers) AS advertisers,
           (SELECT count(*) FROM enquiries WHERE status = 'new') AS new_enquiries,
           (SELECT count(*) FROM ads WHERE status = 'live' AND end_date BETWEEN ?1 AND date(?1, '+14 days')) AS ending_soon`
      ).bind(day).first() : null;
      return json(r2 ?? {}, 200, PRIVATE);
    }
    const r = await adminApi(request, env, pathname);
    return json(r.body, r.status ?? 200, PRIVATE);
  }
  if (!email) return new Response(DENIED, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVATE } });
  const page = await env.ASSETS.fetch(request);
  const res = new Response(page.body, page);
  for (const [k, v] of Object.entries(PRIVATE)) res.headers.set(k, v);
  return res;
}
__name(admin, "admin");
var worker_default = {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) return await admin(request, env, ctx, pathname);
      if (pathname === "/api/sponsors" && request.method === "GET") return await sponsors(env);
      if (pathname === "/api/enquiry") return await enquiry(request, env);
      if (pathname === "/api/hit") return await hit(request, env);
    } catch (e) {
      console.error(pathname, e);
      return json({ error: "server" }, 500);
    }
    if (pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return env.ASSETS.fetch(request);
  }
};

// ../../../../.npm/_npx/31203f1a28efbe66/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../.npm/_npx/31203f1a28efbe66/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-8G2nc9/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../.npm/_npx/31203f1a28efbe66/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-8G2nc9/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
