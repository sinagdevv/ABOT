-- Forward-only hardening for the manually applied 0001 schema.
-- Do not run 0001 again on an existing database.

alter table public.payouts
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz;

alter table public.payouts drop constraint if exists payouts_status_check;
alter table public.payouts add constraint payouts_status_check
  check (status in ('pending','needs_funding','authorizing','manual_review','authorized','claimed','failed','cancelled'));

create index if not exists payouts_lease_idx on public.payouts (status, lease_expires_at)
  where status = 'authorizing';

create table if not exists public.payout_nonce_sequences (
  device_hash text primary key,
  next_nonce bigint not null check (next_nonce > 0)
);
alter table public.payout_nonce_sequences enable row level security;

create or replace function public.reserve_authorization_nonce(p_device_hash text, p_floor bigint)
returns bigint language sql as $$
  insert into public.payout_nonce_sequences(device_hash, next_nonce)
  values (p_device_hash, greatest(p_floor, 1))
  on conflict (device_hash) do update
    set next_nonce = greatest(public.payout_nonce_sequences.next_nonce + 1, excluded.next_nonce)
  returning next_nonce;
$$;

create or replace function public.enforce_payout_update()
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

drop trigger if exists payouts_enforce_update on public.payouts;
create trigger payouts_enforce_update
  before update on public.payouts
  for each row execute function public.enforce_payout_update();

-- Replace the old two-argument function so PostgREST cannot select an
-- ambiguous overload when the app omits the lease duration.
drop function if exists public.claim_due_payouts(timestamptz, integer);
create function public.claim_due_payouts(
  p_now timestamptz,
  p_limit int default 50,
  p_lease_seconds int default 300
)
returns setof public.payouts
language plpgsql as $$
begin
  update public.payouts
  set status = 'manual_review',
      failure_reason = 'worker lease expired; authorization outcome requires manual review',
      lease_token = null,
      lease_expires_at = null
  where status = 'authorizing'
    and lease_expires_at <= p_now;

  return query
  with candidates as (
    select id from public.payouts
    where status in ('pending', 'needs_funding')
      and due_at <= p_now
    order by due_at asc
    limit least(greatest(p_limit, 1), 100)
    for update skip locked
  )
  update public.payouts p
  set status = 'authorizing',
      authorization_nonce = coalesce(
        p.authorization_nonce,
        public.reserve_authorization_nonce(
          p.device_hash,
          (extract(epoch from p_now) * 1000)::bigint
        )::text
      ),
      lease_token = gen_random_uuid(),
      lease_expires_at = p_now + make_interval(secs => greatest(p_lease_seconds, 30))
  from candidates c
  where p.id = c.id
  returning p.*;
end;
$$;

-- Only the server's service-role path may access payout data or execute the
-- claim RPC. RLS remains enabled and has no public policies.
revoke all on table public.payouts, public.agent_decisions, public.funding_requests,
  public.webhook_events, public.payout_nonce_sequences from anon, authenticated;
grant select, insert, update, delete on table public.payouts, public.agent_decisions,
  public.funding_requests, public.webhook_events to service_role;
grant select, insert, update on table public.payout_nonce_sequences to service_role;

revoke all on function public.claim_due_payouts(timestamptz, integer, integer) from public;
grant execute on function public.claim_due_payouts(timestamptz, integer, integer) to service_role;
revoke all on function public.reserve_authorization_nonce(text, bigint) from public;
grant execute on function public.reserve_authorization_nonce(text, bigint) to service_role;
