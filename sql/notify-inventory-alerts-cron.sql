-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
--
-- Schedules the notify-inventory-alerts Edge Function every Monday at 09:00 UTC.
-- Cron format: minute hour day-of-month month day-of-week (0=Sun, 1=Mon, …, 6=Sat)
--
-- Before running:
--   1. Enable pg_cron and pg_net under Database → Extensions if not already enabled
--   2. Deploy the edge function: supabase functions deploy notify-inventory-alerts

-- ---------------------------------------------------------------------------
-- Step 1: Remove existing job if re-running this script
-- ---------------------------------------------------------------------------
select cron.unschedule(jobid)
from cron.job
where jobname = 'notify-inventory-alerts-weekly';

-- ---------------------------------------------------------------------------
-- Step 2: Schedule weekly run — every Monday at 09:00 UTC
-- ---------------------------------------------------------------------------
select cron.schedule(
  'notify-inventory-alerts-weekly',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := 'https://fmuyqtuafxmlnggbjdvd.supabase.co/functions/v1/notify-inventory-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_HlJA2-nYgzzG0pLpEOXF1g_bq91wl6S'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- List scheduled jobs:
--   select jobid, jobname, schedule, active from cron.job;
--
-- View recent cron runs:
--   select * from cron.job_run_details order by start_time desc limit 20;
--
-- View HTTP responses from pg_net (may take a few seconds after the cron fires):
--   select * from net._http_response order by created desc limit 10;
--
-- Remove the schedule:
--   select cron.unschedule(jobid) from cron.job where jobname = 'notify-inventory-alerts-weekly';
