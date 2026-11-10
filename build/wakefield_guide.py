"""Read the "School details" tables of Wakefield Council's Primary Guide for Parents into build/wakefield/allocations.json.

Usage:  python3 -I build/wakefield_guide.py <raw-dir>/guide.docx build/wakefield/allocations.json

The guide (from build/fetch_wakefield.sh) is a Word file; macOS's textutil turns it into text. For each school it gives
its postcode, next year's published admission number, last year's on-time applications and how last year's places
were offered. Schools on the council's rules (and those marked *, on their own rules but in the council's
categories) list places by category: EHCP, Looked After, Catchment/Sibling, Catchment, Non-Catchment/Sibling,
Non-Catchment and Placed (children none of whose choices had room). Others list them by their own rules' letters,
which aren't kept. The guide gives no distances.
"""
import json, re, subprocess, sys

DOC, OUT = sys.argv[1], sys.argv[2]
text = subprocess.run(['textutil', '-convert', 'txt', '-stdout', DOC], capture_output=True, text=True, check=True).stdout
lines = [l.strip() for l in text.splitlines()]
year = int(re.search(r'Children admitted in September (\d{4})', text).group(1))
POSTCODE = re.compile(r'\b(WF|LS|S|HD|DN)\d{1,2}[A-Z]? ?\d[A-Z]{2}\b')
CAT = re.compile(r'^(.+?) [-–] (\d+)\s*$')   # one line has an en dash
KEYS = {'EHCP': 'ehcp', 'Looked After': 'cla', 'Catchment/Sibling': 'catch_sib', 'Catchment': 'catch',
        'Non-Catchment/Sibling': 'sib', 'Non-Catchment': 'other', 'Placed': 'placed'}

schools = []
for i, l in enumerate(lines):
    m = re.match(r'^(?:TOTAL|Total) - (\d+)(\*)?', l)
    if not m:
        continue
    back = lines[max(0, i - 20):i]
    tel = max(j for j, x in enumerate(back) if x.startswith('Tel:'))
    pcs = [j for j, x in enumerate(back[:tel]) if POSTCODE.search(x)]
    nums = [int(x) for x in back[tel:] if re.fullmatch(r'\d+', x)]
    # the name is the line before the address: the first line of the block after the previous one's roll and blanks
    start = pcs[-1]
    while start > 0 and back[start - 1] and not re.fullmatch(r'[\d-]*|.*Number of Children|in the School', back[start - 1]):
        start -= 1
    r = {'name': back[start], 'postcode': POSTCODE.search(back[pcs[-1]]).group(0).replace(' ', ''),
         'web': next((x for x in back[pcs[-1] + 1:tel] if '.' in x and ' ' not in x), None),   # names two schools the guide leaves unnamed
         'pan': nums[0] if nums else None, 'apps': nums[1] if len(nums) > 1 else None,
         'total': int(m.group(1)), 'own': bool(m.group(2))}
    cats = {}
    for x in lines[i + 1:i + 12]:
        c = CAT.match(x)
        if not c:
            break
        cats[c.group(1)] = int(c.group(2))
    if all(k in KEYS for k in cats):
        r.update({KEYS[k]: v for k, v in cats.items()})
    else:
        r['letters'] = True   # the school's own rules, by letter
    schools.append(r)

json.dump({'year': year, 'schools': schools}, open(OUT, 'w'), indent=1)
print(f'{year}: {len(schools)} schools, {sum(1 for s in schools if "letters" in s)} on their own rules by letter, '
      f'{sum(1 for s in schools if s["pan"] is None)} without an admission number')
