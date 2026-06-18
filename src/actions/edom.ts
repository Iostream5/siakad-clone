"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { edomQuestionnaireSchema, edomResponseSchema } from "@/lib/validations/edom";
import { createAdminClient } from "@/supabase/admin";
import { logActivity } from "@/lib/admin/audit-logger";

export async function createQuestionnaireAction(data: unknown) {
  try {
    const user = await requireAuthorizedUser("edom", ["Admin"]);
    const parsed = edomQuestionnaireSchema.safeParse(data);

    if (!parsed.success) {
      return { error: "Data kuesioner tidak valid. Periksa kembali form Anda." };
    }

    const { tahun_akademik_id, judul, deskripsi, start_date, end_date, is_active, questions } = parsed.data;

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Client error");

    // Insert questionnaire
    const { data: qData, error: qError } = await supabase.from("edom_questionnaires").insert({
      tahun_akademik_id,
      judul,
      deskripsi,
      start_date,
      end_date,
      is_active
    }).select("id").single();

    if (qError || !qData) {
      console.error("Error creating questionnaire:", qError);
      return { error: "Terjadi kesalahan sistem. Permintaan gagal diproses." };
    }

    // Insert questions
    const questionsToInsert = questions.map(q => ({
      questionnaire_id: qData.id,
      kategori: q.kategori,
      pertanyaan: q.pertanyaan,
      tipe: q.tipe,
      urutan: q.urutan,
      is_required: q.is_required
    }));

    const { error: qstError } = await supabase.from("edom_questions").insert(questionsToInsert);
    if (qstError) {
      console.error("Error creating questions:", qstError);
      // Rollback is manual in this context without RPC, but keeping it simple for now
    }

    await logActivity({
      modul: "EDOM",
      aksi: "CREATE",
      tableName: "edom_questionnaires",
      recordId: qData.id,
      newData: { judul, jumlah_pertanyaan: questions.length }
    });

    revalidatePath("/dashboard/edom");
    return { success: true };
  } catch (error) {
    console.error("createQuestionnaireAction error:", error);
    return { error: "Terjadi kesalahan sistem. Permintaan gagal diproses." };
  }
}

export async function submitEdomResponseAction(data: unknown) {
  try {
    const user = await requireAuthorizedUser("edom", ["Mahasiswa"]);
    const parsed = edomResponseSchema.safeParse(data);

    if (!parsed.success) {
      return { error: "Data penilaian tidak valid." };
    }

    const { questionnaire_id, jadwal_id, saran, answers } = parsed.data;

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Client error");

    // Find mahasiswa_id for this user
    const { data: mData, error: mError } = await supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (mError || !mData) {
      return { error: "Akses ditolak. Profil mahasiswa tidak ditemukan." };
    }

    // Check if already submitted
    const { count } = await supabase
      .from("edom_responses")
      .select("id", { count: "exact", head: true })
      .eq("questionnaire_id", questionnaire_id)
      .eq("mahasiswa_id", mData.id)
      .eq("jadwal_id", jadwal_id);

    if (count && count > 0) {
      return { error: "Anda sudah mengisi evaluasi untuk kelas ini." };
    }

    // Insert response
    const { data: rData, error: rError } = await supabase.from("edom_responses").insert({
      questionnaire_id,
      mahasiswa_id: mData.id,
      jadwal_id,
      saran
    }).select("id").single();

    if (rError || !rData) {
      console.error("Error inserting response:", rError);
      return { error: "Terjadi kesalahan saat menyimpan respons evaluasi." };
    }

    // Insert answers
    const answersToInsert = answers.map(a => ({
      response_id: rData.id,
      question_id: a.question_id,
      nilai_rating: a.nilai_rating,
      jawaban_essay: a.jawaban_essay
    }));

    const { error: aError } = await supabase.from("edom_response_answers").insert(answersToInsert);
    if (aError) {
      console.error("Error inserting answers:", aError);
    }

    await logActivity({
      modul: "EDOM",
      aksi: "CREATE",
      tableName: "edom_responses",
      recordId: rData.id,
      newData: { jadwal_id, questionnaire_id }
    });

    revalidatePath("/dashboard/edom");
    return { success: true };
  } catch (error) {
    console.error("submitEdomResponseAction error:", error);
    return { error: "Terjadi kesalahan sistem. Permintaan gagal diproses." };
  }
}
