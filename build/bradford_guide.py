"""Read Bradford Council's primary admissions guides into build/bradford/allocations.json.

Usage:  python3 -I build/bradford_guide.py <raw-dir> build/bradford/allocations.json

<raw-dir> holds guide27.pdf ("Applying for a primary school: detailed guide for September 2027", with 2026's
allocations) and guide24.pdf (the September 2024 guide, with 2023's), from build/fetch_bradford.sh. The guides for
2025 and 2026 entry, with 2024's and 2025's figures, are no longer on the council's site. Needs pdftotext.

The "List of primary schools" gives, for each school: applications, applications considered, pupils allocated, then
the places by rule ("1 SEN allocation", "11 siblings allocated", "15 pupils allocated in priority area", "2 pupils
allocated by distance (furthest distance 2.628 miles)", "4 pupils allocated on faith grounds"). Each school's block
holds its postcode, which is how build_bradford.py matches it.
"""
import json, re, subprocess, sys

RAW, OUT = sys.argv[1], sys.argv[2]
GUIDES = {2026: 'guide27.pdf', 2023: 'guide24.pdf'}
POSTCODE = re.compile(r'\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s?([\dO])([A-Z]{2})\b')   # the guide types "BD20 OJJ" for BD20 0JJ
TYPE = r'(Community|VC|VA|Academy|Foundation|Free School|Free|Voluntary Aided|Voluntary Controlled)'


def read(pdf):
    text = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    start = text.find('List of primary schools in the Bradford')
    lines = text[start:].splitlines()
    blocks, cur = [], None
    for line in lines:
        # a school's block starts with its name, type, applications, roll and admission number on one line
        # (the type is followed by its nursery column, "Nursery" or "No", which tells it apart from "Academy" in a name)
        m = re.match(rf'^\s*(\S.*?)\s+{TYPE}\s+(?:Nursery|No|nursery)\b.*?(\d+)\s+applications\b(.*)$', line)
        if m:
            cur = {'name': m.group(1).strip(), 'apps': int(m.group(3)), 'head': m.group(4), 'text': ''}
            blocks.append(cur)
            continue
        if cur is not None:
            cur['text'] += ' ' + re.sub(r'\s+', ' ', line)
    out = []
    for b in blocks:
        t = b['text']
        num = lambda pat: (int(m.group(1)) if (m := re.search(pat, t)) else 0)
        pc = POSTCODE.search(t) or POSTCODE.search(b['name'])   # a wrapped name can leave the address on the name's line
        tail = re.findall(r'\d+', b['head'])
        far = re.findall(r'furthest distance ([\d.]+) miles', t)
        out.append({
            'name': b['name'], 'postcode': f'{pc.group(1)}{pc.group(2).replace("O", "0")}{pc.group(3)}' if pc else None, 'apps': b['apps'],
            'considered': num(r'(\d+)\s+(?:nursery)?applications considered'),
            'allocated': num(r'(\d+) (?:pupils )?allocated(?! (?:in|by|on|with))'),
            'distance': num(r'(\d+) (?:pupils )?allocated by distance'),
            'area': sum(int(x) for x in re.findall(r'(\d+) (?:pupils )?allocated in priority area', t)),   # 2023 has areas 1 and 2
            'faith': num(r'(\d+) (?:pupils )?allocated on faith grounds'),
            'siblings': num(r'(\d+) siblings allocated') + num(r'(\d+) (?:pupils )?allocated with siblings'),
            'furthest': float(far[-1]) if far else None,
            'pan': int(tail[1]) if len(tail) >= 2 else None,
        })
    for r in out:   # 2023 sometimes gives only the places by rule: their sum is the total
        if not r['allocated']:
            r['allocated'] = r['distance'] + r['area'] + r['faith'] + r['siblings']
    return out


data = {}
for y, f in GUIDES.items():
    rows = read(f'{RAW}/{f}')
    data[y] = rows
    print(f'{y}: {len(rows)} schools, {sum(1 for r in rows if r["postcode"])} with a postcode, '
          f'{sum(1 for r in rows if r["considered"] > r["allocated"])} oversubscribed, {sum(1 for r in rows if r["furthest"])} with a furthest distance')
json.dump(data, open(OUT, 'w'), indent=1)
