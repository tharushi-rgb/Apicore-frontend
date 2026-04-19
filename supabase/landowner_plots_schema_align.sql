-- Supabase SQL Editor script
-- Purpose: Align `public.landowner_plots` schema with Apicore-frontend expectations.
-- Safe to run multiple times (idempotent where possible).
--
-- What this frontend expects (high level):
-- - `public.users.id` is a numeric ID used throughout the app (stored in localStorage)
-- - `public.landowner_plots.user_id` references `public.users.id` (numeric)
-- - `forage_entries` is a JSON array (jsonb recommended) containing objects like:
--     [{"name":"Coconut","bloomStartMonth":"Jan","bloomEndMonth":"Mar"}]
-- - `night_access` is boolean (NOT NULL, default false)
--
-- IMPORTANT:
-- - If you already have production data, run the Diagnostics first and review.
-- - If your `landowner_plots.user_id` is UUID (auth.users), do NOT blindly change it.
--   Use the OPTIONAL migration section at the bottom or adjust the frontend.

-- =========================
-- 1) Diagnostics (run first)
-- =========================

-- Does the table exist?
select
  to_regclass('public.landowner_plots') as landowner_plots_regclass;

-- Column types/defaults
select
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'landowner_plots'
order by ordinal_position;

-- RLS enabled?
select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
where c.oid = 'public.landowner_plots'::regclass;

-- Existing RLS policies (if any)
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  permissive,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'landowner_plots'
order by policyname;


-- ========================================
-- 2) Helper: safe JSONB parse (for casts)
-- ========================================

create or replace function public.try_parse_jsonb(input text)
returns jsonb
language plpgsql
immutable
as $$
begin
  return input::jsonb;
exception when others then
  return null;
end;
$$;


-- ========================================
-- 3) Ensure table + required columns exist
-- ========================================

-- Create table if missing (uses the app's expected snake_case columns).
-- Note: if the table already exists, this does nothing.
create table if not exists public.landowner_plots (
  id bigserial primary key,
  user_id bigint not null,
  name text not null,
  province text not null default '',
  district text not null default '',
  ds_division text not null default '',
  gps_latitude double precision,
  gps_longitude double precision,
  total_acreage double precision not null default 0,
  forage_entries jsonb not null default '[]'::jsonb,
  water_availability text not null default 'On-site',
  shade_profile text not null default 'Full Sun',
  vehicle_access text not null default 'Lorry',
  night_access boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add any missing columns on existing tables.
alter table public.landowner_plots
  add column if not exists user_id bigint,
  add column if not exists name text,
  add column if not exists province text,
  add column if not exists district text,
  add column if not exists ds_division text,
  add column if not exists gps_latitude double precision,
  add column if not exists gps_longitude double precision,
  add column if not exists total_acreage double precision,
  add column if not exists forage_entries jsonb,
  add column if not exists water_availability text,
  add column if not exists shade_profile text,
  add column if not exists vehicle_access text,
  add column if not exists night_access boolean,
  add column if not exists images jsonb,
  add column if not exists status text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

-- Defaults + NOT NULL (fill existing NULLs first, then enforce)
update public.landowner_plots set province = '' where province is null;
update public.landowner_plots set district = '' where district is null;
update public.landowner_plots set ds_division = '' where ds_division is null;
update public.landowner_plots set total_acreage = 0 where total_acreage is null;
update public.landowner_plots set water_availability = 'On-site' where water_availability is null;
update public.landowner_plots set shade_profile = 'Full Sun' where shade_profile is null;
update public.landowner_plots set vehicle_access = 'Lorry' where vehicle_access is null;
update public.landowner_plots set night_access = false where night_access is null;
update public.landowner_plots set status = 'active' where status is null;
update public.landowner_plots set created_at = now() where created_at is null;
update public.landowner_plots set updated_at = now() where updated_at is null;

alter table public.landowner_plots
  alter column province set default '',
  alter column district set default '',
  alter column ds_division set default '',
  alter column total_acreage set default 0,
  alter column water_availability set default 'On-site',
  alter column shade_profile set default 'Full Sun',
  alter column vehicle_access set default 'Lorry',
  alter column night_access set default false,
  alter column status set default 'active',
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.landowner_plots
  alter column province set not null,
  alter column district set not null,
  alter column ds_division set not null,
  alter column total_acreage set not null,
  alter column water_availability set not null,
  alter column shade_profile set not null,
  alter column vehicle_access set not null,
  alter column night_access set not null,
  alter column status set not null,
  alter column created_at set not null,
  alter column updated_at set not null;


-- =========================================
-- 4) Ensure JSON columns are valid JSONB
-- =========================================

-- `forage_entries`: support legacy TEXT/JSON strings by safe-casting.
do $$
declare
  forage_type text;
begin
  select data_type
    into forage_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'landowner_plots'
    and column_name = 'forage_entries';

  if forage_type is null then
    -- should not happen (added above), but keep safe
    alter table public.landowner_plots
      add column forage_entries jsonb not null default '[]'::jsonb;
  elsif forage_type <> 'jsonb' then
    alter table public.landowner_plots
      alter column forage_entries type jsonb
      using coalesce(public.try_parse_jsonb(forage_entries::text), '[]'::jsonb);
  end if;
end $$;

update public.landowner_plots
set forage_entries = '[]'::jsonb
where forage_entries is null;

alter table public.landowner_plots
  alter column forage_entries set default '[]'::jsonb,
  alter column forage_entries set not null;

-- `images`: jsonb array (store URLs/paths; avoid raw base64 if possible)
do $$
declare
  images_type text;
begin
  select data_type
    into images_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'landowner_plots'
    and column_name = 'images';

  if images_type is null then
    -- should not happen (added above), but keep safe
    alter table public.landowner_plots
      add column images jsonb not null default '[]'::jsonb;
  elsif images_type <> 'jsonb' then
    alter table public.landowner_plots
      alter column images type jsonb
      using coalesce(public.try_parse_jsonb(images::text), '[]'::jsonb);
  end if;
end $$;

update public.landowner_plots
set images = '[]'::jsonb
where images is null;

alter table public.landowner_plots
  alter column images set default '[]'::jsonb,
  alter column images set not null;


-- =====================================
-- 5) Constraints + indexes (recommended)
-- =====================================

