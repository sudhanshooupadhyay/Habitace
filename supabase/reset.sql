-- ============================================================
--  Discipline Tracker — FULL RESET + REBUILD
--  Supabase Dashboard → SQL Editor → New Query → Run
--
--  This drops everything and recreates the entire schema
--  from scratch (schema + all migrations v1/v2/v3).
--
--  ⚠️  After running this, also delete users in:
--      Authentication → Users → select all → Delete
-- ============================================================


-- ── STEP 1: Drop triggers ────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists habits_updated_at    on public.habits;


-- ── STEP 2: Drop functions ───────────────────────────────────

drop function if exists public.handle_new_user()           cascade;
drop function if exists public.set_updated_at()            cascade;
drop function if exists public.add_xp(uuid, integer)       cascade;
drop function if exists public.save_biometrics(uuid, integer, decimal, decimal)       cascade;
drop function if exists public.save_biometrics(uuid, integer, decimal, decimal, date) cascade;
drop function if exists public.update_bmi(uuid, decimal, decimal) cascade;
drop function if exists public.upsert_garmin_daily(uuid, date, integer, integer, integer, integer, decimal, integer, decimal, integer, integer, integer, integer, integer, integer, decimal, integer) cascade;


-- ── STEP 3: Drop tables (leaf → root to respect FKs) ─────────

drop table if exists public.push_subscriptions cascade;
drop table if exists public.anxiety_vault      cascade;
drop table if exists public.workout_logs       cascade;
drop table if exists public.bio_age_logs       cascade;
drop table if exists public.weight_logs        cascade;
drop table if exists public.daily_metrics      cascade;
drop table if exists public.garmin_connections cascade;
drop table if exists public.habits             cascade;
drop table if exists public.users              cascade;


-- ════════════════════════════════════════════════════════════
--  REBUILD — schema.sql
-- ════════════════════════════════════════════════════════════

-- ── 1. users (extends auth.users) ───────────────────────────
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  total_xp        integer not null default 0,
  current_streak  integer not null default 0,
  last_active     date,
  created_at      timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. habits ────────────────────────────────────────────────
create table public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  date          date not null default current_date,
  studying      boolean not null default false,
  workout       boolean not null default false,
  eating_clean  boolean not null default false,
  meditation    boolean not null default false,
  smoke_free    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, date)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

-- ── 3. workout_logs ─────────────────────────────────────────
create table public.workout_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  date             date not null default current_date,
  routine          text,
  symptoms_faced   text,
  fears_conquered  text,
  personal_notes   text,
  created_at       timestamptz not null default now()
);

-- ── 4. anxiety_vault ────────────────────────────────────────
create table public.anxiety_vault (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  timestamp           timestamptz not null default now(),
  trigger             text,
  physical_symptoms   text,
  cognitive_reframing text,
  xp_awarded          integer not null default 20
);

-- ── 5. push_subscriptions ───────────────────────────────────
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  unique(user_id, endpoint)
);

-- ── 6. RLS ───────────────────────────────────────────────────
alter table public.users              enable row level security;
alter table public.habits             enable row level security;
alter table public.workout_logs       enable row level security;
alter table public.anxiety_vault      enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "users: own row"              on public.users              for all using (auth.uid() = id);
create policy "habits: own rows"            on public.habits             for all using (auth.uid() = user_id);
create policy "workout_logs: own rows"      on public.workout_logs       for all using (auth.uid() = user_id);
create policy "anxiety_vault: own rows"     on public.anxiety_vault      for all using (auth.uid() = user_id);
create policy "push_subscriptions: own rows" on public.push_subscriptions for all using (auth.uid() = user_id);

-- ── 7. Indexes ───────────────────────────────────────────────
create index habits_user_date       on public.habits(user_id, date desc);
create index anxiety_vault_user_ts  on public.anxiety_vault(user_id, timestamp desc);
create index workout_logs_user_date on public.workout_logs(user_id, date desc);


-- ════════════════════════════════════════════════════════════
--  REBUILD — migrations.sql (v1)
-- ════════════════════════════════════════════════════════════

alter table public.users
  add column if not exists height_cm            integer,
  add column if not exists weight_kg            decimal(5,2),
  add column if not exists initial_bmi          decimal(5,2),
  add column if not exists current_bmi          decimal(5,2),
  add column if not exists current_level        integer not null default 1,
  add column if not exists onboarding_complete  boolean not null default false,
  add column if not exists webhook_token        uuid not null default gen_random_uuid();

-- daily_metrics
create table if not exists public.daily_metrics (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  date               date not null default current_date,
  garmin_sleep_hours decimal(4,1),
  garmin_sleep_score integer check (garmin_sleep_score between 0 and 100),
  synced_at          timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.daily_metrics enable row level security;
create policy "daily_metrics: own rows" on public.daily_metrics
  for all using (auth.uid() = user_id);
create index if not exists daily_metrics_user_date
  on public.daily_metrics(user_id, date desc);

-- weight_logs
create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  date       date not null default current_date,
  weight_kg  decimal(5,2) not null,
  bmi        decimal(5,2) not null,
  created_at timestamptz not null default now()
);

alter table public.weight_logs enable row level security;
create policy "weight_logs: own rows" on public.weight_logs
  for all using (auth.uid() = user_id);
create index if not exists weight_logs_user_date
  on public.weight_logs(user_id, date desc);

-- add_xp with level sync
create or replace function public.add_xp(p_user_id uuid, p_xp integer)
returns void language plpgsql security definer as $$
begin
  update public.users
  set    total_xp      = total_xp + p_xp,
         current_level = floor(0.1 * sqrt((total_xp + p_xp)::float)) + 1,
         last_active   = current_date
  where  id = p_user_id;
