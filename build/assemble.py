"""Put the built data into the page:  python3 -I build/assemble.py build/data.json"""
import json, pathlib, sys

root = pathlib.Path(__file__).resolve().parent
data = json.load(open(sys.argv[1]))
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
page = (root / 'template.html').read_text()
assert page.count('/*__DATA__*/null') == 1
(root.parent / 'index.html').write_text(page.replace('/*__DATA__*/null', blob))
print(f'index.html: {len(data["schools"])} schools, {(root.parent / "index.html").stat().st_size // 1024} KB')