do $$
begin
  begin
    alter table public.landowner_plots
      add constraint landowner_plots_status_check
      check (status in ('active', 'inactive'));
  exception when duplicate_object then
    null;
  end;

  begin
    alter table public.landowner_plots
      add constraint landowner_plots_water_availability_check
      check (water_availability in ('On-site', 'Within 500m', 'Requires Manual Water'));
  exception when duplicate_object then
    null;
  end;

  begin
    alter table public.landowner_plots
      add constraint landowner_plots_shade_profile_check
      check (shade_profile in ('Full Shade', 'Partial Shade', 'Full Sun'));
  exception when duplicate_object then
    null;
  end;

  begin
    alter table public.landowner_plots
      add constraint landowner_plots_vehicle_access_check
      check (vehicle_access in ('Lorry', 'Tuk-tuk', 'Footpath'));
  exception when duplicate_object then
    null;
  end;
end $$;

create index if not exists landowner_plots_user_id_idx
  on public.landowner_plots (user_id);

-- Helps enforce the app's "no duplicate plot name" expectation (case-insensitive)
create unique index if not exists landowner_plots_user_lower_name_uniq
  on public.landowner_plots (user_id, lower(name));


-- =======================================
-- 6) Keep updated_at current (recommended)
-- =======================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_landowner_plots on public.landowner_plots;
create trigger set_updated_at_landowner_plots
before update on public.landowner_plots
for each row
execute function public.set_updated_at();


-- =====================================================
-- 7) Foreign key to public.users (recommended, optional)
-- =====================================================

-- Adds FK only if `public.users` exists.
do $$
begin
  if to_regclass('public.users') is not null then
    begin
      alter table public.landowner_plots
        add constraint landowner_plots_user_id_fk
        foreign key (user_id)
        references public.users(id)
        on delete cascade;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;


-- =============================================================
-- 8) OPTIONAL: RLS policies that work with numeric public.users
-- =============================================================
-- If your current add/edit errors are like:
--   "new row violates row-level security policy for table landowner_plots"
-- then you need this section.
--
-- NOTE: This app also has beekeeper-facing marketplace screens that need to read
-- OTHER landowners' plots (via published listings). So a strict "owner-only SELECT"
-- policy will break the marketplace.
--
-- This approach adds `public.users.auth_user_id uuid` and links it to Supabase auth.uid().
-- It allows RLS to verify that rows belong to the currently authenticated user.

