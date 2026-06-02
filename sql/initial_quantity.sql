-- Run in Supabase SQL editor: tracks quantity at first receipt for audit reporting.
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS initial_quantity numeric;

UPDATE inventory
SET initial_quantity = quantity
WHERE initial_quantity IS NULL;
