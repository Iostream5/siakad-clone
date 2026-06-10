-- Add tahun_akademik_id to master_biaya
alter table public.master_biaya 
add column if not exists tahun_akademik_id uuid references public.tahun_akademik(id);

-- Update some existing data if necessary (optional)
