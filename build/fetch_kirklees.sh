#!/bin/sh
# Download Kirklees's raw sources into an empty folder, then build:
#   sh build/fetch_kirklees.sh /path/to/kirk-raw
#   python3 -I build/kirklees_tables.py /path/to/kirk-raw build/kirklees/allocations.json
#   python3 -I build/build_kirklees.py /path/to/kirk-raw /path/to/ny-raw build/kirklees.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder.
# Each spring, add the new year's allocations PDF below and to YEARS in kirklees_tables.py and build_kirklees.py.
set -eu
RAW=$1
mkdir -p "$RAW"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# Who got in: "Reception Allocations ... as at National Offer Day", one PDF a year
for y in 23 24 25 26; do
  curl -fsSL -A "$UA" -o "$RAW/kirk-20$y.pdf" "https://www.kirklees.gov.uk/beta/admissions/pdf/reception-by-preference-and-criteria-$y.pdf"; echo "  kirk-20$y.pdf"
done

# The primary priority admission areas, and the schools without one, from the council's public map ("Find a school
# and your priority admission area"). One query each; the shapes come in British National Grid.
MAP='https://mapping.kirklees.gov.uk/connect/analyst/controller/connectProxy/rest/Spatial/FeatureService'
PROJECT='/Analyst/NamedProjects/Priority%20Admission%20Areas%20(Public)'
q() { python3 -c "import urllib.parse as u, sys; print(u.quote('/tables/features.json?q=' + sys.argv[1], safe=''))" "$1"; }
curl -fsS -A "$UA" -o "$RAW/paa.json" "$MAP?url=$(q 'SELECT DFE, School_Name, Obj FROM "/kirklees/Schools/PrimaryPAA"')&projectName=$PROJECT"; echo "  paa.json"
curl -fsS -A "$UA" -o "$RAW/paa-attrs.json" "$MAP?url=$(q 'SELECT DFE, School_Name, High_School, Infant, InfDfES, Junior, JunDfES FROM "/kirklees/Schools/PrimaryPAA"')&projectName=$PROJECT"; echo "  paa-attrs.json"
curl -fsS -A "$UA" -o "$RAW/nopaa.json" "$MAP?url=$(q 'SELECT Dfes_code, School_name, Category FROM "/kirklees/Schools/SchoolsWithoutPAA_1"')&projectName=$PROJECT"; echo "  nopaa.json"
