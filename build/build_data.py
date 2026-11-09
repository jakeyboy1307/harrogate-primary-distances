"""Build the North Yorkshire school data: every school in the FULL districts, plus schools near York in NEAR_YORK.

Usage:  python3 -I build/build_data.py <raw-dir> <out.json>

<raw-dir> holds the files fetched by build/fetch.sh:
  p2022.xlsx ... p2026.xlsx   North Yorkshire primary admissions statistics (Data North Yorkshire)
  catch.geojson               council primary catchment areas (ArcGIS, Sept 2025)
  pschools.geojson            council primary school points (ArcGIS, Sept 2025)
  ofsted.csv                  Ofsted MI, state-funded schools, latest inspections
  ofsted2019.csv              Ofsted MI, latest inspections at 31 August 2019 (grades from before the 2019 framework)
Needs openpyxl and shapely.
"""
import csv, io, json, os, re, sys
import openpyxl
from shapely.geometry import Point, shape, mapping
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, kind, ofsted, read_mi

RAW, OUT = sys.argv[1], sys.argv[2]
MI = 1609.344

# Every school in the FULL districts is in. Harrogate district schools are matched with the hand-written keys below;
# the rest are matched automatically, by council code, postcode and name. In the NEAR_YORK districts, only schools
# within NEAR_YORK_MI of York Minster are in. To cover a new district, move it from NEAR_YORK to FULL.
FULL = ('Harrogate', 'Selby', 'Hambleton', 'Ryedale', 'Scarborough')
NEAR_YORK = ()
YORK = (53.9622, -1.0819)
NEAR_YORK_MI = 15

DATASETS = {
    2026: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2026-2027-yearly-statistics-primary-and-secondary-school',
    2025: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2025-2026-yearly-statistics-primary-and-secondary-school',
    2024: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2024-2025-yearly-statistics-primary-and-secondary-school',
    2023: 'https://hub.datanorthyorkshire.org/dataset/school-admissions-2023-2024-yearly-statistics-primary-secondary-school',
}


def norm(s):
    s = str(s or '').lower().replace('’', "'").replace('`', "'")
    s = re.sub(r'church of england|c of e|cof e|cofe|c\.e\.', 'ce', s)   # "Cof E": Carleton Endowed
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
             3372: ["st wilfrid's"], 2031: ['masham'], 2427: ['riverside', '(n)'], 3001: ['aiskew'],
             # names too unlike their 2023 ones to match automatically
             3276: ['sutton in craven ce'], 2359: ['sutton in craven comm'], 3154: ['filey', 'infant and nursery'],
             3615: ['st peters roman catholic']}
# Schools renamed since: the name they had in the years before 2026
FORMERLY = {3001: 'Aiskew, Leeming Bar CE Primary School'}

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
    # outside Harrogate, where the council's address gives a post town or a neighbouring village
    3060: 'Ingleby Greenhow', 2166: 'RAF Leeming', 2014: 'Thirsk', 3614: 'Richmond', 2015: 'Scarborough', 2042: 'Lealholm',
    2250: 'Brompton-by-Sawdon',
}
# School websites the council has wrong or missing, each checked by opening it (9 November 2026): old council
# addresses that no longer answer, trust sites that moved, and Burneston's old domain, which now belongs to a
# cashback site. Re-check them at the yearly refresh: python3 build/check_websites.py
WEB = {
    2021: 'https://www.alanbrookeacademy.org/', 2225: 'https://www.broomfield-alt.uk/', 2163: 'https://www.millhill-alt.uk/',
    3101: 'http://www.sessayprimaryschool.org/', 2247: 'http://appletonwiske.n-yorks.sch.uk/', 2097: 'http://romanby.n-yorks.sch.uk/',
    2320: 'https://fairburn.n-yorks.sch.uk/', 3010: 'https://www.bedale-ce.n-yorks.sch.uk/', 3337: 'http://burneston.n-yorks.sch.uk/',
    3228: 'https://www.admirallongprimary.co.uk/', 2302: 'https://askwith.n-yorks.sch.uk/',
    2400: 'https://sites.google.com/barlbybridge.n-yorks.sch.uk/barlbybridgeschool/home', 3150: 'https://www.cliffe.setschools.uk/',
    3288: 'https://www.fog.hlt.academy/', 2327: 'https://greatouseburn-n-yorks.secure-dbprimary.com/n-yorks/primary/greatouseburn',
    3263: 'https://www.htjce.co.uk/', 2030: 'https://www.husthwaiteprimaryschool.org/',
    3260: 'https://asnrfellowship.ycst.co.uk/',   # North Rigton shares a site with All Saints, Kirkby Overblow
    2331: 'https://www.oatlandsinf.ycst.co.uk/', 3902: 'https://shn.npcat.org.uk/', 3225: 'https://uppernidderdalefed.school/',
    3247: 'https://stpeters.ycst.co.uk/', 2011: 'https://www.starbeckprimaryacademy.org.uk/', 2151: 'https://welburnprimary.academy/',
    2364: 'https://www.willowtreeprimary.org.uk/',
    2027: 'https://luttons.ebor.academy/', 2028: 'https://sherburn.ebor.academy/', 2132: 'http://slingsby.n-yorks.sch.uk/',
    2117: 'https://gladstoneroadschool.co.uk/', 2170: 'https://overdalecps.co.uk/', 3035: 'https://sleights.n-yorks.sch.uk/',
    3602: 'https://stheddas.npcat.org.uk/',
}
METHOD = {'shortest walking distance': 'walking', 'straight line': 'straight_line'}