end;
$$;

-- save_biometrics (base)
create or replace function public.save_biometrics(
  p_user_id   uuid,
  p_height_cm integer,
  p_weight_kg decimal,
  p_bmi       decimal
) returns void language plpgsql security definer as $$
begin
  update public.users
  set height_cm           = p_height_cm,
      weight_kg           = p_weight_kg,
      initial_bmi         = p_bmi,
      current_bmi         = p_bmi,
      current_level       = 1,
      onboarding_complete = true
  where id = p_user_id;
end;
$$;

-- update_bmi
create or replace function public.update_bmi(
  p_user_id   uuid,
  p_weight_kg decimal,
  p_bmi       decimal
) returns void language plpgsql security definer as $$
begin
  update public.users
  set weight_kg   = p_weight_kg,
      current_bmi = p_bmi
  where id = p_user_id;
end;
$$;


-- ════════════════════════════════════════════════════════════
--  REBUILD — migrations_v2.sql
-- ════════════════════════════════════════════════════════════

alter table public.users
  add column if not exists date_of_birth    date,
  add column if not exists bio_age          decimal(4,1),
  add column if not exists garmin_connected boolean not null default false;

-- garmin_connections
create table if not exists public.garmin_connections (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  garmin_user_id      text,
  access_token        text not null,
  access_token_secret text not null,
  scopes              text,
  connected_at        timestamptz not null default now(),
  last_synced_at      timestamptz,
  unique(user_id)
);

alter table public.garmin_connections enable row level security;
create policy "garmin_connections: own row" on public.garmin_connections
  for all using (auth.uid() = user_id);

-- Expand daily_metrics with Garmin payload
alter table public.daily_metrics
  add column if not exists resting_hr        integer,
  add column if not exists max_hr            integer,
  add column if not exists avg_hr            integer,
  add column if not exists hrv_rmssd         integer,
  add column if not exists vo2_max           decimal(4,1),
  add column if not exists spo2              integer,
  add column if not exists respiration_rate  decimal(4,1),
  add column if not exists stress_level      integer,
  add column if not exists body_battery      integer,
  add column if not exists steps             integer,
  add column if not exists floors_climbed    integer,
  add column if not exists active_calories   integer,
  add column if not exists intensity_minutes integer;

-- bio_age_logs
create table if not exists public.bio_age_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  date               date not null default current_date,
  chronological_age  decimal(4,1) not null,
  bio_age            decimal(4,1) not null,
  delta_years        decimal(4,1) not null,
  vo2max_component   decimal(4,1),
  rhr_component      decimal(4,1),
  hrv_component      decimal(4,1),
  bmi_component      decimal(4,1),
  sleep_component    decimal(4,1),
  activity_component decimal(4,1),
  composite_score    integer,
  unique(user_id, date)
);

alter table public.bio_age_logs enable row level security;
create policy "bio_age_logs: own rows" on public.bio_age_logs
  for all using (auth.uid() = user_id);
create index if not exists bio_age_logs_user_date
  on public.bio_age_logs(user_id, date desc);

-- save_biometrics (with DOB)
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

-- upsert_garmin_daily
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
    resting_hr         = coalesce(excluded.resting_hr,         daily_metrics.resting_hr),
    max_hr             = coalesce(excluded.max_hr,             daily_metrics.max_hr),
    avg_hr             = coalesce(excluded.avg_hr,             daily_metrics.avg_hr),
    hrv_rmssd          = coalesce(excluded.hrv_rmssd,          daily_metrics.hrv_rmssd),
    vo2_max            = coalesce(excluded.vo2_max,            daily_metrics.vo2_max),
    spo2               = coalesce(excluded.spo2,               daily_metrics.spo2),
    respiration_rate   = coalesce(excluded.respiration_rate,   daily_metrics.respiration_rate),
    stress_level       = coalesce(excluded.stress_level,       daily_metrics.stress_level),
    body_battery       = coalesce(excluded.body_battery,       daily_metrics.body_battery),
    steps              = coalesce(excluded.steps,              daily_metrics.steps),
    floors_climbed     = coalesce(excluded.floors_climbed,     daily_metrics.floors_climbed),
    active_calories    = coalesce(excluded.active_calories,    daily_metrics.active_calories),
    intensity_minutes  = coalesce(excluded.intensity_minutes,  daily_metrics.intensity_minutes),
    garmin_sleep_hours = coalesce(excluded.garmin_sleep_hours, daily_metrics.garmin_sleep_hours),
    garmin_sleep_score = coalesce(excluded.garmin_sleep_score, daily_metrics.garmin_sleep_score),
    synced_at          = now();

  update public.users set garmin_connected = true where id = p_user_id;
end;
$$;


-- ════════════════════════════════════════════════════════════
--  REBUILD — migrations_v3.sql
-- ════════════════════════════════════════════════════════════

alter table public.users
  add column if not exists vice_quit_date    timestamptz,
  add column if not exists vice_daily_amount decimal(6,2),
  add column if not exists vice_pack_size    decimal(6,2),
  add column if not exists vice_pack_cost    decimal(8,2);

-- add vices / interests / username / has_anxiety columns used by the app
alter table public.users
  add column if not exists username     text,
  add column if not exists vices        text[],
  add column if not exists interests    text[],
  add column if not exists has_anxiety  boolean not null default false;


-- ════════════════════════════════════════════════════════════
--  Done — schema is clean and fully rebuilt.
-- ════════════════════════════════════════════════════════════
