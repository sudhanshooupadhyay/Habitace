-- ============================================================
--  Discipline Tracker — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. users (extends auth.users) ───────────────────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  total_xp    integer not null default 0,
  current_streak integer not null default 0,
  last_active date,
  created_at  timestamptz not null default now()
);

-- Auto-create profile row on sign-up
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

-- ── 2. habits (one row per user per day) ────────────────────
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

-- Auto-update updated_at
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

-- ── 6. Row Level Security ────────────────────────────────────
alter table public.users             enable row level security;
alter table public.habits            enable row level security;
alter table public.workout_logs      enable row level security;
alter table public.anxiety_vault     enable row level security;
alter table public.push_subscriptions enable row level security;

-- users: own row only
create policy "users: own row" on public.users
  for all using (auth.uid() = id);

-- habits: own rows only
create policy "habits: own rows" on public.habits
  for all using (auth.uid() = user_id);

-- workout_logs: own rows only
create policy "workout_logs: own rows" on public.workout_logs
  for all using (auth.uid() = user_id);

-- anxiety_vault: own rows only
create policy "anxiety_vault: own rows" on public.anxiety_vault
  for all using (auth.uid() = user_id);

-- push_subscriptions: own rows only
create policy "push_subscriptions: own rows" on public.push_subscriptions
  for all using (auth.uid() = user_id);

-- ── 7. Indexes ───────────────────────────────────────────────
create index habits_user_date       on public.habits(user_id, date desc);
create index anxiety_vault_user_ts  on public.anxiety_vault(user_id, timestamp desc);
create index workout_logs_user_date on public.workout_logs(user_id, date desc);

-- ── 8. Helper: XP update function ───────────────────────────
create or replace function public.add_xp(p_user_id uuid, p_xp integer)
returns void language plpgsql security definer as $$
begin
  update public.users
  set    total_xp = total_xp + p_xp,
         last_active = current_date
  where  id = p_user_id;
end;
$$;
