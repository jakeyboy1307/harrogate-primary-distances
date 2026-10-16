#!/bin/sh
# Download the raw sources into an empty folder, then build:
#   sh build/fetch.sh /path/to/raw
#   python3 -I build/build_data.py /path/to/raw build/data.json
#   python3 -I build/assemble.py build/data.json
# Each autumn, add the new year's admissions sheet below (Data North Yorkshire publishes it in late summer)
# and swap in the latest Ofsted "latest inspections" CSV.
set -eu
RAW=$1
mkdir -p "$RAW"
HUB=https://hub.datanorthyorkshire.org/dataset
get() { curl -fsSL -A "Mozilla/5.0" -o "$RAW/$1" "$2"; echo "  $1"; }

get p2026.xlsx "$HUB/c363ba21-6e17-4862-8a3b-ab1329852622/resource/ec69b3ef-c4ec-4552-8839-8d14632a9e61/download/2026-27-primary-statistics-school-admissions.xlsx"
get p2025.xlsx "$HUB/8e128b63-0967-43bb-929d-a4058e30f1e3/resource/94bf88ea-6c2f-4b69-80a5-09e990b2429b/download/2025-26-primary-statistics-school-admissions.xlsx"
get p2024.xlsx "$HUB/aebd87cc-a828-4196-b584-f43d66fbb045/resource/b8db89a3-99f1-42d7-b1a9-ad14b3326feb/download/2024-25-all-primary-stats-data.xlsx"
get p2023.xlsx "$HUB/b7d3bf98-aecc-4445-aa04-0a4648da06f9/resource/8c686bad-eec6-40a3-8d16-4ac1fb89f75c/download/2023-24-all-primary-stats-complete.xlsx"
get p2022.xlsx "$HUB/3f9f20ee-4246-4fd5-8d98-7876a492ec46/resource/d64aa6f1-40e6-44c7-b189-0f07ed4958b3/download/2022-23-all-primary-data-completed-30.08.2022.xlsx"

# Council catchment areas and school points, from the layers behind its "Finding a school" map
ARC=https://utility.arcgis.com/usrsvcs/servers
REF="Referer: https://experience.arcgis.com/"
ENV='{"xmin":-2.2,"ymin":53.8,"xmax":-1.05,"ymax":54.35,"spatialReference":{"wkid":4326}}'
curl -fsS -H "$REF" -G "$ARC/9e566a3f72394ae383d424b80f254861/rest/services/CYPS/Primary_School_Catchment_Areas/FeatureServer/4/query" \
  --data-urlencode "where=1=1" --data-urlencode "outFields=*" --data-urlencode "geometry=$ENV" \
  --data-urlencode "geometryType=esriGeometryEnvelope" --data-urlencode "inSR=4326" --data-urlencode "outSR=4326" \
  --data-urlencode "geometryPrecision=6" --data-urlencode "f=geojson" -o "$RAW/catch.geojson"; echo "  catch.geojson"
curl -fsS -H "$REF" -G "$ARC/8d0777ada12b49a4b3591d03ebd03ffd/rest/services/CYPS/Primary_Schools/FeatureServer/2/query" \
  --data-urlencode "where=1=1" --data-urlencode "outFields=*" --data-urlencode "outSR=4326" --data-urlencode "f=geojson" \
  -o "$RAW/pschools.geojson"; echo "  pschools.geojson"

# Ofsted management information: state-funded schools, latest inspections (monthly)
get ofsted.csv "https://assets.publishing.service.gov.uk/media/6ad095a72de3184ccf8b818d/Management_information_-_state-funded_schools_-_latest_inspections_as_at_30_Sep_2026.csv"
