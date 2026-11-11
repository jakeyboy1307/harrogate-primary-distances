"""Check every school's website link: that it opens, and that the page it lands on names the school, so a lapsed
domain someone else has bought (Burneston's became a cashback site) is caught too.

    python3 build/check_websites.py            # prints only the links that need a look

Sites behind Cloudflare's bot check answer 403 here but open fine in a browser; open those by hand before
changing them. Fixes go in WEB in build_data.py (North Yorkshire), build_york.py (York) or build_eastriding.py.
"""
import json, re, subprocess
from concurrent.futures import ThreadPoolExecutor

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
COMMON = {'school', 'primary', 'church', 'england', 'voluntary', 'controlled', 'aided', 'community', 'academy', 'catholic',
          'infant', 'junior', 'the', 'and', 'of', 'a', 'cofe', 'ce', 'st', 'saint', 'trust', 'federation', 'nursery'}


def words(name):
    return {w for w in re.findall(r'[a-z]+', name.lower().replace("'", '')) if w not in COMMON and len(w) > 2}


def check(s):
    w = s.get('web')
    if not w:
        return s, 'no website', ''
    r = subprocess.run(['curl', '-s', '-L', '-m', '25', '-A', UA, '-w', '\n%{http_code} %{url_effective}', w], capture_output=True, text=True, errors='ignore')
    page, _, tail = r.stdout.rpartition('\n')
    code, _, final = tail.partition(' ')
    if code != '200':
        return s, f'HTTP {code}', final
    text = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', page)).lower().replace("'", '').replace('’', '')
    if not any(x in text or x in final.lower() for x in words(s['name']) | words(s.get('place', ''))):
        return s, 'page doesn’t name the school', final
    return s, 'ok', final


schools = [s for f in ('build/data.json', 'build/york.json', 'build/east-riding.json', 'build/hull.json', 'build/middlesbrough.json', 'build/redcar.json', 'build/calderdale.json', 'build/kirklees.json', 'build/leeds.json', 'build/bradford.json', 'build/wakefield.json', 'build/sheffield.json', 'build/barnsley.json', 'build/doncaster.json', 'build/rotherham.json') for s in json.load(open(f))['schools']]
with ThreadPoolExecutor(12) as ex:
    res = list(ex.map(check, schools))
bad = [r for r in res if r[1] != 'ok']
for s, why, final in bad:
    print(f"{s['name'][:50]:50} {why:28} {s.get('web') or ''} -> {final}")
print(f'{len(res)} checked, {len(bad)} to look at')
