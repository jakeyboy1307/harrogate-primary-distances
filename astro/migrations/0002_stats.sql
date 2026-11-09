-- Visitor counts for the admin dashboard: daily totals only. No cookies, no IP addresses, nothing about a person.
--   kind 'page'     key = the page, e.g. '/', '/plan/', '404'
--   kind 'search'   key = the area searched: 'harrogate', 'york' or 'outside'
--   kind 'panel'    key = a school's URN, when its details are opened
--   kind 'ad_view'  key = '<ad id>:<spot>', when an ad is at least half on screen (once per page view)
--   kind 'ad_click' key = '<ad id>:<spot>', when its button or link is clicked
CREATE TABLE daily_counts (
  day   TEXT NOT NULL,      -- YYYY-MM-DD, UK time
  kind  TEXT NOT NULL,
  key   TEXT NOT NULL,
  n     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, key)
) WITHOUT ROWID;
CREATE INDEX daily_counts_kind ON daily_counts (kind, day);
