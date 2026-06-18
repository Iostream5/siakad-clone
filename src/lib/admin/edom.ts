import { createAdminClient } from "@/supabase/admin";

export async function getActiveQuestionnaires() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("edom_questionnaires")
    .select(`
      id, judul, deskripsi, start_date, end_date, is_active,
      tahun_akademik:tahun_akademik_id(nama, is_active),
      edom_questions(id, kategori, pertanyaan, tipe, urutan, is_required)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching questionnaires:", error);
    return [];
  }
  return data;
}

export async function getEdomResults(dosenId?: string, jadwalId?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase.from("edom_responses").select(`
    id,
    saran,
    jadwal_kuliah!inner(
      id,
      kelas!inner(nama_kelas),
      mata_kuliah!inner(nama, kode),
      dosen!inner(id, users!inner(full_name))
    ),
    edom_response_answers(
      nilai_rating,
      jawaban_essay,
      edom_questions(pertanyaan, kategori, tipe)
    )
  `);

  if (dosenId) {
    query = query.eq("jadwal_kuliah.dosen_id", dosenId);
  }
  if (jadwalId) {
    query = query.eq("jadwal_id", jadwalId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching EDOM results:", error);
    return [];
  }

  return data;
}

export async function getStudentEdomEligibility(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  // First, get student profile
  const { data: mData } = await supabase
    .from("mahasiswa")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!mData) return [];

  // Get current active academic year
  const { data: taData } = await supabase
    .from("tahun_akademik")
    .select("id")
    .eq("is_aktif", true)
    .single();

  if (!taData) return [];

  // Get active questionnaires
  const { data: qData } = await supabase
    .from("edom_questionnaires")
    .select("id, judul, deskripsi, start_date, end_date")
    .eq("tahun_akademik_id", taData.id)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (!qData || qData.length === 0) return [];

  // Get KRS (Enrolled classes) for this student in the active academic year
  const { data: krsData } = await supabase
    .from("krs_headers")
    .select(`
      id,
      krs_details!inner(
        jadwal_id,
        jadwal_kuliah!inner(
          id,
          kelas!inner(nama_kelas),
          mata_kuliah!inner(nama, kode),
          dosen!inner(users!inner(full_name))
        )
      )
    `)
    .eq("mahasiswa_id", mData.id)
    .eq("tahun_akademik_id", taData.id)
    .eq("status", "Disetujui");

  if (!krsData || krsData.length === 0) return [];

  // Get already submitted responses
  const { data: rData } = await supabase
    .from("edom_responses")
    .select("questionnaire_id, jadwal_id")
    .eq("mahasiswa_id", mData.id);

  const submittedSet = new Set((rData || []).map(r => `${r.questionnaire_id}_${r.jadwal_id}`));

  // Construct eligibility list
  const eligibleClasses: any[] = [];

  // For simplicity, link every active questionnaire to every approved class
  // Typically, EDOM is bound per academic year
  const krsDetails = krsData.flatMap(h => h.krs_details);

  for (const q of qData) {
    for (const detail of krsDetails) {
      // Handle Supabase type inference which can sometimes type array or single object
      const jadwalArray = Array.isArray(detail.jadwal_kuliah) ? detail.jadwal_kuliah : [detail.jadwal_kuliah];

      for (const jadwal of jadwalArray) {
        if (!jadwal) continue;

        const isSubmitted = submittedSet.has(`${q.id}_${jadwal.id}`);

        // Handle array typing from inner joins
        const dosen = Array.isArray(jadwal.dosen) ? jadwal.dosen[0] : jadwal.dosen;
        if (!dosen) continue;

        const mata_kuliah = Array.isArray(jadwal.mata_kuliah) ? jadwal.mata_kuliah[0] : jadwal.mata_kuliah;
        const kelas = Array.isArray(jadwal.kelas) ? jadwal.kelas[0] : jadwal.kelas;
        const users = dosen ? (Array.isArray(dosen.users) ? dosen.users[0] : dosen.users) : null;

        eligibleClasses.push({
          questionnaire: q,
          jadwalId: jadwal.id,
          mataKuliah: mata_kuliah?.nama,
          kodeMk: mata_kuliah?.kode,
          kelas: kelas?.nama_kelas,
          dosen: users?.full_name,
          isSubmitted
        });
      }
    }
  }

  return eligibleClasses;
}
