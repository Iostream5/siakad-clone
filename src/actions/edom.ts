"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createQuestionnaireAction(formData: FormData) {
  const user = await requireAuthorizedUser("edom", ["Admin"]);
  // Placeholder implementation
  revalidatePath("/dashboard/edom");
}

export async function submitEdomResponseAction(formData: FormData) {
  const user = await requireAuthorizedUser("edom", ["Mahasiswa"]);
  // Placeholder implementation
  revalidatePath("/dashboard/edom");
}