def has_keys(name, keys):
    n = norm(name)
    return bool(keys) and all(k in n for k in keys)


# ---------- automatic matching, for schools without hand-written keys ----------
STOP = {'school', 'primary', 'the', 'and', 'a', 'of', 'ce', 'church', 'england', 'voluntary', 'controlled', 'aided', 'vc',
        'va', 'community', 'academy', 'catholic', 'rc', 'cp', 'cofe', 'c', 'e', 'nursery', 'methodist', 'anglican', 'in',
        'trust', 'foundation', 'federation', 'endowed', 'parochial', 'cevc', 'ceva', 'comm', 'sch', 'scho', 'schoo'}


def tokens(name):
    # (N), (P) and the like are the 2023 sheet's own codes; 'comm.' and cut-off endings like 'Scho' are stop words
    # one-letter leftovers are cut-off words too: "...Voluntary Controlled Primary S" (catchment names stop at 60 characters)
    return {t for t in re.findall(r"[a-z0-9]+", re.sub(r'\(.*?\)', '', norm(name)).replace("'", '')) if t not in STOP and len(t) > 1}


def sim(a, b):
    """How alike two school names are, 0 to 1, ignoring words every school name has."""
    A, B = tokens(a), tokens(b)
    return len(A & B) / len(A | B) if A | B else 0


def part_sim(part, name, cut=False, place=''):
    """sim() for one school's part of a shared catchment's name. When the name was cut off at 60 characters, its last
    word may be cut too: "... & Pickering Community Infa" still means the Infant school. "CP" (community primary)
    and a town written before a comma don't count: "Scarborough, Northstead CP School" is Northstead Community Primary."""
    A, B = tokens(part), tokens(name)
    town = tokens(part.split(',')[0]) if ',' in part else set()   # "Scarborough, Northstead CP School"
    town = town if len(town) == 1 else set()   # a one-word town, not "Barwic Parade CP School, Selb"
    A = (A - {'cp'} - town) or A
    if cut:
        last = re.findall(r"[a-z0-9]+", norm(part).replace("'", ''))[-1:]
        whole = [b for b in B if last and b.startswith(last[0])]
        if whole:
            A = (A - set(last)) | {whole[0]}
    return len(A & B) / len(A | B) if A | B else 0


def overlap(a, b):
    """Share of the shorter name's words found in the other: 'Riverside' against 'Riverside, Tadcaster' scores 1."""
    A, B = tokens(a), tokens(b)
    return len(A & B) / min(len(A), len(B)) if A and B else 0


def same_pc(a, b):
    return str(a or '').replace(' ', '').upper() == str(b or '').replace(' ', '').upper()


def miles(a, b):
    import math
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 3958.8 * math.asin(math.sqrt(h))


STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|green|parade|hill|bank|square|link|drive|walk|'
                    r'gardens|place|barracks|end|row|gate|ings|leas|broadmanor|hilltop)$|\d|school', re.I)


def place_of(p):
    """The village or town a council school point is in: the first address line that isn't a street, else the post town."""
    for k in ('Address_2', 'Address_3', 'Address_1'):
        v = str(p.get(k) or '').strip().rstrip(',')
        if v and not STREET.search(v):
            return v.title() if v.isupper() else v
    return str(p.get('Address_4') or '').strip().title()


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
    # a distance with no group, bare (Sinnington, 2023) or "Distance - 0.314 miles" (Stakesby, 2026): who the last place
    # went to isn't said, and guessing could tell a family outside the catchment they'd have got in, so don't
    bare = re.fullmatch(r'(?:distance\s*-?\s*)?(\d+(?:\.\d+)?)(?:\s*miles?)?', tl)
    if bare:
        return {'s': 'not_published', 'n': f"The council gave a distance ({float(bare.group(1)):g} miles) but not who the last place went to"}
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
    elif tl.startswith('staff'):   # "Staff - 10.003 miles": the last place went to a child of staff, after the catchment
        g = 'staff'
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

