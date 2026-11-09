-- The admin database (the DB binding in wrangler.jsonc): advertisers, their ads, and enquiries from /advertise/.
-- Apply with: npx wrangler d1 migrations apply <database name> --remote   (and --local for wrangler dev)

CREATE TABLE advertisers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,                -- the business
  contact_name  TEXT,
  email         TEXT,
  phone         TEXT,
  notes         TEXT,
  demo          INTEGER NOT NULL DEFAULT 0,   -- a made-up business for the preview
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  advertiser_id INTEGER REFERENCES advertisers(id),
  -- only 'live' ads inside their dates are shown on the site
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'paused', 'ended')),
  placements    TEXT NOT NULL,                -- JSON list: uniform, profile, nearby, results, plan, area
  areas         TEXT NOT NULL,                -- JSON list: harrogate, york
  urns          TEXT,                         -- JSON list of school URNs, or NULL for every school in the areas
  name          TEXT NOT NULL,                -- shown on the card
  category      TEXT NOT NULL,                -- e.g. "School uniform"
  blurb         TEXT NOT NULL,
  cta           TEXT NOT NULL,                -- button text
  url           TEXT NOT NULL,                -- where the button goes
  logo_text     TEXT,                         -- two letters, used when there's no logo image
  logo_url      TEXT,
  colour        TEXT,                         -- logo tile colour, e.g. #2747D8
  offer         TEXT,
  open_days     TEXT,                         -- JSON list, school profiles only
  start_date    TEXT,                         -- YYYY-MM-DD, first day shown
  end_date      TEXT,                         -- YYYY-MM-DD, last day shown
  price_pence   INTEGER,
  price_period  TEXT CHECK (price_period IN ('month', 'year', 'once') OR price_period IS NULL),
  paid          INTEGER NOT NULL DEFAULT 0,
  demo          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX ads_status ON ads (status);
CREATE INDEX ads_advertiser ON ads (advertiser_id);

CREATE TABLE enquiries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  name          TEXT NOT NULL,
  business      TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  type          TEXT,
  area          TEXT,
  slots         TEXT,                         -- JSON list of the options ticked
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'won', 'lost')),
  emailed       INTEGER NOT NULL DEFAULT 0,   -- 1 once the email to us went through
  advertiser_id INTEGER REFERENCES advertisers(id)
);
CREATE INDEX enquiries_status ON enquiries (status);
