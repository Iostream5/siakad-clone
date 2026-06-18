import { z } from "zod";

export const edomQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  kategori: z.string().min(1, "Kategori diperlukan"),
  pertanyaan: z.string().min(1, "Pertanyaan diperlukan"),
  tipe: z.enum(["RATING", "ESSAY"]),
  urutan: z.number().int().nonnegative(),
  is_required: z.boolean().default(true),
});

export const edomQuestionnaireSchema = z.object({
  tahun_akademik_id: z.string().uuid("Tahun Akademik diperlukan"),
  judul: z.string().min(1, "Judul kuesioner diperlukan"),
  deskripsi: z.string().optional(),
  start_date: z.string().min(1, "Tanggal mulai diperlukan"),
  end_date: z.string().min(1, "Tanggal selesai diperlukan"),
  is_active: z.boolean().default(true),
  questions: z.array(edomQuestionSchema).min(1, "Minimal satu pertanyaan diperlukan")
});

export const edomResponseAnswerSchema = z.object({
  question_id: z.string().uuid("ID Pertanyaan tidak valid"),
  nilai_rating: z.number().int().min(1).max(5).optional().nullable(),
  jawaban_essay: z.string().optional().nullable(),
}).refine(data => {
  // Setidaknya salah satu harus ada
  return data.nilai_rating !== undefined || data.jawaban_essay !== undefined;
}, {
  message: "Jawaban harus diisi"
});

export const edomResponseSchema = z.object({
  questionnaire_id: z.string().uuid("Kuesioner tidak valid"),
  jadwal_id: z.string().uuid("Jadwal kuliah tidak valid"),
  saran: z.string().optional(),
  answers: z.array(edomResponseAnswerSchema).min(1, "Jawaban tidak boleh kosong")
});
