-- 019_payment_gateway_settings.sql
-- Seed default payment gateway configurations

insert into public.settings (key, label, description, category, value, is_secret, is_active)
values
  ('payment.midtrans.enabled', 'Midtrans Gateway', 'Mengaktifkan metode pembayaran via Midtrans.', 'payment', '{"value": false}'::jsonb, false, true),
  ('payment.midtrans.is_production', 'Midtrans Environment (Production)', 'Gunakan true untuk production, false untuk sandbox.', 'payment', '{"value": false}'::jsonb, false, true),
  ('payment.midtrans.server_key', 'Midtrans Server Key', 'Kunci rahasia server Midtrans.', 'payment', '{"value": ""}'::jsonb, true, true),
  ('payment.midtrans.client_key', 'Midtrans Client Key', 'Kunci publik client Midtrans.', 'payment', '{"value": ""}'::jsonb, false, true),
  
  ('payment.bjb.enabled', 'Bank BJB Gateway', 'Mengaktifkan metode pembayaran via Bank BJB.', 'payment', '{"value": false}'::jsonb, false, true),
  ('payment.bjb.api_key', 'BJB API Key', 'Kunci rahasia API Bank BJB.', 'payment', '{"value": ""}'::jsonb, true, true),
  ('payment.bjb.merchant_id', 'BJB Merchant ID', 'ID Merchant Bank BJB.', 'payment', '{"value": ""}'::jsonb, false, true)
on conflict (key) do update
set 
  label = excluded.label,
  description = excluded.description,
  category = excluded.category,
  is_secret = excluded.is_secret;
