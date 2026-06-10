-- 020_finance_payment_gateway.sql
-- Extension for payment gateway support in finance billing

alter table public.pembayaran
add column if not exists provider text,
add column if not exists provider_reference text,
add column if not exists checkout_url text;

-- Add new status options if needed (but we already have check constraint)
-- Let's drop the check constraint and recreate it to allow gateway statuses
alter table public.pembayaran drop constraint if exists pembayaran_status_check;
alter table public.pembayaran add constraint pembayaran_status_check check (status in ('Menunggu', 'Terverifikasi', 'Ditolak', 'Kadaluarsa', 'Gagal'));

-- Ensure `metode` can be 'Payment Gateway' (it's text, so it's fine, no constraint)
