#!/bin/sh
# Download Sheffield's raw sources into an empty folder, then build:
#   sh build/fetch_sheffield.sh /path/to/sheffield-raw
#   python3 -I build/sheffield_tables.py /path/to/sheffield-raw build/sheffield/allocations.json
#   python3 -I build/build_sheffield.py /path/to/sheffield-raw /path/to/ny-raw build/sheffield.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder.
# Each spring, add the new year's oversubscribed schools PDF below and the year to YEARS in sheffield_tables.py and
# build_sheffield.py. Each autumn, check the catchment layer's name for the new school year.
set -eu
RAW=$1
mkdir -p "$RAW"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# Who got in: "Entrance into Reception: oversubscribed schools", one PDF a year (places by rule, the last child's distance)
for y in 2024 2025 2026; do
  curl -fsSL -A "$UA" -o "$RAW/over-$y.pdf" "https://www.sheffield.gov.uk/sites/default/files/$y-04/oversubscribed_infant_and_primary_schools_$y.pdf"; echo "  over-$y.pdf"
done

# The primary catchment areas, from the council's open data (the layer is named for its school year, 2025 - 2026)
curl -fsSL -o "$RAW/catchments.geojson" "https://sheffieldcitycouncil.cloud.esriuk.com/server/rest/services/AGOL/OpenData/FeatureServer/1/query?where=1%3D1&outFields=*&outSR=4326&f=geojson"; echo "  catchments.geojson"
