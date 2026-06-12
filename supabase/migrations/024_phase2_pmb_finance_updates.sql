-- 024_phase2_pmb_finance_updates.sql
-- Migration for Phase 2: PMB and Finance audit completeness

-- 1. Ensure `tagihan` has master_biaya_id relation if not exists (for tracking source)
alter table public.tagihan
add column if not exists master_biaya_id uuid references public.master_biaya(id) on delete set null;

-- 2. Ensure `pmb_pendaftaran` has failure_reason for webhook failures if any
alter table public.pmb_pendaftaran
add column if not exists last_error_message text;

-- 3. Add `pembayaran` failure_reason
alter table public.pembayaran
add column if not exists failure_reason text;

-- 4. Add `pmb_pembayaran` failure_reason
alter table public.pmb_pembayaran
add column if not exists failure_reason text;

-- 5. Add webhook event tracking to prevent double processing in arus_kas
-- (Idempotency key implementation helper)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null, -- provider's event id/signature
  event_type text not null,
  payload jsonb,
  processed_at timestamptz not null default now(),
  status text not null default 'success',
  error_message text,
  unique(provider, event_id)
);

-- RLS for webhook_events
alter table public.webhook_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'webhook_events' and policyname = 'Service role manage webhook_events'
  ) then
    create policy "Service role manage webhook_events"
    on public.webhook_events
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;
