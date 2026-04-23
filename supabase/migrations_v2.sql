-- ============================================================
--  Discipline Tracker — Migration v2
--  Run AFTER migrations.sql in Supabase SQL Editor
-- ============================================================

-- ── 1. Extend users: DOB + bio age ──────────────────────────
alter table public.users
  add column if not exists date_of_birth   date,
  add column if not exists bio_age         decimal(4,1),
  add column if not exists garmin_connected boolean not null default false;

-- ── 2. Garmin OAuth connection store ────────────────────────
create table if not exists public.garmin_connections (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  garmin_user_id        text,
  access_token          text not null,
  access_token_secret   text not null,
  scopes                text,
  connected_at          timestamptz not null default now(),
  last_synced_at        timestamptz,
  unique(user_id)
);

alter table public.garmin_connections enable row level security;
create policy "garmin_connections: own row" on public.garmin_connections
  for all using (auth.uid() = user_id);

-- ── 3. Expand daily_metrics with full Garmin payload ────────
alter table public.daily_metrics
  add column if not exists resting_hr          integer,
  add column if not exists max_hr              integer,
  add column if not exists avg_hr              integer,
  add column if not exists hrv_rmssd           integer,   -- ms, gold-standard HRV
  add column if not exists vo2_max             decimal(4,1),
  add column if not exists spo2                integer,   -- blood oxygen %
  add column if not exists respiration_rate    decimal(4,1),
  add column if not exists stress_level        integer,   -- 0-100
  add column if not exists body_battery        integer,   -- 0-100
  add column if not exists steps               integer,
  add column if not exists floors_climbed      integer,
  add column if not exists active_calories     integer,
  add column if not exists intensity_minutes   integer;

-- ── 4. Bio age logs (one snapshot per day) ──────────────────
create table if not exists public.bio_age_logs (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  date                  date not null default current_date,
  chronological_age     decimal(4,1) not null,
  bio_age               decimal(4,1) not null,
  delta_years           decimal(4,1) not null,   -- negative = younger than chrono
  vo2max_component      decimal(4,1),
  rhr_component         decimal(4,1),
  hrv_component         decimal(4,1),
  bmi_component         decimal(4,1),
  sleep_component       decimal(4,1),
  activity_component    decimal(4,1),
  composite_score       integer,                  -- 0-100, higher = better
  unique(user_id, date)
);

alter table public.bio_age_logs enable row level security;
create policy "bio_age_logs: own rows" on public.bio_age_logs
  for all using (auth.uid() = user_id);

create index if not exists bio_age_logs_user_date
  on public.bio_age_logs(user_id, date desc);

-- ── 5. Update save_biometrics to include DOB ────────────────
create or replace function public.save_biometrics(
  p_user_id   uuid,
  p_height_cm integer,
  p_weight_kg decimal,
  p_bmi       decimal,
  p_dob       date default null
) returns void language plpgsql security definer as $$
begin
  update public.users
  set height_cm           = p_height_cm,
      weight_kg           = p_weight_kg,
      initial_bmi         = p_bmi,
      current_bmi         = p_bmi,
      current_level       = 1,
      onboarding_complete = true,
      date_of_birth       = coalesce(p_dob, date_of_birth)
  where id = p_user_id;
end;
$$;

-- ── 6. Helper: upsert full Garmin daily payload ──────────────
create or replace function public.upsert_garmin_daily(
  p_user_id           uuid,
  p_date              date,
  p_resting_hr        integer   default null,
  p_max_hr            integer   default null,
  p_avg_hr            integer   default null,
  p_hrv_rmssd         integer   default null,
  p_vo2_max           decimal   default null,
  p_spo2              integer   default null,
  p_respiration_rate  decimal   default null,
  p_stress_level      integer   default null,
  p_body_battery      integer   default null,
  p_steps             integer   default null,
  p_floors            integer   default null,
  p_active_calories   integer   default null,
  p_intensity_minutes integer   default null,
  p_sleep_hours       decimal   default null,
  p_sleep_score       integer   default null
) returns void language plpgsql security definer as $$
begin
  insert into public.daily_metrics (
    user_id, date,
    resting_hr, max_hr, avg_hr, hrv_rmssd, vo2_max, spo2,
    respiration_rate, stress_level, body_battery, steps,
    floors_climbed, active_calories, intensity_minutes,
    garmin_sleep_hours, garmin_sleep_score, synced_at
  ) values (
    p_user_id, p_date,
    p_resting_hr, p_max_hr, p_avg_hr, p_hrv_rmssd, p_vo2_max, p_spo2,
    p_respiration_rate, p_stress_level, p_body_battery, p_steps,
    p_floors, p_active_calories, p_intensity_minutes,
    p_sleep_hours, p_sleep_score, now()
  )
  on conflict (user_id, date) do update set
    resting_hr          = coalesce(excluded.resting_hr,         daily_metrics.resting_hr),
    max_hr              = coalesce(excluded.max_hr,             daily_metrics.max_hr),
    avg_hr              = coalesce(excluded.avg_hr,             daily_metrics.avg_hr),
    hrv_rmssd           = coalesce(excluded.hrv_rmssd,          daily_metrics.hrv_rmssd),
    vo2_max             = coalesce(excluded.vo2_max,            daily_metrics.vo2_max),
    spo2                = coalesce(excluded.spo2,               daily_metrics.spo2),
    respiration_rate    = coalesce(excluded.respiration_rate,   daily_metrics.respiration_rate),
    stress_level        = coalesce(excluded.stress_level,       daily_metrics.stress_level),
    body_battery        = coalesce(excluded.body_battery,       daily_metrics.body_battery),
    steps               = coalesce(excluded.steps,              daily_metrics.steps),
    floors_climbed      = coalesce(excluded.floors_climbed,     daily_metrics.floors_climbed),
    active_calories     = coalesce(excluded.active_calories,    daily_metrics.active_calories),
    intensity_minutes   = coalesce(excluded.intensity_minutes,  daily_metrics.intensity_minutes),
    garmin_sleep_hours  = coalesce(excluded.garmin_sleep_hours, daily_metrics.garmin_sleep_hours),
    garmin_sleep_score  = coalesce(excluded.garmin_sleep_score, daily_metrics.garmin_sleep_score),
    synced_at           = now();

  -- Keep garmin_connected flag in sync on users table
  update public.users set garmin_connected = true where id = p_user_id;
end;
$$;
