"""Collect each school's office phone number and email address for the school panel.

Phone numbers come from Get Information about Schools (the DfE register), looked up by the URN in data.json.
GIAS doesn't publish email addresses, so emails are taken from mailto links on the school's own website
(the homepage, then its contact page), and the page each one was found on is kept as its source.

    python3 -I build/fetch_contacts.py build/data.json build/contacts.json          # only schools not in the file yet
    python3 -I build/fetch_contacts.py build/data.json build/contacts.json --all    # every school again

Re-run it with --all alongside the yearly data refresh, and without it when schools are added. Schools whose email
can't be found are left without one.
"""
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date

GIAS = 'https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/{}'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; YorkshireSchoolChecker/2.0; +https://yorkshireschoolchecker.co.uk/)'}
MAILTO = re.compile(r'mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', re.I)
# words that mark the school office rather than a named member of staff
OFFICE = ('admin', 'office', 'enquir', 'admission', 'head', 'info', 'school', 'reception')
# helpdesk, webanywhere and nyes.digital (cirrus@) are web hosts; carltonprimary@setschools is a sister school, listed on Selby Community Primary's site;
# jcollins@stocktonprimary is a named member of staff, not the office
SKIP = ('example.', 'helpdesk', 'webanywhere', 'nyes.digital', 'carltonprimary@setschools', 'jcollins@stocktonprimary', 'sentry', 'wixpress', 'webmaster', 'safeguard', 'dpo', 'governor', 'gdpr', 'data', 'pta', 'friends')


# Emails set by hand, by URN (council codes repeat between councils), where a school's own site can't give the right one: North Rigton and All Saints,
# Kirkby Overblow share one site, which lists both offices, as do North and South Cowton and Melsonby, and the Ribblesdale schools; Barton's site
# also lists its trust's office, which isn't the school's
FIXED = {'142851': ('admin@northrigton.ycway.uk', 'https://asnrfellowship.ycst.co.uk/contact/'),
         '142138': ('admin@allsaints.ycway.uk', 'https://asnrfellowship.ycst.co.uk/contact/'),
         '121309': ('admin@northsouthcowton.n-yorks.sch.uk', 'https://www.fednscmms.co.uk/'),
         '121543': ('admin@melsonby.n-yorks.sch.uk', 'https://www.fednscmms.co.uk/'),
         '144155': ('admin@barton.dalesmat.org', 'https://www.barton.dalesmat.org/contact-us/'),
         # the Ribblesdale Federation's site lists all three offices
         '121392': ('office@giggleswick-pri.n-yorks.sch.uk', 'https://ribblesdalefed.n-yorks.sch.uk/contact-us/'),
         '121402': ('office@hellifield.n-yorks.sch.uk', 'https://ribblesdalefed.n-yorks.sch.uk/contact-us/'),
         '121631': ('office@longpreston.n-yorks.sch.uk', 'https://ribblesdalefed.n-yorks.sch.uk/contact-us/'),
         # Calderdale: Central Street's site also lists the council's web team, and Todmorden's an old address; St Joseph's,
         # Todmorden had no website in the register
         '107507': ('admin@centralstreet.calderdale.sch.uk', 'https://www.centralstreet.org.uk/'),
         '107556': ('office@todmorden-jun.calderdale.sch.uk', 'https://www.todmordenprimary.org.uk/our-school/contact-us'),
         '147583': ('admin@stjosephs.romerocat.com', 'https://www.st-josephs-tod.org.uk/contact-us')}
# Emails the school's site gives that aren't its office, by URN, left out: a named teacher (Molescroft), the SENCo
# (Swinefleet), a typo (North Frodingham), and a federation partner's (Hornsea Burton has Skipsea's, Sutton upon
# Derwent has Bugthorpe's); five Hull schools whose shared website template shows Bricknell's; and on Teesside a
# web designer's address, a trust's central inbox, a named teacher's and a football club charity's (Wilton)
# Kirklees: five Enhance Academy Trust schools give only the trust's inbox; All Hallows a named member of staff;
# Norristhorpe its SENCo
NO_EMAIL = {'117861', '117889', '117942', '118026', '133519', '140229', '144305', '145611', '145612', '144673', '138559', '138560', '139931', '145664', '145665', '140319', '146067', '107727', '150152', '138584', '140392', '147623', '107685', '138979'}


def get(url, timeout=20, hops=3):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.geturl(), r.read().decode('utf-8', 'ignore')
    except urllib.error.HTTPError as e:   # older Pythons don't follow 308s
        if e.code in (307, 308) and e.headers.get('Location') and hops:
            return get(urllib.parse.urljoin(url, e.headers['Location']), timeout, hops - 1)
        raise
    except urllib.error.URLError as e:   # council records list some sites as www. when only the bare address works
        host = urllib.parse.urlparse(url).hostname or ''
        if host.startswith('www.') and hops:
            return get(url.replace('://www.', '://', 1), timeout, hops - 1)
        raise


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


def main(data_path, out_path, everything=False):
    schools = json.load(open(data_path))['schools']
    try:
        old = {} if everything else json.load(open(out_path))
    except FileNotFoundError:
        old = {}
    out = {k: v for k, v in old.items() if k in {str(s['dfe']) for s in schools}}
    for s in schools:
        if str(s['dfe']) in out:
            continue
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
        u = str(s.get('urn') or (s.get('of') or {}).get('urn'))
        if u in FIXED:
            rec['email'], rec['emailSrc'] = FIXED[u]
        if u in NO_EMAIL:
            rec.pop('email', None); rec.pop('emailSrc', None)
        out[str(s['dfe'])] = {k: v for k, v in rec.items() if v}
        print(f"{s['name'][:45]:45}  {rec.get('tel') or '-':13}  {rec.get('email') or '-'}")
        time.sleep(0.5)   # be gentle with GIAS and the schools' sites
    json.dump(out, open(out_path, 'w'), indent=1, sort_keys=True)
    have_tel = sum('tel' in v for v in out.values())
    have_mail = sum('email' in v for v in out.values())
    print(f'\n{have_tel} of {len(out)} phone numbers, {have_mail} of {len(out)} emails -> {out_path}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], '--all' in sys.argv[3:])
