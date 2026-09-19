-- Autonomous $1.8M Experiment Database Schema
create extension if not exists pgcrypto;

create table if not exists experiment_state (
  id integer primary key default 1,
  total_raised numeric(14,2) default 0.00,
  target_amount numeric(14,2) default 1800000.00,
  is_alive boolean default true,
  death_timestamp timestamptz default (now() + interval '72 hours'),
  contributions_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into experiment_state (id, total_raised, target_amount, is_alive, death_timestamp, contributions_count)
values (1,0.00,1800000.00,true,(now()+interval '72 hours'),0)
on conflict (id) do nothing;

create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  amount_usd numeric(10,2) not null,
  donor_name text default 'Anonymous Stranger',
  donor_message text,
  donor_country text default 'GLOBAL',
  created_at timestamptz default now()
);

create table if not exists agent_budget_ledger (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('capital','spend','revenue','refund','adjustment')),
  amount_usd numeric(12,2) not null check (amount_usd >= 0),
  source text not null,
  reference_id text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists agent_experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  reason text,
  budget_usd numeric(10,2) not null default 0 check (budget_usd >= 0),
  success_metric text,
  status text not null default 'advisory' check (status in ('advisory','proposed','approved','running','won','lost','cancelled')),
  result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'advisory',
  status text not null,
  metrics jsonb not null,
  advice jsonb,
  created_at timestamptz default now()
);

alter table experiment_state enable row level security;
alter table contributions enable row level security;
alter table agent_budget_ledger enable row level security;
alter table agent_experiments enable row level security;
alter table agent_runs enable row level security;

-- Public site can read campaign status only. Writes remain server-side.
drop policy if exists "Allow public read on experiment_state" on experiment_state;
create policy "Allow public read on experiment_state" on experiment_state for select using (true);

drop policy if exists "Allow public read on contributions" on contributions;
create policy "Allow public read on contributions" on contributions for select using (true);

-- Do not expose the agent ledger/runs publicly by default.
