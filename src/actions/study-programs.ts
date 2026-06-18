"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteStudyProgram, importStudyProgramsFromCsv, saveStudyProgram } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { withToastParams } from "@/lib/toast-query";
import { logActivity } from "@/lib/admin/audit-logger";
import { studyProgramSchema } from "@/lib/validators";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

export async function saveStudyProgramAction(
  formData: FormData,
) {
  await requireAuthorizedUser("master-data.program-studi");

  const id = formData.get("id")?.toString();
  const rawData = {
    kode: formData.get("kode")?.toString() || "",
    nama: formData.get("nama")?.toString() || "",
    jenjang: formData.get("jenjang")?.toString() || "",
    fakultasId: formData.get("fakultasId")?.toString() || "",
    isAktif: formData.get("isAktif") === "on",
  };

  const validated = studyProgramSchema.safeParse(rawData);

  if (!validated.success) {
    redirect(
      withToastParams("/dashboard/master-data/program-studi", {
        variant: "error",
        title: "Data tidak valid",
        message: validated.error.issues[0]?.message,
      }),
    );
  }

  try {
    await saveStudyProgram(validated.data, id);
    await logActivity({
      modul: "PROGRAM_STUDI",
      aksi: id ? "UPDATE" : "CREATE",
      tableName: "program_studi",
      recordId: id,
      newData: validated.data
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/master-data/program-studi", {
        variant: "error",
        title: "Gagal menyimpan",
        message: getErrorMessage(error),
      }),
    );
  }

  revalidatePath("/dashboard/master-data/program-studi");
  redirect(
    withToastParams("/dashboard/master-data/program-studi", {
      variant: "success",
      title: "Berhasil",
      message: "Data program studi telah diperbarui.",
    }),
  );
}

export async function deleteStudyProgramAction(formData: FormData) {
  await requireAuthorizedUser("master-data.program-studi");
  const id = formData.get("id")?.toString();

  if (!id) {
    redirect(
      withToastParams("/dashboard/master-data/program-studi", {
        variant: "error",
        title: "ID tidak valid",
      }),
    );
  }

  try {
    await deleteStudyProgram(id);
    await logActivity({
      modul: "PROGRAM_STUDI",
      aksi: "DELETE",
      tableName: "program_studi",
      recordId: id,
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/master-data/program-studi", {
        variant: "error",
        title: "Gagal menghapus",
        message: getErrorMessage(error),
      }),
    );
  }

  revalidatePath("/dashboard/master-data/program-studi");
  redirect(
    withToastParams("/dashboard/master-data/program-studi", {
      variant: "success",
      title: "Berhasil dihapus",
    }),
  );
}

export type StudyProgramActionState = {
  success: boolean;
  message: string;
};

const initialState: StudyProgramActionState = {
  success: false,
  message: "",
};

export async function importStudyProgramsAction(
  previousState: StudyProgramActionState = initialState,
  formData: FormData,
): Promise<StudyProgramActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.program-studi");

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      success: false,
      message: "File CSV belum dipilih.",
    };
  }

  try {
    const content = await file.text();
    const result = await importStudyProgramsFromCsv(content);

    revalidatePath("/dashboard/master-data/program-studi");
    revalidatePath("/dashboard/master-data");
    return {
      success: true,
      message: `${result.imported} data program studi berhasil diimport.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengimport program studi.",
    };
  }
}
