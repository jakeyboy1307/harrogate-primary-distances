"""Build the data for the Harrogate primary distances page.

Usage:  python3 -I build/build_data.py <raw-dir> <out.json>

<raw-dir> holds the files fetched by build/fetch.sh:
  p2022.xlsx ... p2026.xlsx   North Yorkshire primary admissions statistics (Data North Yorkshire)
  catch.geojson               council primary catchment areas (ArcGIS, Sept 2025)
  pschools.geojson            council primary school points (ArcGIS, Sept 2025)
  ofsted.csv                  Ofsted MI, state-funded schools, latest inspections
Needs openpyxl and shapely.
"""
import csv, io, json, re, sys
import openpyxl
from shapely.geometry import shape, mapping

RAW, OUT = sys.argv[1], sys.argv[2]
MI = 1609.344

DATASETS = {
    2026: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2026-2027-yearly-statistics-primary-and-secondary-school',
    2025: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2025-2026-yearly-statistics-primary-and-secondary-school',
    2024: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2024-2025-yearly-statistics-primary-and-secondary-school',
    2023: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2023-2024-yearly-statistics-primary-secondary-school',
}


def norm(s):
    s = str(s or '').lower().replace('’', "'").replace('`', "'")
    s = re.sub(r'church of england|c of e|cofe|c\.e\.', 'ce', s)
    return re.sub(r'\s+', ' ', s).strip()


# Distinctive name keys: every key must appear in the normalised name. Used to match the 2022/2023 sheets
# (no district column), the council's school points and the catchment polygons, which are county-wide.
KEYS = {
    3228: ['admiral long'], 3361: ['all saints ce'], 2302: ['askwith'], 2377: ['aspin park'],
    2348: ['beckwithshaw'], 2328: ['bilton grange'], 3226: ['birstwith'], 3227: ['bishop monkton'],
    2309: ['boroughbridge primary'], 3232: ['burton leonard'], 2383: ['coppice valley'],
    3357: ['dacre braithwaite'], 2347: ['darley'], 2165: ['dishforth airfield'], 3027: ['dishforth ce'],
    3237: ['follifoot'], 3266: ['fountains ce'], 2338: ['glasshouses'], 3240: ['goldsborough'],
    2327: ['great ouseburn'], 3242: ['green hammerton'], 3243: ['grewelthorpe'], 2329: ['grove road'],
    3245: ['hampsthwaite'], 3263: ['holy trinity'], 2368: ['hookstone'], 2321: ['kettlesing'],
    3248: ['killinghall'], 3062: ['kirby hill'], 3252: ['kirk hammerton'], 3249: ['kirkby malzeard'],
    3903: ["st john's", 'knaresborough'], 3255: ['long marston'], 3256: ['markington'],
    3363: ['marton-cum-grafton'], 2031: ['masham'], 2389: ['meadowside'], 2367: ['moorside primary'],
    2330: ['new park'], 3260: ['north rigton'], 3258: ['north stainley'], 5200: ['nun monkton'],
    2331: ['oatlands inf'], 2008: ['greystone'], 2372: ['pannal'], 3368: ['richard taylor'],
    3261: ['ripley endowed'], 3262: ['ripon cathedral'], 3264: ['roecliffe'], 2382: ['rossett acre'],
    2425: ['saltergate inf'], 2350: ['scotton'], 3271: ['sharow'], 2354: ['sicklinghall'],
    3275: ['spofforth'], 3225: ["st cuthbert"], 3378: ["st joseph", 'harrogate'],
    3371: ["st mary", 'knaresborough'], 3247: ["st peter's ce primary"], 3377: ["st robert"],
    3372: ["st wilfrid"], 2011: ['starbeck'], 2358: ['staveley'], 2335: ['summerbridge'],
    3278: ['tockwith'], 2333: ['western primary'], 2364: ['willow tree'],
}
# Catchment polygon names are cut off at 60 characters, so some need looser keys.
CATCH_KEYS = {2425: [['saltergate']], 2331: [['oatlands inf']], 3378: [], 3371: [], 3377: [], 3372: [], 3368: [],
              3363: [['marton-cum-grafton']]}
