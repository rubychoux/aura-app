-- daily_logs: lifestyle check-ins (one row per user per local calendar day)
-- Run in Supabase SQL editor (or via migration tooling).

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- Local calendar day (matches app: YYYY-MM-DD strings from JS Date in local time)
  date date NOT NULL,
  sleep_hours double precision,
  water_intake int4,
  stress_level int4,
  diet_tags text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One log per user per day
CREATE UNIQUE INDEX IF NOT EXISTS daily_logs_user_date_uniq
  ON public.daily_logs (user_id, date);

CREATE INDEX IF NOT EXISTS daily_logs_user_id_idx
  ON public.daily_logs (user_id);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users insert own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users update own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users delete own daily logs" ON public.daily_logs;

CREATE POLICY "Users read own daily logs"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily logs"
  ON public.daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily logs"
  ON public.daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own daily logs"
  ON public.daily_logs FOR DELETE
  USING (auth.uid() = user_id);
