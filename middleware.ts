import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  response.headers.set("x-pathname", pathname);

  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path));
  const sessionCookie = request.cookies.get("siakad_session")?.value;
  let hasSession = false;

  if (sessionCookie) {
    if (sessionCookie.startsWith("v1.")) {
      hasSession = true;
    } else {
      try {
        const parsed = JSON.parse(sessionCookie) as { id?: string; role?: string };
        hasSession = Boolean(parsed?.id && parsed?.role);
      } catch {
        hasSession = false;
      }
    }
  }

  if (requiresAuth && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
