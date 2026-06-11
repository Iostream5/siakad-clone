import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

import { getUserAccessContext } from "@/lib/admin/access-control";
import { demoUsers, roles } from "@/lib/constants";
import { createAdminClient } from "@/supabase/admin";
import type { SessionUser, UserRole } from "@/types/domain";

const COOKIE_NAME = "siakad_session";
const SESSION_COOKIE_VERSION = "v1";

function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

function signSessionPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string, secret: string) {
  const expected = signSessionPayload(payload, secret);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function encodeSessionCookie(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(normalizeSessionUser(user))).toString("base64url");
  const secret = getSessionSecret();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET atau SUPABASE_SERVICE_ROLE_KEY wajib tersedia untuk sesi production.");
    }

    return JSON.stringify(normalizeSessionUser(user));
  }

  return `${SESSION_COOKIE_VERSION}.${payload}.${signSessionPayload(payload, secret)}`;
}

function decodeSessionCookie(raw: string): SessionUser | null {
  const [version, payload, signature] = raw.split(".");

  if (version === SESSION_COOKIE_VERSION && payload && signature) {
    const secret = getSessionSecret();

    if (!secret || !verifySignature(payload, signature, secret)) {
      return null;
    }

    try {
      return normalizeSessionUser(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser);
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  try {
    return normalizeSessionUser(JSON.parse(raw) as SessionUser);
  } catch {
    return null;
  }
}

function normalizeSessionUser(user: SessionUser): SessionUser {
  const availableRoles = Array.isArray(user.availableRoles) && user.availableRoles.length > 0
    ? user.availableRoles
    : [user.role];

  return {
    ...user,
    availableRoles,
  };
}

async function buildSessionUserFromDatabase(userId: string, preferredRole?: UserRole | null): Promise<SessionUser | null> {
  const supabase = createAdminClient();

  if (!supabase) {
    return null;
  }

  // Fetch basic user profile
  const result = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!result.data || result.data.is_active === false) {
    return null;
  }

  // Fetch assigned roles
  const roleResult = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const dbRoles = (roleResult.data || []).map(r => r.role as UserRole);
  const baseRole = result.data.role as UserRole;
  
  // Ensure baseRole is included and unique
  const availableRoles = Array.from(new Set([baseRole, ...dbRoles]))
    .filter(r => roles.includes(r));

  const resolvedRole = preferredRole && availableRoles.includes(preferredRole)
    ? preferredRole
    : availableRoles.includes(baseRole)
      ? baseRole
      : availableRoles[0];

  return {
    id: result.data.id,
    name: result.data.full_name,
    identifier: result.data.email,
    role: resolvedRole,
    availableRoles,
    email: result.data.email,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;

  if (!raw) return null;

  return decodeSessionCookie(raw);
}

export async function getResolvedSessionUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;

  return await buildSessionUserFromDatabase(user.id, user.role) || normalizeSessionUser(user);
}

export async function requireUser(allowedRoles?: UserRole[]) {
  const user = await getResolvedSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireAuthorizedUser(menuKey: string, allowedRoles?: UserRole[]) {
  const user = await requireUser();
  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes(menuKey)) {
    redirect("/dashboard");
  }

  if (allowedRoles && !allowedRoles.includes(access.resolvedRole)) {
    redirect("/dashboard");
  }

  return {
    ...user,
    role: access.resolvedRole,
  };
}

export async function getUserByCredential(identifier: string, password: string) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const normalized = identifier.trim().toLowerCase();

  return (
    Object.values(demoUsers).find(
      (user) =>
        (user.identifier === normalized || user.email === normalized) &&
        user.password === password,
    ) ?? null
  );
}

export { COOKIE_NAME };
export { buildSessionUserFromDatabase };
