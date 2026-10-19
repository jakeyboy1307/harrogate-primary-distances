"""Collect each school's office phone number and email address for the school panel.

Phone numbers come from Get Information about Schools (the DfE register), looked up by the URN in data.json.
GIAS doesn't publish email addresses, so emails are taken from mailto links on the school's own website
(the homepage, then its contact page), and the page each one was found on is kept as its source.

    python3 -I build/fetch_contacts.py build/data.json build/contacts.json

Re-run it alongside the yearly data refresh. Schools whose email can't be found are left without one.
"""
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import date

GIAS = 'https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/{}'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; YorkshireSchoolChecker/2.0; +https://jakeyboy1307.github.io/harrogate-primary-distances/)'}
MAILTO = re.compile(r'mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', re.I)
# words that mark the school office rather than a named member of staff
OFFICE = ('admin', 'office', 'enquir', 'admission', 'head', 'info', 'school', 'reception')
SKIP = ('example.', 'sentry', 'wixpress', 'webmaster', 'safeguard', 'dpo', 'governor', 'gdpr', 'data', 'pta', 'friends')


def get(url, timeout=20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.geturl(), r.read().decode('utf-8', 'ignore')


def gias_phone(urn):
    _, page = get(GIAS.format(urn))
    m = re.search(r'Telephone\s*</dt>\s*<dd[^>]*>(.*?)</dd>', page, re.S | re.I)
    if not m:
        return None
    tel = re.sub(r'\D', '', html.unescape(re.sub('<[^>]+>', '', m.group(1))))
    return tel if len(tel) >= 10 else None


def tidy_tel(t):
    """01423563760 -> 01423 563760"""
    return f'{t[:5]} {t[5:]}' if t and len(t) == 11 else t


def best_email(found, site_host):
    found = [e.lower() for e in found if not any(s in e.lower() for s in SKIP)]
    if not found:
        return None
    def score(e):
        local, _, dom = e.partition('@')
        return (any(w in local for w in OFFICE), site_host and site_host.split('.')[-2] in dom, -len(e))
    return max(dict.fromkeys(found), key=score)


def site_email(web):
    if not web:
        return None, None
    base, page = get(web)
    host = urllib.parse.urlparse(base).hostname or ''
    email = best_email(MAILTO.findall(html.unescape(page)), host)
    if email:
        return email, base
    # otherwise try the contact page linked from the homepage
    for href, text in re.findall(r'<a[^>]+href="([^"#]+)"[^>]*>(.*?)</a>', page, re.S | re.I):
        if 'contact' in href.lower() or 'contact' in re.sub('<[^>]+>', '', text).lower():
            url = urllib.parse.urljoin(base, html.unescape(href))
            try:
                curl, cpage = get(url)
            except Exception:
                continue
            email = best_email(MAILTO.findall(html.unescape(cpage)), host)
            if email:
                return email, curl
            break
    return None, None


def main(data_path, out_path):
    schools = json.load(open(data_path))['schools']
    out = {}
    for s in schools:
        rec = {'checked': date.today().isoformat()}
        urn = (s.get('of') or {}).get('urn')
        try:
            if urn:
                rec['tel'] = tidy_tel(gias_phone(urn))
        except Exception as e:
            print(f"  phone failed for {s['name']}: {e}", file=sys.stderr)
        try:
            email, src = site_email(s.get('web'))
            if email:
                rec['email'], rec['emailSrc'] = email, src
        except Exception as e:
            print(f"  website failed for {s['name']}: {e}", file=sys.stderr)
        out[str(s['dfe'])] = {k: v for k, v in rec.items() if v}
        print(f"{s['name'][:45]:45}  {rec.get('tel') or '-':13}  {rec.get('email') or '-'}")
        time.sleep(0.5)   # be gentle with GIAS and the schools' sites
    json.dump(out, open(out_path, 'w'), indent=1, sort_keys=True)
    have_tel = sum('tel' in v for v in out.values())
    have_mail = sum('email' in v for v in out.values())
    print(f'\n{have_tel} of {len(out)} phone numbers, {have_mail} of {len(out)} emails -> {out_path}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
