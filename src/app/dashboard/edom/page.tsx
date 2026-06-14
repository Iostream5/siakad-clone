import { requireAuthorizedUser } from "@/lib/auth";
import { getActiveQuestionnaires } from "@/lib/admin/edom";
import { EdomManager } from "@/modules/edom/edom-manager";
import { EdomForm } from "@/modules/edom/edom-form";
import { EdomResults } from "@/modules/edom/edom-results";

export default async function EdomPage() {
  const user = await requireAuthorizedUser("edom");
  const questionnaires = await getActiveQuestionnaires();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Evaluasi Dosen Oleh Mahasiswa</h1>
        <p className="text-sm text-slate-500 font-medium">Modul kuesioner dan penilaian kinerja dosen oleh mahasiswa (EDOM).</p>
      </div>

      {user.role === "Admin" && (
         <div className="space-y-6">
            <EdomManager questionnaires={questionnaires} />
            <EdomResults />
         </div>
      )}

      {user.role === "Mahasiswa" && (
         <EdomForm />
      )}

      {user.role === "Dosen" && (
         <EdomResults />
      )}
    </div>
  );
}
