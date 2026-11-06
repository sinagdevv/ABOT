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
    check (status in ('pending','needs_funding','authorizing','manual_review','authorized','claimed','failed','cancelled')),
  authorization_nonce text,
  authorization_tx_hash text,
  claim_tx_hash text,
  failure_reason text,
  lease_token uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_status_due_idx on payouts (status, due_at);
create index payouts_lease_idx on payouts (status, lease_expires_at)
  where status = 'authorizing';

-- One monotonically increasing nonce stream per device. The payout stores its
-- nonce before any network call, so a retry never invents a new authorization.
create table payout_nonce_sequences (
  device_hash text primary key,
  next_nonce bigint not null check (next_nonce > 0)
);
alter table payout_nonce_sequences enable row level security;

create or replace function reserve_authorization_nonce(p_device_hash text, p_floor bigint)
returns bigint language sql as $$
  insert into payout_nonce_sequences(device_hash, next_nonce)
  values (p_device_hash, greatest(p_floor, 1))
  on conflict (device_hash) do update
    set next_nonce = greatest(payout_nonce_sequences.next_nonce + 1, excluded.next_nonce)
  returning next_nonce;
$$;

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

create or replace function enforce_payout_update()
returns trigger language plpgsql as $$
begin
  if new.idempotency_key <> old.idempotency_key
     or new.device_hash <> old.device_hash
     or new.recipient_name <> old.recipient_name
     or new.recipient_address <> old.recipient_address
     or new.amount_stroops <> old.amount_stroops
     or new.asset <> old.asset
     or new.due_at <> old.due_at then
    raise exception 'payout approval fields are immutable';
  end if;

  if old.status <> new.status and not (
    (old.status = 'pending' and new.status in ('authorizing','cancelled'))
    or (old.status = 'needs_funding' and new.status in ('authorizing','pending','cancelled'))
    or (old.status = 'authorizing' and new.status in ('authorized','needs_funding','pending','failed','manual_review'))
    or (old.status = 'manual_review' and new.status in ('pending','cancelled'))
    or (old.status = 'authorized' and new.status = 'claimed')
    or (old.status = 'failed' and new.status = 'pending')
  ) then
    raise exception 'invalid payout transition: % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger payouts_enforce_update
  before update on payouts
  for each row execute function enforce_payout_update();

-- Expired leases are held for review: the previous worker may have submitted
-- a transaction, and Noir's public event does not identify the nonce.
create or replace function claim_due_payouts(
  p_now timestamptz,
  p_limit int default 50,
  p_lease_seconds int default 300
)
returns setof payouts
language plpgsql as $$
begin
  update payouts
  set status = 'manual_review',
      failure_reason = 'worker lease expired; authorization outcome requires manual review',
      lease_token = null,
      lease_expires_at = null
  where status = 'authorizing'
    and lease_expires_at <= p_now;

  return query
  with candidates as (
    select id from payouts
    where status in ('pending', 'needs_funding')
      and due_at <= p_now
    order by due_at asc
    limit least(greatest(p_limit, 1), 100)
    for update skip locked
  )
  update payouts p
  set status = 'authorizing',
      authorization_nonce = coalesce(
        p.authorization_nonce,
        reserve_authorization_nonce(p.device_hash, (extract(epoch from p_now) * 1000)::bigint)::text
      ),
      lease_token = gen_random_uuid(),
      lease_expires_at = p_now + make_interval(secs => greatest(p_lease_seconds, 30))
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
