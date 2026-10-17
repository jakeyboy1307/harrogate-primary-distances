# Yorkshire school checker

A one-page map tool for parents choosing a Reception place in the Harrogate district. Enter a postcode and every primary school nearby is shown with your walking or straight-line distance, whether you're in its catchment, and how far the last place went on national offer day in 2023, 2024, 2025 and 2026. Modelled on [SW London primary school distances](https://peterstuart3-arch.github.io/sw-primary-distances/), reworked for North Yorkshire's catchment-first admissions.

`index.html` is the whole site. Open it in a browser, or host it anywhere static (GitHub Pages works). It needs a connection for the map tiles, postcode lookups (postcodes.io) and walking routes (FOSSGIS OSRM).

## Refreshing the data

Each autumn Data North Yorkshire publishes the new year's admissions sheet. Add its link to `build/fetch.sh`, add the year to `DATASETS` in `build/build_data.py` and to the year menu in `build/template.html`, swap in the latest Ofsted CSV, then:

```sh
sh build/fetch.sh /tmp/harrogate-raw
python3 -I build/build_data.py /tmp/harrogate-raw build/data.json   # needs openpyxl and shapely
python3 -I build/assemble.py build/data.json                         # writes index.html
```

The build prints any school it can't match to a map point, Ofsted record or catchment. Five faith schools have no council catchment, which is expected.

## Feedback form (parked)

The page has a name, email and comments form that sends to the site owner's inbox through [FormSubmit](https://formsubmit.co). It stays hidden until `FEEDBACK_ID` in `build/template.html` is set to the FormSubmit form ID (the random string FormSubmit sends after activation). Set it, then run `assemble.py` again.

## Sources

- North Yorkshire Council admissions statistics, 2022 to 2026 entry ([Data North Yorkshire](https://hub.datanorthyorkshire.org/dataset/school-admissions-2026-2027-yearly-statistics-primary-and-secondary-school)). The 2022 sheet is only used for the 2023 admission numbers.
- Catchment areas and school locations from the layers behind the council's [Finding a school map](https://experience.arcgis.com/experience/4dd5b97eae514b31a067137ebf7cdd6a) (September 2025). The council says the map is for reference only.
- Ofsted management information, state-funded schools, latest inspections as at 30 September 2026.

## Known limits

- Distances run from the postcode centre, not the exact address, and walking routes use OpenStreetMap rather than the council's own network, so there's a 0.1 mile margin of error.
- Sibling priority isn't modelled.
- Academies, voluntary aided and foundation schools set their own policies. Where the council didn't publish a year for them, it's shown as "not published".
- The 2023 sheet labels its distance column "2022", but its figures differ from the 2022 sheet, so they're treated as 2023.
