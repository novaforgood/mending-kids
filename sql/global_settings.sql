-- Run in Supabase SQL editor: stores app-wide settings as a single row.
-- expiration_alert_days = how many days before an item expires it should trigger an alert.
-- 180 days (~6 months) is the previous hardcoded default.
CREATE TABLE IF NOT EXISTS global_settings (
  id integer PRIMARY KEY DEFAULT 1,
  expiration_alert_days integer NOT NULL DEFAULT 180,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_settings_single_row CHECK (id = 1),
  CONSTRAINT global_settings_days_range CHECK (expiration_alert_days BETWEEN 1 AND 180)
);

INSERT INTO global_settings (id, expiration_alert_days)
VALUES (1, 180)
ON CONFLICT (id) DO NOTHING;
