#!/bin/sh
# Download City of York Council's raw sources into an empty folder, then build:
#   sh build/fetch_york.sh /path/to/york-raw
#   python3 -I build/build_york.py /path/to/york-raw /path/to/ny-raw/ofsted.csv build/york.json
# The Ofsted file is the national one build/fetch.sh downloads. Each spring, add the new year's applicant file
# (York Open Data publishes it after offer day) and drop the oldest.
set -eu
RAW=$1
mkdir -p "$RAW"
ODP=https://data.yorkopendata.org/dataset
get() { curl -fsSL -A "Mozilla/5.0" -o "$RAW/$1" "$2"; echo "  $1"; }

# Every Reception applicant, anonymised: their five choices, their catchment school and the school they got.
# The 2024 file is incomplete (110 applicants instead of about 1,600), so 2022 stands in for it.
PLOS=$ODP/ef0199a4-e878-45ca-8b3b-62ecb4c0862f/resource
get plos2026.csv "$PLOS/c7ee414c-9f0c-4cd7-90f4-a2d2a126bb95/download/plosprimary2026.csv"
get plos2025.csv "$PLOS/544412f3-f8e3-477b-8ca0-5253b127923d/download/plosprimary2025.csv"
get plos2023.csv "$PLOS/160aaf90-0a6e-4be4-bf0c-bc590e950b4f/download/plosprimary2023.csv"
get plos2022.csv "$PLOS/b9f5464f-35c2-4de7-8aba-d6789aa8059d/download/plosprimary2022.csv"

# Each school's places and official counts of places allocated and refused, used for admission numbers and as a check
SUM=$ODP/559265cc-ff33-432c-b5ab-6d7a6bb34302/resource
get sum2025.csv "$SUM/e4f4be9a-b11a-48c8-8b09-e45a1c092ce1/download/admissionssummaryallprimary2025.csv"
get sum2024.csv "$SUM/60210e68-a84d-4c03-93a7-de639294af70/download/admissionssummaryallprimary2024.csv"
get sum2023.csv "$SUM/0983adfa-5edd-4b13-abbd-32224b8f343b/download/admissionssummaryallprimary2023.csv"
get sum2022.csv "$SUM/4a80fb0c-fdc2-41e0-b3e6-da3514a5faee/download/admissionssummaryallprimary2022.csv"

# The council's school points and primary catchment areas, from its map server
MAP=https://maps.york.gov.uk/arcgis/rest/services/Public/EducationLearning/MapServer
for layer in 0:points 3:catch; do
  curl -fsS -G "$MAP/${layer%%:*}/query" --data-urlencode "where=1=1" --data-urlencode "outFields=*" \
    --data-urlencode "outSR=4326" --data-urlencode "geometryPrecision=6" --data-urlencode "f=geojson" -o "$RAW/${layer#*:}.geojson"
  echo "  ${layer#*:}.geojson"
done
