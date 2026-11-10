#!/bin/sh
# Download Leeds's raw sources into an empty folder, then build:
#   sh build/fetch_leeds.sh /path/to/leeds-raw
#   python3 -I build/leeds_tables.py /path/to/leeds-raw build/leeds/cutoffs.json
#   python3 -I build/leeds_maps.py /path/to/leeds-raw build/leeds/catchments.geojson    (needs PyMuPDF: pip install pymupdf)
#   python3 -I build/build_leeds.py /path/to/leeds-raw /path/to/ny-raw build/leeds.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder.
# Each spring, add the new year's cut-off PDF and Data Mill North file below, and the year to YEARS in
# leeds_tables.py and build_leeds.py. Each autumn, the new catchment maps (the council publishes them in parts).
set -eu
RAW=$1
mkdir -p "$RAW"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# Who got in: the council's cut-off distances, one PDF a year (2023 wasn't published as a PDF)
L=https://www.leeds.gov.uk
curl -fsSL -A "$UA" -o "$RAW/cut-2024.pdf" "$L/docs/2024%20Primary%20and%20Junior%20School%20cut%20off%20distances.pdf"; echo "  cut-2024.pdf"
curl -fsSL -A "$UA" -o "$RAW/cut-2025.pdf" "$L/sites/default/files/2025-04/primary%20school%20cut%20off%20distances.pdf"; echo "  cut-2025.pdf"
curl -fsSL -A "$UA" -o "$RAW/cut-2026.pdf" "$L/sites/default/files/2026-04/cut%20off%20distances%20and%20criteria%20for%20primary%20and%20junior%20schools%202026.pdf"; echo "  cut-2026.pdf"

# Data Mill North's "Primary school allocations": places, counts by priority and 2023's figures
D=https://datamillnorth.org/download/e6qpz
curl -fsSL -o "$RAW/leeds-2023.csv" "$D/674730ea-1f15-4d84-a00e-bf7eecc3897b/2023%20Datamill%20Data%20Primary.csv"; echo "  leeds-2023.csv"
curl -fsSL -o "$RAW/leeds-2024.csv" "$D/ysj/2024%20Datamill%20Primary.csv"; echo "  leeds-2024.csv"
curl -fsSL -o "$RAW/leeds-2025.csv" "$D/hkv/2025-04-10%20Datamill%20Data%20Primary.csv"; echo "  leeds-2025.csv"
curl -fsSL -o "$RAW/leeds-2026.csv" "$D/3el/2026%20Datamill%20Primary%20allocations.csv"; echo "  leeds-2026.csv"

# The catchment maps (GeoPDFs, one school a page), for 2026 admissions; the 2027 set replaces these when published
curl -fsSL -A "$UA" -o "$RAW/maps-1.pdf" "$L/sites/default/files/2025-03/2026%20primary%20school%20catchment%20maps%20%28part1reducedsize%29.pdf"; echo "  maps-1.pdf"
curl -fsSL -A "$UA" -o "$RAW/maps-2.pdf" "$L/sites/default/files/2025-03/2026%20primary%20school%20catchment%20maps%20%28part2%20reducedsize%29.pdf"; echo "  maps-2.pdf"
