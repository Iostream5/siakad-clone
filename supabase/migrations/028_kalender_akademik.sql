CREATE TABLE public.kalender_akademik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_akademik_id UUID REFERENCES public.tahun_akademik(id),
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('KRS', 'UTS', 'UAS', 'LIBUR', 'WISUDA', 'LAINNYA')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.kalender_akademik ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active calendar" ON public.kalender_akademik FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert calendar" ON public.kalender_akademik FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Prodi'))
);
CREATE POLICY "Admins can update calendar" ON public.kalender_akademik FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Prodi'))
);
CREATE POLICY "Admins can delete calendar" ON public.kalender_akademik FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Prodi'))
);