/*
-- 8.1) Add auth_user_id mapping column on public.users
alter table public.users
  add column if not exists auth_user_id uuid;

-- 8.2) Backfill auth_user_id by matching auth.users.email (safe if emails are unique)
update public.users u
set auth_user_id = au.id
from auth.users au
where u.auth_user_id is null
  and u.email is not null
  and lower(u.email) = lower(au.email);

-- 8.3) Auto-populate auth_user_id for new app-created users rows
create or replace function public.set_users_auth_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.auth_user_id is null then
    new.auth_user_id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_users_auth_user_id on public.users;
create trigger set_users_auth_user_id
before insert on public.users
for each row
execute function public.set_users_auth_user_id();

-- 8.4) Enforce uniqueness (optional but recommended)
do $$
begin
  begin
    alter table public.users
      add constraint users_auth_user_id_uniq unique (auth_user_id);
  exception when duplicate_object then
    null;
  end;
end $$;

-- 8.5) Turn RLS on + add policies for plots
alter table public.landowner_plots enable row level security;

-- Drop older policies with same names to allow re-running this section
-- (Dropping is safe; it only affects policies, not data)
drop policy if exists plots_select_authenticated on public.landowner_plots;
drop policy if exists plots_insert_own on public.landowner_plots;
drop policy if exists plots_update_own on public.landowner_plots;
drop policy if exists plots_delete_own on public.landowner_plots;

-- Read: allow any authenticated user (supports beekeeper marketplace screens)
create policy plots_select_authenticated
on public.landowner_plots
for select
to authenticated
using (true);

-- Write: only allow the owner (mapped via users.auth_user_id) to insert/update/delete
create policy plots_insert_own
on public.landowner_plots
for insert
to authenticated
with check (
  user_id = (
    select u.id from public.users u
    where u.auth_user_id = auth.uid()
    limit 1
  )
);

create policy plots_update_own
on public.landowner_plots
for update
to authenticated
using (
  user_id = (
    select u.id from public.users u
    where u.auth_user_id = auth.uid()
    limit 1
  )
)
with check (
  user_id = (
    select u.id from public.users u
    where u.auth_user_id = auth.uid()
    limit 1
  )
);

create policy plots_delete_own
on public.landowner_plots
for delete
to authenticated
using (
  user_id = (
    select u.id from public.users u
    where u.auth_user_id = auth.uid()
    limit 1
  )
);
*/


-- =============================================================
-- 9) OPTIONAL: If landowner_plots.user_id is UUID today
-- =============================================================
-- If Diagnostics shows `user_id` is uuid, the frontend will fail because it sends numeric IDs.
-- In that case you have two options:
--   A) Change frontend to use UUID auth.uid() everywhere (bigger change)
--   B) Migrate DB to numeric user_id referencing public.users(id)
--
-- This block prepares an in-place migration WITHOUT data loss, provided:
-- - You enabled section 8 (users.auth_user_id populated)
-- - landowner_plots.user_id currently stores auth user UUIDs
--
-- It will:
-- - add `user_id_int bigint`
-- - backfill from users.auth_user_id
-- - swap columns

-- Uncomment to run if needed:
-- do $$
-- declare
--   user_id_type text;
-- begin
--   select udt_name into user_id_type
--   from information_schema.columns
--   where table_schema='public' and table_name='landowner_plots' and column_name='user_id';
--
--   if user_id_type = 'uuid' then
--     alter table public.landowner_plots add column if not exists user_id_int bigint;
--
--     update public.landowner_plots p
--     set user_id_int = u.id
--     from public.users u
--     where u.auth_user_id = p.user_id;
--
--     -- Ensure all rows mapped before swapping
--     if exists (select 1 from public.landowner_plots where user_id_int is null) then
--       raise exception 'Some landowner_plots rows could not be mapped to public.users. Fix users.auth_user_id first.';
--     end if;
--
--     alter table public.landowner_plots drop column user_id;
--     alter table public.landowner_plots rename column user_id_int to user_id;
--
--     -- Re-add FK if desired
--     begin
--       alter table public.landowner_plots
--         add constraint landowner_plots_user_id_fk
--         foreign key (user_id) references public.users(id) on delete cascade;
--     exception when duplicate_object then
--       null;
--     end;
--   end if;
-- end $$;