# 2023 names that the keys alone can't place
KEYS_2023 = {3263: ['holy trinity', 'infant'], 3378: ["st joseph's", 'harrogate'], 3371: ["st mary's", 'knaresborough'],
             3372: ["st wilfrid's"], 2031: ['masham']}

PLACE = {
    3228: 'Burnt Yates', 3361: 'Kirkby Overblow', 2302: 'Askwith', 2377: 'Knaresborough', 2348: 'Beckwithshaw',
    2328: 'Harrogate', 3226: 'Birstwith', 3227: 'Bishop Monkton', 2309: 'Boroughbridge', 3232: 'Burton Leonard',
    2383: 'Harrogate', 3357: 'Summerbridge', 2347: 'Darley', 2165: 'Dishforth Airfield', 3027: 'Dishforth',
    3237: 'Follifoot', 3266: 'Grantley', 2338: 'Glasshouses', 3240: 'Goldsborough', 2327: 'Great Ouseburn',
    3242: 'Green Hammerton', 3243: 'Grewelthorpe', 2329: 'Harrogate', 3245: 'Hampsthwaite', 3263: 'Ripon',
    2368: 'Harrogate', 2321: 'Kettlesing', 3248: 'Killinghall', 3062: 'Kirby Hill', 3252: 'Kirk Hammerton',
    3249: 'Kirkby Malzeard', 3903: 'Knaresborough', 3255: 'Long Marston', 3256: 'Markington',
    3363: 'Marton-cum-Grafton', 2031: 'Masham', 2389: 'Knaresborough', 2367: 'Ripon', 2330: 'Harrogate',
    3260: 'North Rigton', 3258: 'North Stainley', 5200: 'Nun Monkton', 2331: 'Harrogate', 2008: 'Ripon',
    2372: 'Pannal', 3368: 'Harrogate', 3261: 'Ripley', 3262: 'Ripon', 3264: 'Roecliffe', 2382: 'Harrogate',
    2425: 'Harrogate', 2350: 'Lingerfield', 3271: 'Sharow', 2354: 'Sicklinghall', 3275: 'Spofforth',
    3225: 'Pateley Bridge', 3378: 'Harrogate', 3371: 'Knaresborough', 3247: 'Harrogate', 3377: 'Harrogate',
    3372: 'Ripon', 2011: 'Starbeck', 2358: 'Staveley', 2335: 'Summerbridge', 3278: 'Tockwith',
    2333: 'Harrogate', 2364: 'Harrogate',
}
METHOD = {'shortest walking distance': 'walking', 'straight line': 'straight_line'}


def has_keys(name, keys):
    n = norm(name)
    return bool(keys) and all(k in n for k in keys)


