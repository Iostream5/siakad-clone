alter table public.audit_logs enable row level security;
alter table public.pmb_pendaftaran enable row level security;
alter table public.tagihan enable row level security;
alter table public.pembayaran enable row level security;

drop policy if exists "Service role manage audit_logs" on public.audit_logs;
create policy "Service role manage audit_logs"
on public.audit_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role manage pmb_pendaftaran" on public.pmb_pendaftaran;
create policy "Service role manage pmb_pendaftaran"
on public.pmb_pendaftaran
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role manage tagihan" on public.tagihan;
create policy "Service role manage tagihan"
on public.tagihan
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role manage pembayaran" on public.pembayaran;
create policy "Service role manage pembayaran"
on public.pembayaran
for all
to service_role
using (true)
with check (true);
