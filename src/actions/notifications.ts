"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { markNotificationRead } from "@/lib/admin/notifications";
import { withToastParams } from "@/lib/toast-query";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = `${formData.get("id") ?? ""}`.trim();
  const redirectTo = `${formData.get("redirectTo") ?? ""}`.trim() || "/dashboard";

  if (!id) {
    redirect(
      withToastParams(redirectTo, {
        variant: "error",
        title: "Notifikasi tidak valid",
      }),
    );
  }

  try {
    await markNotificationRead(id, user.id);
    revalidatePath("/dashboard", "layout");
    redirect(redirectTo);
  } catch (error) {
    redirect(
      withToastParams(redirectTo, {
        variant: "error",
        title: "Gagal menandai notifikasi",
        message: error instanceof Error ? error.message : "Coba ulangi sebentar lagi.",
      }),
    );
  }
}
