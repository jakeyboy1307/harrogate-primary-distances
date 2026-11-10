"""Read Kirklees Council's "Reception Allocations ... as at National Offer Day" PDFs into build/kirklees/allocations.json.

Usage:  python3 -I build/kirklees_tables.py <raw-dir> build/kirklees/allocations.json

<raw-dir> holds kirk-YYYY.pdf, one a year (build/fetch_kirklees.sh). Needs pdftotext (poppler).

Each PDF has two tables:
- Table 1, community and voluntary controlled schools: places, then places given by rule (EHCP, children in care,
  catchment with a brother or sister, catchment, out of area with a brother or sister, out of area), places the
  council allocated, total, whether anyone was refused ("oversubscribed") and the distance of the last on-time
  place, in metres;
- Table 2, schools that set their own rules: places, then counts under each school's own numbered criteria (which
  mean different things at each school, so they aren't kept), total, oversubscribed and the last distance.

Blank cells are common, so the columns are found by position: each number goes to the header it sits under.
"""
import html, json, re, subprocess, sys
from collections import defaultdict

RAW, OUT = sys.argv[1], sys.argv[2]
YEARS = (2023, 2024, 2025, 2026)
NUM = re.compile(r'^\d+(\.\d+)?\**$')   # "31*": one over the admission number, for twins


def words(pdf):
    """Every page's words, as (x0, x1, y_mid, text)."""
    out = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
    pages = []
    for page in out.split('<page ')[1:]:
        ws = [(float(a), float(c), (float(b) + float(d)) / 2, html.unescape(t))
              for a, b, c, d, t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', page)]
        pages.append(ws)
    return pages


def lines(ws, tol=3.0):
    """Words grouped into lines by height on the page, top to bottom, each line left to right."""
    rows = []
    for w in sorted(ws, key=lambda w: w[2]):
        if rows and abs(rows[-1][0] - w[2]) <= tol:
            rows[-1][1].append(w)
        else:
            rows.append([w[2], [w]])
    return [(y, sorted(r, key=lambda w: w[0])) for y, r in rows]


def columns(header):
    """The columns' centres from a table's header words. Table 1's are named; Table 2 keeps only the ones we use."""
    cx = lambda w: (w[0] + w[1]) / 2
    find = lambda pred: sorted([w for w in header if pred(w[3])], key=lambda w: w[0])
    col = {'pan': cx(find(lambda t: t in ('PAN', 'Published'))[0]), 'total': cx(find(lambda t: t == 'Total')[0]),
           'over': cx(find(lambda t: t.startswith('Oversubscribed'))[0]), 'dist': cx(find(lambda t: t == 'Distance')[0])}
    if any(w[3] == 'EHCP' for w in header):
        catch, out = find(lambda t: t == 'Catchment'), find(lambda t: t.startswith('Out'))
        out = [w for i, w in enumerate(out) if not i or w[0] - out[i - 1][0] > 20]   # "Out Of Area" is three words
        col.update(ehcp=cx(find(lambda t: t == 'EHCP')[0]), lac=cx(find(lambda t: t.startswith('LAC'))[0]),
                   cs=cx(catch[0]), c=cx(catch[1]), os=cx(out[0]), o=cx(out[1]),
                   la=cx(find(lambda t: t == 'LA')[0]))
        return 1, col
    la = find(lambda t: t == 'LA')
    if la:
        col['la'] = cx(la[0])
    crit = [w for w in header if re.fullmatch(r'\d+[a-z]?', w[3]) and col['pan'] < cx(w) < col.get('la', col['total'])]
    for w in crit:
        col['k' + w[3]] = cx(w)   # a school's own criteria: positions only, so their counts don't land elsewhere
    return 2, col


def read(pdf, year):
    rows, table, col = [], None, None
    for ws in words(pdf):
        ls = lines(ws)
        for i, (y, l) in enumerate(ls):
            texts = [w[3] for w in l]
            head = [w for yy, ll in ls if y - 40 <= yy <= y + 45 for w in ll]
            if texts[0] != '•' and any(t.startswith('Oversubscribed') for t in texts) \
                    and {'Total'} <= {w[3] for w in head} and {'PAN', 'Published'} & {w[3] for w in head}:   # a header
                table, col = columns(head)
                head_end = y + 45
                continue
            if not col or y <= head_end:
                continue
            over = [w for w in l if w[3] in ('Yes', 'No') and abs((w[0] + w[1]) / 2 - col['over']) < 45]
            if not over:
                continue
            nums = [w for w in l if NUM.match(w[3]) and w[0] > col['pan'] - 30]
            rec = {'table': table, 'over': over[0][3] == 'Yes', 'y': y, 'name': [w for w in l if w[1] < col['pan'] - 12]}
            for w in nums:
                c = (w[0] + w[1]) / 2
                key = min((k for k in col if k != 'over'), key=lambda k: abs(col[k] - c))
                if key == 'dist' or (w[0] > over[0][1]):
                    rec['dist'] = float(w[3].rstrip('*'))
                elif not key.startswith('k'):
                    rec[key] = int(float(w[3].rstrip('*')))
            rows.append(rec)
        # name lines with no figures (a long name wraps above and below its figures) go to the nearest row
        for y, l in ls:
            if not col or any(w[3] in ('Yes', 'No') or w[3].startswith('Oversubscribed') for w in l):
                continue
            if l[0][3] in ('•', 'Table') or any(w[1] > col['pan'] - 12 for w in l):
                continue
            near = [r for r in rows if r.get('page') is None and abs(r['y'] - y) < 14]
            if near:
                min(near, key=lambda r: abs(r['y'] - y))['name'] += l
        for r in rows:
            r.setdefault('page', True)
    out = []
    for r in rows:
        name = ' '.join(w[3] for w in sorted(r['name'], key=lambda w: (round(w[2]), w[0])))
        code = re.match(r'^(\d{7})\s+', name)
        if code:   # 2023 starts each row with the DfE number
            r['code'], name = int(code.group(1)[3:]), name[code.end():]
        r['name'] = re.sub(r'\s+', ' ', name).strip()
        for k in ('y', 'page'):
            r.pop(k, None)
        out.append(r)
    return out


tables = {y: read(f'{RAW}/kirk-{y}.pdf', y) for y in YEARS}
for y, rs in tables.items():
    one = [r for r in rs if r['table'] == 1]
    bad = [r['name'] for r in one if r.get('total') is None or r.get('pan') is None
           or sum(r.get(k, 0) for k in ('ehcp', 'lac', 'cs', 'c', 'os', 'o', 'la')) != r['total']]
    print(f'{y}: {len(one)} in table 1, {len(rs) - len(one)} in table 2; rows whose counts don\'t add up: {bad}')
json.dump(tables, open(OUT, 'w'), indent=1)
