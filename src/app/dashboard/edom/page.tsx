import { requireAuthorizedUser } from "@/lib/auth";
import { getActiveQuestionnaires, getStudentEdomEligibility, getEdomResults } from "@/lib/admin/edom";
import { EdomManager } from "@/modules/edom/edom-manager";
import { EdomForm } from "@/modules/edom/edom-form";
import { EdomResults } from "@/modules/edom/edom-results";
import { createAdminClient } from "@/supabase/admin";

export default async function EdomPage() {
  const user = await requireAuthorizedUser("edom");

  let questionnaires: any[] = [];
  let eligibleClasses: any[] = [];
  let results: any[] = [];

  if (user.role === "Admin" || user.role === "Prodi") {
     questionnaires = await getActiveQuestionnaires();
     results = await getEdomResults();
  }

  if (user.role === "Mahasiswa") {
     eligibleClasses = await getStudentEdomEligibility(user.id);
  }

  if (user.role === "Dosen") {
     const supabase = createAdminClient();
     if (supabase) {
        const { data: dData } = await supabase.from("dosen").select("id").eq("user_id", user.id).single();
        if (dData) {
           results = await getEdomResults(dData.id);
        }
     }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Evaluasi Dosen Oleh Mahasiswa</h1>
        <p className="text-sm text-slate-500 font-medium">Modul kuesioner dan penilaian kinerja dosen oleh mahasiswa (EDOM).</p>
      </div>

      {(user.role === "Admin" || user.role === "Prodi") && (
         <div className="space-y-6">
            <EdomManager questionnaires={questionnaires} />
            <EdomResults results={results} />
         </div>
      )}

      {user.role === "Mahasiswa" && (
         <EdomForm eligibleClasses={eligibleClasses} />
      )}

      {user.role === "Dosen" && (
         <EdomResults results={results} />
      )}
    </div>
  );
}
