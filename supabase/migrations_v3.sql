-- ============================================================
--  Discipline Tracker — Migration v3
--  Run AFTER migrations_v2.sql in Supabase SQL Editor
--  Adds vice quit-tracking columns to public.users
-- ============================================================

-- ── 1. Extend users: vice quit tracking ─────────────────────
alter table public.users
  add column if not exists vice_quit_date    timestamptz,
  add column if not exists vice_daily_amount decimal(6,2),  -- cigarettes/drinks per day
  add column if not exists vice_pack_size    decimal(6,2),  -- items per pack/bottle
  add column if not exists vice_pack_cost    decimal(8,2);  -- cost per pack/bottle (user's currency)