def rows_of(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    h = next(i for i, r in enumerate(rows) if r and any(isinstance(c, str) and c.strip() in ('School name', 'Name') for c in r))
    head = [str(c or '').strip() for c in rows[h]]
    return head, [r for r in rows[h + 1:] if r and r[1 if head[0].startswith('School DFE') else 0]]


def col(head, *words):
    for i, c in enumerate(head):
        cl = c.lower()
        if all(w in cl for w in words):
            return i
    raise KeyError(words)


def num(v):
    if isinstance(v, (int, float)):
        return int(v)
    try:
        return int(str(v).strip())
    except ValueError:
        return None


def parse_cutoff(v):
    """Turn the council's 'distance of last child allocated' cell into a record."""
    t = re.sub(r'\s+', ' ', str(v if v is not None else '').strip())
    tl = t.lower()
    if tl in ('', 'n/a', 'na', 'none'):
        return {'s': 'all_offered'}
    if 'contact' in tl:
        return {'s': 'not_published'}
    m = re.search(r'(\d+(?:\.\d+)?)', t)
    if not m:
        raise ValueError('unparsed cut-off: ' + t)
    miles = float(m.group(1))
    if 'sibling' in tl:
        g = 'sib'
    elif re.search(r'\bout\b', tl):
        g = 'out'
    elif re.search(r'\bin catchment', tl):
        g = 'in'
    elif 'criteria' in tl:
        g = 'crit'
    else:
        raise ValueError('unknown group: ' + t)
    r = {'s': 'distance', 'm': round(miles * MI), 'mi': miles, 'g': g}
    if g == 'crit':
        r['crit'] = re.search(r'criteria (\d+)', tl).group(1)
    return r


# ---------- admissions sheets ----------
sheets = {}
for y in (2022, 2023, 2024, 2025, 2026):
    head, rows = rows_of(f'{RAW}/p{y}.xlsx')
    named = head[0].startswith('School DFE')
    c = {
        'name': col(head, 'name'),
        'pan': next(i for i, h in enumerate(head) if 'pan' in h.lower()),
        'apps': col(head, 'applications'),
        'off': next(i for i, h in enumerate(head) if 'allocated' in h.lower() and 'distance' not in h.lower()),
        'cut': col(head, 'distance of last'),
    }
    if named:
        c.update(dfe=0, district=col(head, 'district'), type=col(head, 'school type'))
        try:
            c['first'] = col(head, 'first preferences')
        except KeyError:
            pass
        try:
            c['method'] = col(head, 'distance measurement')
        except KeyError:
            pass
    sheets[y] = (head, rows, c)

head, rows26, c26 = sheets[2026]
base = [r for r in rows26 if r[c26['district']] == 'Harrogate' and 'junior' not in r[c26['name']].lower()]
unknown = [r[0] for r in base if r[0] not in KEYS]
assert not unknown, f'add keys for {unknown}'


def find_row(y, dfe, name_keys):
    head, rows, c = sheets[y]
    if 'dfe' in c:
        if dfe == 3263:   # Holy Trinity: before 2026 the reception intake was the infant school
            hit = [r for r in rows if has_keys(r[c['name']], ['holy trinity', 'infant'])] or \
                  [r for r in rows if r[c['dfe']] == 3263 and 'junior' not in r[c['name']].lower()]
        elif dfe == 2031:  # Masham changed number
            hit = [r for r in rows if has_keys(r[c['name']], ['masham']) and r[c['district']] == 'Harrogate']
        else:
            hit = [r for r in rows if r[c['dfe']] == dfe and 'junior' not in r[c['name']].lower()]
    else:
        hit = [r for r in rows if has_keys(r[c['name']], name_keys) and 'junior' not in r[c['name']].lower()]
    if len(hit) > 1:
        raise ValueError(f'{y} {dfe}: ambiguous {[h[c["name"]] for h in hit]}')
    return hit[0] if hit else None


schools = []
for r in base:
    dfe, name = r[0], r[c26['name']]
    s = {'dfe': dfe, 'name': name, 'place': PLACE[dfe], 'kind': r[c26['type']],
         'method': METHOD.get(str(r[c26['method']]).strip().lower(), 'unknown'),
         'pan': num(r[c26['pan']]), 'd': []}
    for y in (2026, 2025, 2024, 2023):
        keys = KEYS_2023.get(dfe, KEYS[dfe]) if y == 2023 else KEYS[dfe]
        row = find_row(y, dfe, keys)
        if row is None:
            print(f'  no {y} row for {name}')
            continue
        head, rows, c = sheets[y]
        rec = {'y': y, **parse_cutoff(row[c['cut']])}
        rec['a'] = num(row[c['apps']])
        rec['o'] = num(row[c['off']])
        if 'first' in c:
            rec['f'] = num(row[c['first']])
        prev = find_row(y - 1, dfe, KEYS_2023.get(dfe, KEYS[dfe]) if y - 1 <= 2023 else KEYS[dfe])
        if prev is not None:   # each sheet gives next year's admission number
            rec['p'] = num(prev[sheets[y - 1][2]['pan']])
        if dfe == 3263 and rec.get('p') is None:   # the 2025 sheet puts the new primary's number on its own row
            ph, prow, pc = sheets[y - 1]
            rec['p'] = next((num(x[pc['pan']]) for x in prow if has_keys(x[pc['name']], ['holy trinity', 'primary'])), None)
        if dfe == 3263 and y < 2026:
            rec['n'] = 'as Holy Trinity CE Infant School'
        if rec['s'] == 'distance' and rec['g'] != 'sib' and rec['m'] > 16 * MI:
            # e.g. 533.56 miles: the last place went to a family far away, so everyone local got in
            rec['n'] = f"Last place went to a child {rec['mi']:g} miles away, so everyone nearby who applied got in"
            rec = {k: v for k, v in rec.items() if k not in ('m', 'g', 'mi')} | {'s': 'all_offered'}
        rec.pop('mi', None)
        s['d'].append(rec)
    schools.append(s)

# ---------- council school points ----------
pts = json.load(open(f'{RAW}/pschools.geojson'))['features']
for s in schools:
    hit = [f for f in pts if has_keys(f['properties']['School'], KEYS[s['dfe']])
           and 'junior' not in f['properties']['School'].lower()]
    if s['dfe'] == 3372:
        hit = [f for f in hit if f['properties']['Postcode'].startswith('HG4')]
    if len(hit) == 1:
        lng, lat = hit[0]['geometry']['coordinates']
        s['ll'] = [round(lat, 6), round(lng, 6)]
        s['postcode'] = hit[0]['properties']['Postcode']
        s['faith'] = hit[0]['properties']['Religious_character']
    else:
        print(f'  point matches for {s["name"]}: {len(hit)}')

# ---------- Ofsted ----------
ROW = {'1': 'Outstanding', '2': 'Good', '3': 'Requires improvement', '4': 'Inadequate'}
CONCERN = {'SM': 'Special measures', 'SWK': 'Serious weaknesses'}
raw = open(f'{RAW}/ofsted.csv', 'rb').read().decode('utf-8-sig', errors='replace')
mi = list(csv.reader(io.StringIO(raw)))
mi = {r[2]: dict(zip(mi[0], r)) for r in mi[1:]}
val = lambda v: None if v in ('', 'NULL', None) else v
iso = lambda d: None if not val(d) else f'{d[6:10]}-{d[3:5]}-{d[0:2]}'


def ofsted(x):
    if not x:
        return None
    o = {'urn': x['URN'], 'link': f"https://reports.ofsted.gov.uk/provider/21/{x['URN']}"}
    if val(x['Inspection type']):   # report card (from November 2025)
        names = ['Inclusion', 'Curriculum and teaching', 'Achievement', 'Attendance and behaviour',
                 'Personal development and wellbeing', 'Early years (where applicable)', 'Leadership and governance']
        o.update(kind='card', date=iso(x['Inspection start date']),
                 areas=[[n.replace(' (where applicable)', ''), x[n]] for n in names if val(x[n]) and x[n] != 'Not applicable'],
                 safeguarding=val(x['Safeguarding standards']))
        rel = x['Does the latest full inspection relate to the URN of the current school?']
        concern = val(x['Category of concern'])
    elif val(x['Latest OEIF overall effectiveness']):
        oe = x['Latest OEIF overall effectiveness']
        o['date'] = iso(x['Inspection start date of latest OEIF graded inspection'])
        if oe in ROW:
            o.update(kind='grade', grade=ROW[oe])
        else:   # September 2024 to November 2025: sub-grades only
            names = [('Quality of education', 'Latest OEIF quality of education'),
                     ('Behaviour and attitudes', 'Latest OEIF behaviour and attitudes'),
                     ('Personal development', 'Latest OEIF personal development'),
                     ('Leadership and management', 'Latest OEIF effectiveness of leadership and management'),
                     ('Early years', 'Latest OEIF early years provision (where applicable)')]
            o.update(kind='areas', areas=[[n, ROW[x[k]]] for n, k in names if x[k] in ROW])
        rel = x['Does the latest OEIF graded inspection relate to the URN of the current school?']
        concern = val(x['Latest OEIF category of concern'])
    elif val(x['Ungraded inspection overall outcome']):
        o['kind'] = 'ungraded'
        rel = x['Does the ungraded inspection relate to the URN of the current school?']
        concern = None
    else:
        o['kind'] = 'none'
        return o
    if val(x['Ungraded inspection overall outcome']):
        ud = iso(x['Date of latest ungraded inspection'])
        if o['kind'] == 'ungraded' or ud > (o.get('date') or ''):
            outcome = re.sub(r'\s*-\s*S5 Next$', '', x['Ungraded inspection overall outcome'])
            o['ungraded'] = {'date': ud, 'outcome': outcome}
            if o['kind'] == 'ungraded':
                o['date'] = ud
    if rel == 'No':
        o['predecessor'] = True
    if concern in CONCERN:
        o['concern'] = CONCERN[concern]
    return o


for s in schools:
    x = mi.get(f"815{s['dfe']}")
    if s['dfe'] == 2031 and not x:
        x = mi.get('8153319')
    if not x:
        x = next((v for v in mi.values() if v['Local authority'] == 'North Yorkshire' and v['Ofsted phase'] == 'Primary'
                  and has_keys(v['School name'], KEYS[s['dfe']])), None)
    if not x:
        print(f'  no Ofsted row for {s["name"]}')
    s['of'] = ofsted(x)
    if x:
        s.setdefault('postcode', x['Postcode'])
        s.setdefault('faith', x['Designated religious character'])

# ---------- catchments ----------
feats = json.load(open(f'{RAW}/catch.geojson'))['features']
catch, used = [], {}
for f in feats:
    owners = []
    for s in schools:
        keysets = CATCH_KEYS.get(s['dfe'], [KEYS[s['dfe']]])
        if any(has_keys(f['properties']['School'], ks) for ks in keysets):
            owners.append(s)
    if not owners:
        continue
    g = shape(f['geometry']).buffer(0).simplify(0.00006, preserve_topology=True)
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    rings = []
    for p in polys:
        part = [[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [p.exterior, *p.interiors]]
        rings.append(part)
    idx = len(catch)
    catch.append({'name': f['properties']['School'], 'p': rings})
    for s in owners:
        s.setdefault('cz', []).append(idx)
for s in schools:
    if 'cz' not in s:
        print(f'  no catchment for {s["name"]}')
    if any(r.get('g') in ('in', 'out', 'sib') for r in s['d']) and 'cz' not in s:
        print(f'  !! catchment cut-off but no polygon: {s["name"]}')

# ---------- tidy ----------
def kind(s):
    k, f = s['kind'], (s.get('faith') or '')
    faith = {'Church of England': 'C of E', 'Roman Catholic': 'Catholic'}.get(f)
    base = {'Community School': 'community', 'Voluntary Controlled': 'voluntary controlled',
            'Voluntary Aided': 'voluntary aided', 'Academy': 'academy', 'Foundation': 'foundation'}[k]
    return f'{faith} {base}' if faith else base


for s in schools:
    s['type'] = kind(s)
    s['own'] = s['kind'] not in ('Community School', 'Voluntary Controlled')
    s['src'] = DATASETS[2026]
    for k in ('kind', 'faith'):
        s.pop(k, None)

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': u} for y, u in DATASETS.items()]}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} catchment areas, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
