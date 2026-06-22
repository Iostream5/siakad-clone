import "server-only";

import { createAdminClient } from "@/supabase/admin";

type RelationOne<T> = T | T[] | null;
type RelationMany<T> = T[] | null;

type EdomQuestionnaireQueryRow = {
  id: string;
  judul: string;
  deskripsi: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  tahun_akademik?: RelationOne<{ nama: string; is_aktif: boolean }>;
  edom_questions?: RelationMany<{
    id: string;
    kategori: string | null;
    pertanyaan: string | null;
    tipe: string | null;
    urutan: number | null;
    is_required: boolean | null;
  }>;
};

type KrsQueryRow = {
  id: string;
  krs_detail?: RelationMany<{
    id_jadwal: string;
    jadwal?: RelationOne<{
      id: string;
      nama_kelas: string;
      mata_kuliah?: RelationOne<{ nama: string; kode: string }>;
      dosen?: RelationOne<{ id: string; users?: RelationOne<{ full_name: string }> }>;
    }>;
  }>;
};

type EdomResultQueryRow = {
  id: string;
  average_score: number | string;
  saran: string | null;
  comment: string | null;
  jadwal?: RelationOne<{
    id: string;
    nama_kelas: string;
    mata_kuliah?: RelationOne<{ nama: string; kode: string }>;
    dosen?: RelationOne<{ id: string; users?: RelationOne<{ full_name: string }> }>;
  }>;
  edom_response_answers?: RelationMany<{
    nilai_rating: number | null;
    score: number | null;
    jawaban_essay: string | null;
    question?: RelationOne<{
      pertanyaan: string | null;
      kategori: string | null;
      tipe: string | null;
      question_text: string | null;
      category: string | null;
    }>;
  }>;
};

function firstRelation<T>(value: RelationOne<T>) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function relationList<T>(value: RelationMany<T> | T | null | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function getActiveQuestionnaires() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("edom_questionnaires")
    .select(`
      id, judul, deskripsi, start_date, end_date, is_active,
      tahun_akademik:tahun_akademik_id(nama, is_aktif),
      edom_questions(id, kategori, pertanyaan, tipe, urutan, is_required)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching questionnaires:", error);
    return [];
  }

  return (data ?? []) as EdomQuestionnaireQueryRow[];
}

export async function getEdomResults(dosenId?: string, jadwalId?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase.from("edom_responses").select(`
    id,
    average_score,
    saran,
    comment,
    jadwal:jadwal_id(
      id,
      nama_kelas,
      mata_kuliah:mata_kuliah_id(nama, kode),
      dosen:dosen_id(id, users:user_id(full_name))
    ),
    edom_response_answers(
      nilai_rating,
      score,
      jawaban_essay,
      question:question_id(pertanyaan, kategori, tipe, question_text, category)
    )
  `);

  if (dosenId) query = query.eq("dosen_id", dosenId);
  if (jadwalId) query = query.eq("jadwal_id", jadwalId);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching EDOM results:", error);
    return [];
  }

  return ((data ?? []) as EdomResultQueryRow[]).map((item) => {
    const jadwal = firstRelation(item.jadwal);
    const dosen = firstRelation(jadwal?.dosen ?? null);
    const user = firstRelation(dosen?.users ?? null);
    const mataKuliah = firstRelation(jadwal?.mata_kuliah ?? null);

    return {
      id: item.id,
      average_score: item.average_score,
      saran: item.saran ?? item.comment,
      jadwal_kuliah: {
        id: jadwal?.id,
        kelas: { nama_kelas: jadwal?.nama_kelas },
        mata_kuliah: { nama: mataKuliah?.nama, kode: mataKuliah?.kode },
        dosen: {
          id: dosen?.id,
          users: { full_name: user?.full_name ?? "Dosen" },
        },
      },
      edom_response_answers: relationList(item.edom_response_answers).map((answer) => {
        const question = firstRelation(answer.question ?? null);
        return {
          nilai_rating: answer.nilai_rating ?? answer.score,
          jawaban_essay: answer.jawaban_essay,
          edom_questions: {
            pertanyaan: question?.pertanyaan ?? question?.question_text,
            kategori: question?.kategori ?? question?.category,
            tipe: question?.tipe,
          },
        };
      }),
    };
  });
}

export async function getStudentEdomEligibility(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: mahasiswa } = await supabase
    .from("mahasiswa")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!mahasiswa?.id) return [];

  const { data: tahunAkademik } = await supabase
    .from("tahun_akademik")
    .select("id")
    .eq("is_aktif", true)
    .maybeSingle();

  if (!tahunAkademik?.id) return [];

  const now = new Date().toISOString();
  const { data: questionnaires } = await supabase
    .from("edom_questionnaires")
    .select("id, judul, deskripsi, start_date, end_date")
    .eq("tahun_akademik_id", tahunAkademik.id)
    .eq("is_active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .is("deleted_at", null);

  if (!questionnaires || questionnaires.length === 0) return [];

  const { data: krsRows } = await supabase
    .from("krs_header")
    .select(`
      id,
      krs_detail!inner(
        id_jadwal,
        jadwal:id_jadwal(
          id,
          nama_kelas,
          mata_kuliah:mata_kuliah_id(nama, kode),
          dosen:dosen_id(id, users:user_id(full_name))
        )
      )
    `)
    .eq("id_mahasiswa", mahasiswa.id)
    .eq("id_tahun_akademik", tahunAkademik.id)
    .eq("status", "Disetujui");

  if (!krsRows || krsRows.length === 0) return [];

  const { data: responses } = await supabase
    .from("edom_responses")
    .select("questionnaire_id, jadwal_id")
    .eq("mahasiswa_id", mahasiswa.id);

  const submittedSet = new Set((responses ?? []).map((response) => `${response.questionnaire_id}_${response.jadwal_id}`));
  const details = ((krsRows ?? []) as KrsQueryRow[]).flatMap((header) => relationList(header.krs_detail));

  return questionnaires.flatMap((questionnaire) =>
    details.flatMap((detail) => {
      const jadwal = firstRelation(detail.jadwal ?? null);
      if (!jadwal) return [];

      const dosen = firstRelation(jadwal.dosen ?? null);
      const user = firstRelation(dosen?.users ?? null);
      const mataKuliah = firstRelation(jadwal.mata_kuliah ?? null);

      return [{
        questionnaire,
        jadwalId: jadwal.id,
        mataKuliah: mataKuliah?.nama ?? "-",
        kodeMk: mataKuliah?.kode ?? "-",
        kelas: jadwal.nama_kelas,
        dosen: user?.full_name ?? "Dosen",
        isSubmitted: submittedSet.has(`${questionnaire.id}_${jadwal.id}`),
      }];
    }),
  );
}