# Council school points and Ofsted rows are read here because they place the schools outside Harrogate
pts = json.load(open(f'{RAW}/pschools.geojson'))['features']
raw = open(f'{RAW}/ofsted.csv', 'rb').read().decode('utf-8-sig', errors='replace')
mi = list(csv.reader(io.StringIO(raw)))
mi = {r[2]: dict(zip(mi[0], r)) for r in mi[1:]}


def junior(r):
    """A school whose youngest children are 7, so it has no Reception class. Ofsted's register says so even when the
    name doesn't (Gunnerside Methodist Primary); the name is the fallback."""
    x = mi.get(f'815{r[0]}')
    age = num(x.get('Statutory lowest age')) if x else None
    return age >= 6 if age is not None else 'junior' in r[c26['name']].lower()


base = [r for r in rows26 if r[c26['district']] == 'Harrogate' and not junior(r)]
unknown = [r[0] for r in base if r[0] not in KEYS]
assert not unknown, f'add keys for {unknown}'


def reception_rows(rows):
    """One row per school. A few Dales schools have two rows under one code in the 2026 sheet as their federations
    become infant/junior pairs (Bainbridge, Reeth, Spennithorne): the row with places for 2027 is the school, and the
    other row's name is what it was called before. A school whose only places are on a "Junior" row (Askrigg) has no
    Reception class from 2027, so it's left out like the other junior schools."""
    by = {}
    for r in rows:
        by.setdefault(r[0], []).append(r)
    out = []
    for dfe, rs in by.items():
        if len(rs) == 1:
            out.append(rs[0])
            continue
        keep = [r for r in rs if num(r[c26['pan']]) is not None]
        if len(keep) != 1:
            raise ValueError(f'{dfe}: can\'t tell which row is the school: {[r[c26["name"]] for r in rs]}')
        keep = keep[0]
        if 'junior' in keep[c26['name']].lower():
            print(f'  {keep[c26["name"]].strip()}: only junior places from 2027, left out')
            continue
        FORMERLY.setdefault(dfe, next(r for r in rs if r is not keep)[c26['name']].strip())
        out.append(keep)
    return out


# The other districts: Ofsted's LAESTAB is 815 plus the council's code, which gives the postcode to find the council's point
POINT = {}
for r in reception_rows([r for r in rows26 if r[c26['district']] != 'Harrogate']):
    name = r[c26['name']]
    if r[c26['district']] == 'Harrogate' or r[c26['district']] not in FULL + NEAR_YORK or junior(r):
        continue
    x = mi.get(f'815{r[0]}')
    hit = [f for f in pts if x and same_pc(f['properties']['Postcode'], x['Postcode'])]
    if not hit:   # the school has moved or the postcodes differ: fall back to a clear name match
        hit = [f for f in pts if sim(f['properties']['School'], name) >= 0.75]
    if len(hit) > 1:
        hit = [max(hit, key=lambda f: sim(f['properties']['School'], name))]
    if not hit:
        print(f'  no council point for {name}, left out')
        continue
    lng, lat = hit[0]['geometry']['coordinates']
    if r[c26['district']] in FULL or miles((lat, lng), YORK) <= NEAR_YORK_MI:
        base.append(r)
        POINT[r[0]] = hit[0]


def by_name(rows, c, name):
    """The one row whose name is clearly this school's, or none if two are equally close."""
    for score, floor in ((sim, 0.6), (overlap, 1)):   # a close match first, else one whose name contains this one's
        scored = sorted(((score(r[c['name']], name), i) for i, r in enumerate(rows) if 'junior' not in str(r[c['name']]).lower()),
                        reverse=True)
        if scored and scored[0][0] >= floor and (len(scored) < 2 or scored[1][0] < scored[0][0]):
            return [rows[scored[0][1]]]
    return []


