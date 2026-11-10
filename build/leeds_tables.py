"""Read Leeds City Council's "cut off distances" PDFs into build/leeds/cutoffs.json.

Usage:  python3 -I build/leeds_tables.py <raw-dir> build/leeds/cutoffs.json

<raw-dir> holds cut-YYYY.pdf, one a year (build/fetch_leeds.sh). Needs pdftotext (poppler).

Each PDF lists every primary school by DfE number with either "All applicants admitted" or the furthest distance
offered, in miles, the number of the last priority admitted and the school's own short description of it ("Any
Other Children", "In-Catchment", "Baptised Catholic children ..."). Long names and descriptions wrap over lines,
so each row runs from its DfE number down to the next, and each word goes to the column it sits under.
"""
import html, json, re, subprocess, sys

RAW, OUT = sys.argv[1], sys.argv[2]
YEARS = (2024, 2025, 2026)


def pages(pdf):
    out = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
    for page in out.split('<page ')[1:]:
        yield [(float(a), float(c), (float(b) + float(d)) / 2, html.unescape(t))
               for a, b, c, d, t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', page)]


def read(pdf):
    rows, cols = [], None
    for ws in pages(pdf):
        head = {w[3]: w for w in ws if w[3] in ('DfE', 'School', 'Reception', 'Last', 'Short')}
        if len(head) == 5:   # the header repeats on every page; its words give the columns' left edges
            # the header ends at its last line of header words, above the first school's number ("admitted" is left
            # out: a first row reading "All applicants admitted" sits just below the header)
            first = min((w[2] for w in ws if re.fullmatch(r'\d{4}', w[3]) and w[2] > head['DfE'][2] + 4 and w[1] < head['School'][0] + 2), default=1e9)
            vocab = {'Number', 'Furthest', 'Distance', 'miles', 'Admitted', 'criteria', 'Admissions', 'policy', 'Reception',
                     'Last', 'Criteria', 'Short', 'description', 'DfE'}   # words no school name has
            cols = {'name': head['School'][0] - 4, 'dist': head['Reception'][0] - 30, 'crit': head['Last'][0] - 8,
                    'desc': head['Short'][0] - 25,
                    'top': max(w[2] for w in ws if (w[3] in vocab or re.fullmatch(r'\d\d(/\d\d)+', w[3])) and w[2] < first - 4)}
        if not cols:
            continue
        body = [w for w in ws if w[2] > cols['top'] + 2]
        anchors = sorted((w for w in body if re.fullmatch(r'\d{4}', w[3]) and w[1] < cols['name'] + 2), key=lambda w: w[2])
        # a row can be printed above the page's header (Rawdon Littlemoor, 2026): read it on its own
        if len(head) == 5:
            dfe_y = head['DfE'][2]
            above = [w for w in ws if w[2] < dfe_y - 6]
            tops = sorted((w for w in above if re.fullmatch(r'\d{4}', w[3]) and w[1] < cols['name'] + 2), key=lambda w: w[2])
            if tops:
                body = above + body
                anchors = tops + anchors
        for i, a in enumerate(anchors):
            first_below = i == 0 or (len(head) == 5 and anchors[i - 1][2] < head['DfE'][2] - 6 <= a[2])
            lo = cols['top'] + 2 if first_below else a[2] - 9   # the first row under the header can start a line above its number
            if len(head) == 5 and a[2] < head['DfE'][2] - 6:
                lo = a[2] - 9
            hi = anchors[i + 1][2] - 9 if i + 1 < len(anchors) else 10_000
            if len(head) == 5 and a[2] < head['DfE'][2] - 6:
                hi = min(hi, head['DfE'][2] - 6)   # a row above the header ends where the header starts
            mine = sorted((w for w in body if lo <= w[2] < hi and w is not a), key=lambda w: (round(w[2]), w[0]))
            texts = [w[3] for w in mine]
            all_in = 'applicants' in texts
            if all_in:   # drop "All applicants admitted" from the other columns (a name can start with "All")
                for word in ('All', 'applicants', 'admitted'):
                    hit = [w for w in mine if w[3] == word and w[0] >= cols['name'] + 20 or (w[3] == word and word != 'All')]
                    if hit:
                        mine.remove(hit[0])
            name = ' '.join(w[3] for w in mine if w[0] < cols['dist'])
            dist = [w[3] for w in mine if cols['dist'] <= w[0] < cols['crit'] and re.fullmatch(r'\d*\.?\d+', w[3])]
            crit = [w[3] for w in mine if cols['crit'] <= w[0] < cols['desc'] and re.fullmatch(r'\d+[a-z]?', w[3])]
            desc = ' '.join(w[3] for w in mine if w[0] >= cols['desc'])
            rows.append({'code': int(a[3]), 'name': re.sub(r'\s+', ' ', name).strip(), 'all': all_in,
                         'dist': float(dist[0]) if dist and not all_in else None, 'crit': crit[0] if crit and not all_in else None,
                         'desc': re.sub(r'\s+', ' ', desc).strip() if not all_in else None})
    return rows


out = {}
for y in YEARS:
    rows = read(f'{RAW}/cut-{y}.pdf')
    for r in rows:
        if r['dist'] is not None and r['dist'] >= 20 and '.' not in str(r['dist']).rstrip('0').rstrip('.'):
            print(f'  {y} {r["name"]}: distance written as {r["dist"]:g}, read as {r["dist"] / 1000:g} miles')
            r['dist'] = r['dist'] / 1000   # "314" for 0.314 (All Saints' Richmond Hill, 2026)
    odd = [r['name'] for r in rows if not r['all'] and (r['dist'] is None or r['crit'] is None)]
    print(f'{y}: {len(rows)} schools, {sum(r["all"] for r in rows)} took everyone; rows without a distance or rule: {odd}')
    out[y] = rows
json.dump(out, open(OUT, 'w'), indent=1)
