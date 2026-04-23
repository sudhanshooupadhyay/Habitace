-- ============================================================
--  Discipline Tracker — Migration (run AFTER schema.sql)
--  Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. Extend users table ────────────────────────────────────
alter table public.users
  add column if not exists height_cm         integer,
  add column if not exists weight_kg         decimal(5,2),
  add column if not exists initial_bmi       decimal(5,2),
  add column if not exists current_bmi       decimal(5,2),
  add column if not exists current_level     integer not null default 1,
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists webhook_token     uuid not null default gen_random_uuid();

-- Back-fill webhook_token for any existing rows (already defaulted above,
-- but make sure it's populated for rows created before the column existed)
update public.users
set webhook_token = gen_random_uuid()
where webhook_token is null;

-- ── 2. daily_metrics table ───────────────────────────────────
-- Stores one row per user per day; sleep data comes from Garmin webhook.
create table if not exists public.daily_metrics (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  date              date not null default current_date,
  garmin_sleep_hours decimal(4,1),
  garmin_sleep_score integer check (garmin_sleep_score between 0 and 100),
  synced_at         timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.daily_metrics enable row level security;

create policy "daily_metrics: own rows" on public.daily_metrics
  for all using (auth.uid() = user_id);

create index if not exists daily_metrics_user_date
  on public.daily_metrics(user_id, date desc);

-- ── 3. weight_logs table ─────────────────────────────────────
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

-- ── 4. Update trigger: auto-sync current_level on XP change ──
-- Level formula: floor(0.1 * sqrt(total_xp)) + 1
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

-- ── 5. Helper: Save onboarding biometrics ────────────────────
create or replace function public.save_biometrics(
  p_user_id   uuid,
  p_height_cm integer,
  p_weight_kg decimal,
  p_bmi       decimal
) returns void language plpgsql security definer as $$
begin
  update public.users
  set height_cm            = p_height_cm,
      weight_kg            = p_weight_kg,
      initial_bmi          = p_bmi,
      current_bmi          = p_bmi,
      current_level        = 1,
      onboarding_complete  = true
  where id = p_user_id;
end;
$$;

-- ── 6. Helper: Update current BMI ────────────────────────────
create or replace function public.update_bmi(
  p_user_id uuid,
  p_weight_kg decimal,
  p_bmi decimal
) returns void language plpgsql security definer as $$
begin
  update public.users
  set weight_kg   = p_weight_kg,
      current_bmi = p_bmi
  where id = p_user_id;
end;
$$;
