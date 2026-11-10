"""Read the "School details" pages of Hull City Council's guide to primary admissions: each school's published
admission number for next year, last year's first, second and third preferences, and how last year's places were
allocated (SEN, children in care, catchment, siblings, distance, other). The guide gives no cut-off distances.

    python3 -I build/hull_guide.py <guide.pdf> build/hull/allocations.json
"""
import json, re, subprocess, sys

PDF, OUT = sys.argv[1], sys.argv[2]
text = subprocess.run(['pdftotext', '-raw', PDF, '-'], capture_output=True, text=True).stdout
start = text.index('How places were\nallocated in')
year = int(re.search(r'allocated in (\d{4})', text[start:]).group(1))
lines = [l.strip() for l in text[start:].splitlines()]
SKIP = re.compile(r'^(School [Dd]etails|Published|Admission|Number|\d{4}-\d{4}|Numberof|Number of|1st$|, 2nd|, & 3rd|& 3rd|preferencesin|preferences in|'
                  r'How places were|allocated in.*|\d+ \| P a g e|)$')
LABEL = re.compile(r'^(SEN|CLA|Catchment|Sibling|Distance|Other)\s+(\d+)$')
PREF = re.compile(r'^(1st|2nd|3rd)\s*(\d+)?$')
schools, cur, pref, stage = [], None, None, 'name'
for l in lines:
    if l.startswith('Making an in-year application') or l.startswith('In-year'):
        break
    m = LABEL.match(l)
    if m:
        cur[m.group(1).lower()] = int(m.group(2)); stage = 'after'; continue
    m = PREF.match(l)
    if m and cur is not None and stage == 'web':   # only after the school's phone line: page headers say "1st" too
        pref = m.group(1)
        if m.group(2):
            cur[pref] = int(m.group(2)); pref = None
        continue
    if re.fullmatch(r'\d+', l) and cur is not None:
        if pref:
            cur[pref] = int(l); pref = None
        elif 'pan' not in cur:
            cur['pan'] = int(l)
        continue
    if SKIP.match(l) and stage != 'name' or m:
        continue
    if stage in ('after', 'name') and not l.startswith('Tel:') and not re.match(r'^HU\d', l) and l not in ('uk', 'Hull') and not SKIP.match(l):
        if stage == 'after' or cur is None:
            cur = {'name': l, 'lines': []}; schools.append(cur); stage = 'addr'; continue
    if cur is not None:
        cur['lines'].append(l)
        m = re.search(r'HU\d{1,2}\s?\d[A-Z]{0,2}', l)
        if m and 'postcode' not in cur:
            cur['postcode'] = m.group(0)
        if l.startswith('Tel:'):
            stage = 'web'
out = []
for s in schools:
    if 'distance' not in s:
        continue
    out.append({k: s.get(k) for k in ('name', 'postcode', 'pan', '1st', '2nd', '3rd', 'sen', 'cla', 'catchment', 'sibling', 'distance', 'other')})
json.dump({'year': year, 'schools': out}, open(OUT, 'w'), indent=1)
print(f'{len(out)} schools, {year}')