def find_row(y, dfe, name_keys, name=None, district=None):
    head, rows, c = sheets[y]
    if 'dfe' in c:
        if dfe == 3263:   # Holy Trinity: before 2026 the reception intake was the infant school
            hit = [r for r in rows if has_keys(r[c['name']], ['holy trinity', 'infant'])] or \
                  [r for r in rows if r[c['dfe']] == 3263 and 'junior' not in r[c['name']].lower()]
        elif dfe == 2031:  # Masham changed number
            hit = [r for r in rows if has_keys(r[c['name']], ['masham']) and r[c['district']] == 'Harrogate']
        else:
            hit = [r for r in rows if r[c['dfe']] == dfe and 'junior' not in r[c['name']].lower()]
        if len(hit) > 1:   # two rows under one code (see reception_rows): the one with places
            hit = [r for r in hit if num(r[c['pan']]) is not None] or hit
        if not hit and dfe not in KEYS and name:   # a new number, e.g. on becoming an academy: the same name in the same district
            hit = by_name([r for r in rows if r[c['district']] == district], c, name)
    elif name_keys:
        hit = [r for r in rows if has_keys(r[c['name']], name_keys) and 'junior' not in r[c['name']].lower()]
    else:
        hit = by_name(rows, c, name)
    if len(hit) > 1:
        raise ValueError(f'{y} {dfe}: ambiguous {[h[c["name"]] for h in hit]}')
    return hit[0] if hit else None


schools = []
for r in base:
    dfe, name = r[0], r[c26['name']]
    name = re.sub(r'\s*\(formerly.*$', '', name).strip()   # "Leeming St. John's ... (formerly Aiskew, ...)"
    name = re.sub(r'\s+-\s+an? [^,]*', '', name)   # "St Mary's Catholic Primary School - a Catholic Voluntary Academy, Malton"
    s = {'dfe': dfe, 'name': name, 'district': r[c26['district']], 'place': PLACE.get(dfe) or place_of(POINT[dfe]['properties']), 'kind': r[c26['type']],
         'method': METHOD.get(str(r[c26['method']]).strip().lower(), 'unknown'),
         'pan': num(r[c26['pan']]), 'd': []}
    for y in (2026, 2025, 2024, 2023):
        keys = KEYS_2023.get(dfe, KEYS.get(dfe)) if y == 2023 else KEYS.get(dfe)
        row = find_row(y, dfe, keys, name, s['district'])
        if row is None:
            print(f'  no {y} row for {name}')
            continue
        head, rows, c = sheets[y]
        rec = {'y': y, **parse_cutoff(row[c['cut']])}
        rec['a'] = num(row[c['apps']])
        rec['o'] = num(row[c['off']])
        if 'first' in c:
            rec['f'] = num(row[c['first']])
        prev = find_row(y - 1, dfe, KEYS_2023.get(dfe, KEYS.get(dfe)) if y - 1 <= 2023 else KEYS.get(dfe), name, s['district'])
        if prev is not None:   # each sheet gives next year's admission number
            rec['p'] = num(prev[sheets[y - 1][2]['pan']])
        if dfe == 3263 and rec.get('p') is None:   # the 2025 sheet puts the new primary's number on its own row
            ph, prow, pc = sheets[y - 1]
            rec['p'] = next((num(x[pc['pan']]) for x in prow if has_keys(x[pc['name']], ['holy trinity', 'primary'])), None)
        if dfe == 3263 and y < 2026:
            rec['n'] = 'as Holy Trinity CE Infant School'
        if dfe in FORMERLY and y < 2026:
            rec['n'] = f'as {FORMERLY[dfe]}'
        if rec['s'] == 'distance' and rec['g'] not in ('sib', 'staff') and rec['m'] > 16 * MI:
            # e.g. 533.56 miles: the last place went to a family far away, so everyone local got in
            rec['n'] = f"Last place went to a child {rec['mi']:g} miles away, so everyone nearby who applied got in"
            rec = {k: v for k, v in rec.items() if k not in ('m', 'g', 'mi')} | {'s': 'all_offered'}
        rec.pop('mi', None)
        s['d'].append(rec)
    schools.append(s)

