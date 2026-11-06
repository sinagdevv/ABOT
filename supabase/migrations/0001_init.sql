-- ABOT core schema: payouts, the agent's audit trail, Velo funding requests,
-- and inbound webhook dedupe. All monetary amounts are stroops (bigint),
-- never floating point.

create extension if not exists pgcrypto;

create table payouts (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  device_hash text not null,
  recipient_name text not null,
  recipient_address text not null,
  amount_stroops bigint not null check (amount_stroops > 0),
  asset text not null,
  due_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','needs_funding','authorizing','authorized','claimed','failed','cancelled')),
  authorization_nonce text,
  authorization_tx_hash text,
  claim_tx_hash text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_status_due_idx on payouts (status, due_at);

create table agent_decisions (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references payouts (id) on delete cascade,
  action text not null,
  reason text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index agent_decisions_payout_idx on agent_decisions (payout_id, created_at desc);

create table funding_requests (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid references payouts (id) on delete set null,
  payment_intent_id text not null unique,
  checkout_url text,
  amount text not null,
  asset text not null,
  status text not null default 'pending'
    check (status in ('pending','paid','failed','expired','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one open funding request per payout, so a re-run of the sweep
-- can check "is there already one in flight" instead of spamming Velo.
create unique index funding_requests_open_payout_idx on funding_requests (payout_id)
  where status = 'pending';

create table webhook_events (
  -- Source-prefixed delivery/event id. Primary key doubles as the dedupe guard:
  -- `insert ... on conflict (id) do nothing` makes re-delivery a no-op.
  id text primary key,
  source text not null check (source in ('velo', 'noir')),
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger payouts_set_updated_at
  before update on payouts
  for each row execute function set_updated_at();

create trigger funding_requests_set_updated_at
  before update on funding_requests
  for each row execute function set_updated_at();

-- Atomically selects due, unclaimed payouts and flips them to 'authorizing'
-- in the same statement (FOR UPDATE SKIP LOCKED), so two concurrent agent
-- sweeps can never grab the same payout and double-authorize it.
create or replace function claim_due_payouts(p_now timestamptz, p_limit int default 50)
returns setof payouts
language plpgsql as $$
begin
  return query
  with candidates as (
    select id from payouts
    where status in ('pending', 'needs_funding') and due_at <= p_now
    order by due_at asc
    limit p_limit
    for update skip locked
  )
  update payouts p
  set status = 'authorizing'
  from candidates c
  where p.id = c.id
  returning p.*;
end;
$$;

-- All access goes through the server-side service-role key (bypasses RLS).
-- Enabling RLS with no policies denies anon/authenticated roles entirely,
-- so a leaked anon key can never read or write payout data.
alter table payouts enable row level security;
alter table agent_decisions enable row level security;
alter table funding_requests enable row level security;
alter table webhook_events enable row level security;
