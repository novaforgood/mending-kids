-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Allows cents (e.g. 9.99) on inventory money columns.

ALTER TABLE public.inventory
  ALTER COLUMN market_value_per_unit TYPE numeric(14, 2)
    USING (market_value_per_unit::numeric),
  ALTER COLUMN total_value TYPE numeric(14, 2)
    USING (total_value::numeric);