# ---------- council school points ----------
for s in schools:
    hit = [POINT[s['dfe']]] if s['dfe'] in POINT else \
          [f for f in pts if has_keys(f['properties']['School'], KEYS[s['dfe']]) and 'junior' not in f['properties']['School'].lower()]
    if s['dfe'] == 3372:
        hit = [f for f in hit if f['properties']['Postcode'].startswith('HG4')]
    if len(hit) == 1:
        lng, lat = hit[0]['geometry']['coordinates']
        s['ll'] = [round(lat, 6), round(lng, 6)]
        p = hit[0]['properties']
        s['postcode'] = p['Postcode']
        s['faith'] = p['Religious_character']
        lines = []
        for k in ('Address_1', 'Address_2', 'Address_3', 'Address_4'):
            for part in str(p.get(k) or '').split(','):
                part = part.strip()
                if part and part.lower().replace("'", '') not in [x.lower().replace("'", '') for x in lines] and part.lower() != 'north yorkshire' \
                        and not part.lower().endswith('school'):
                    lines.append(part.title() if part.isupper() else part)
        s['addr'] = ', '.join(lines + [p['Postcode']])
        web = str(p.get('School_website') or '').strip()
        if web:
            s['web'] = web if web.startswith('http') else 'https://' + web
        if s['dfe'] in WEB:
            s['web'] = WEB[s['dfe']]
            if not s['web']:
                del s['web']
    else:
        print(f'  point matches for {s["name"]}: {len(hit)}')

# ---------- Ofsted ----------
mi19 = read_mi(f'{RAW}/ofsted2019.csv')


for s in schools:
    x = mi.get(f"815{s['dfe']}")
    if s['dfe'] == 2031 and not x:
        x = mi.get('8153319')
    if not x:
        x = next((v for v in mi.values() if v['Local authority'] == 'North Yorkshire' and v['Ofsted phase'] == 'Primary'
                  and has_keys(v['School name'], KEYS.get(s['dfe']))), None)
    if not x:
        print(f'  no Ofsted row for {s["name"]}')
    s['of'] = ofsted(x, mi19)
    if x:
        s.setdefault('postcode', x['Postcode'])
        s.setdefault('faith', x['Designated religious character'])

# ---------- catchments ----------
feats = json.load(open(f'{RAW}/catch.geojson'))['features']
geoms = [shape(f['geometry']).buffer(0) for f in feats]
NEAR = 0.15   # degrees, about 10 miles: a school's catchment is never further away than that


def near(i, s):
    return 'll' in s and geoms[i].distance(Point(s['ll'][1], s['ll'][0])) < NEAR


# Schools without keys take the nearby catchment whose name is clearly theirs, or the one they sit in that shares
# a word of their name (names are cut off at 60 characters, and some catchments are shared by two schools)
AUTO_CATCH = {}
for s in schools:
    if s['dfe'] not in KEYS and 'll' in s:
        pt = Point(s['ll'][1], s['ll'][0])
        good = [(sim(f['properties']['School'], s['name']), i) for i, f in enumerate(feats) if near(i, s)]
        # a shared town name or 'St' doesn't make it theirs, unless the town is the only distinctive word in the name
        own = (tokens(s['name']) - {'st'} - tokens(s['place'])) or (tokens(s['name']) - {'st'})
        good = [t for t in good if t[0] >= 0.6 or (own & tokens(feats[t[1]]['properties']['School']) and geoms[t[1]].contains(pt))]
        if good:
            AUTO_CATCH[s['dfe']] = {max(good)[1]}
        # a catchment two schools share is named after both: "Roseberry Academy & Marwood CE VC Infant School"
        for i, f in enumerate(feats):
            cat = f['properties']['School']
            parts = cat.split(' & ')
            if len(parts) > 1 and near(i, s) and any(part_sim(part, n, cut=len(cat) >= 60 and j == len(parts) - 1, place=s['place']) >= 0.6
                                                     for j, part in enumerate(parts) for n in (s['name'], FORMERLY.get(s['dfe'], ''))):
                AUTO_CATCH.setdefault(s['dfe'], set()).add(i)

catch, used = [], {}
for i, f in enumerate(feats):
    owners = []
    for s in schools:
        if s['dfe'] in KEYS:
            keysets = CATCH_KEYS.get(s['dfe'], [KEYS[s['dfe']]])
            if any(has_keys(f['properties']['School'], ks) for ks in keysets) and near(i, s):
                owners.append(s)
        elif i in AUTO_CATCH.get(s['dfe'], ()):
            owners.append(s)
    if not owners:
        continue
    g = geoms[i].simplify(0.00006, preserve_topology=True)
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

for s in schools:
    s['type'] = kind(s['kind'], s.get('faith'))
    s['own'] = OWN_RULES(s['kind'])
    s['src'] = DATASETS[2026]
    for k in ('kind', 'faith'):
        s.pop(k, None)

import datetime
out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': u} for y, u in DATASETS.items()],
       'updated': datetime.date.today().isoformat()}   # the sitemap's last-updated date for the school and area pages
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} catchment areas, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
