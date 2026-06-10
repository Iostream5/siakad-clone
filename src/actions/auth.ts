"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_NAME, buildSessionUserFromDatabase, encodeSessionCookie, getResolvedSessionUser, getUserByCredential } from "@/lib/auth";
import { getDefaultRolePath } from "@/lib/navigation";
import { withToastParams } from "@/lib/toast-query";
import { loginSchema } from "@/lib/validators";
import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { UserRole } from "@/types/domain";

export type LoginActionState = {
  error: string | null;
};

function toNetworkLoginMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("REQUEST_TIMEOUT")) {
    return "Koneksi ke server auth lambat. Coba lagi.";
  }
  if (message.includes("ENOTFOUND") || message.includes("fetch failed")) {
    return "Host Supabase tidak dapat dijangkau (DNS/network). Periksa koneksi dan env.";
  }
  return "Login gagal karena kendala jaringan.";
}

async function logAuthEvent(params: {
  adminAvailable: ReturnType<typeof createAdminClient>;
  identifier: string;
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED";
  message: string;
  userId?: string | null;
}) {
  const { adminAvailable, identifier, action, message, userId } = params;
  if (!adminAvailable) {
    return;
  }

  await adminAvailable.from("audit_logs").insert({
    id_user: userId ?? null,
    modul: "auth",
    aksi: action,
    table_name: "users",
    old_data: null,
    new_data: {
      identifier,
      message,
    },
  });
}

export async function loginAction(_: LoginActionState, formData: FormData) {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { identifier, password } = parsed.data;
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const supabase = await createClient();
  const admin = createAdminClient();
  let sessionUser = null;
  let loginError: string | null = null;
  let shouldTryDemoFallback = true;
  const isEmailIdentifier = normalizedIdentifier.includes("@");

  if (supabase) {
    try {
      let loginEmail = isEmailIdentifier ? normalizedIdentifier : null;

      // 1. Resolve email if identifier is a username
      if (!isEmailIdentifier && admin) {
        const lookup = await admin
          .from("users")
          .select("email, is_active, deleted_at")
          .eq("username", normalizedIdentifier)
          .maybeSingle();

        if (lookup.data) {
          if (lookup.data.deleted_at) return { error: "Akun sudah dinonaktifkan." };
          if (!lookup.data.is_active) return { error: "Akun nonaktif. Hubungi admin." };
          loginEmail = lookup.data.email;
          shouldTryDemoFallback = false;
        }
      }

      // 2. Perform authentication
      if (loginEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (error) {
          loginError = "Kredensial tidak valid atau akun belum diverifikasi.";
        } else if (data.user) {
          sessionUser = await buildSessionUserFromDatabase(data.user.id);
          shouldTryDemoFallback = false;
        }
      }
    } catch (error) {
      loginError = toNetworkLoginMessage(error);
    }
  }

  // 3. Demo Fallback
  if (!sessionUser && shouldTryDemoFallback) {
    sessionUser = await getUserByCredential(normalizedIdentifier, password);
  }

  if (!sessionUser) {
    void logAuthEvent({
      adminAvailable: admin,
      identifier: normalizedIdentifier,
      action: "LOGIN_FAILED",
      message: loginError ?? "Login gagal.",
    });
    return { error: loginError ?? "Login gagal. Periksa kredensial Anda." };
  }

  // 4. Success handling
  void logAuthEvent({
    adminAvailable: admin,
    identifier: normalizedIdentifier,
    action: "LOGIN_SUCCESS",
    message: `Login berhasil sebagai ${sessionUser.role}.`,
    userId: sessionUser.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSessionCookie(sessionUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect(getDefaultRolePath(sessionUser.role));
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect(
    withToastParams("/login", {
      variant: "info",
      title: "Anda sudah keluar",
      message: "Sesi login berhasil diakhiri.",
    }),
  );
}

export async function switchActiveRoleAction(formData: FormData) {
  const requestedRole = `${formData.get("role") ?? ""}`.trim() as UserRole;
  const redirectTo = `${formData.get("redirectTo") ?? ""}`.trim();
  const sessionUser = await getResolvedSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (!sessionUser.availableRoles.includes(requestedRole)) {
    redirect(
      withToastParams(redirectTo || getDefaultRolePath(sessionUser.role), {
        variant: "error",
        title: "Role tidak tersedia",
        message: "Role yang dipilih tidak dimiliki oleh akun ini.",
      }),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_NAME,
    encodeSessionCookie({
      ...sessionUser,
      role: requestedRole,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  );

  redirect(
    withToastParams(redirectTo || getDefaultRolePath(requestedRole), {
      variant: "success",
      title: "Role aktif diperbarui",
      message: `Workspace sekarang memakai role ${requestedRole}.`,
    }),
  );
}
