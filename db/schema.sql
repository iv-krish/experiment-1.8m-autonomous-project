-- Autonomous Experiment Database Schema
-- Run this directly in your Supabase SQL Editor

create table if not exists experiment_state (
  id integer primary key default 1,
  total_raised numeric(14, 2) default 0.00,
  target_amount numeric(14, 2) default 1800000.00,
  is_alive boolean default true,
  death_timestamp timestamp with time zone default (now() + interval '72 hours'),
  contributions_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Seed single row if not present
insert into experiment_state (id, total_raised, target_amount, is_alive, death_timestamp, contributions_count)
values (1, 0.00, 1800000.00, true, (now() + interval '72 hours'), 0)
on conflict (id) do nothing;

create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  amount_usd numeric(10, 2) not null,
  donor_name text default 'Anonymous Stranger',
  donor_message text,
  donor_country text default 'GLOBAL',
  created_at timestamp with time zone default now()
);

-- Security: Enable RLS and public read for status
alter table experiment_state enable row level security;
alter table contributions enable row level security;

create policy "Allow public read on experiment_state"
  on experiment_state for select
  using (true);

create policy "Allow public read on contributions"
  on contributions for select
  using (true);
