import { NextRequest, NextResponse } from "next/server";
import { verifySignedValue, SESSION_COOKIE } from "@/utils/loginAuth";

// Site-wide gate: this app shows real personal data (calendar, tasks,
// workouts, journal) and a chat widget that reaches the live Hermes agent.
// Originally HTTP Basic Auth; replaced 2026-09-07 with a custom icon-puzzle
// login (see /login, /api/login) per direction — one strong gate is enough
// for a personal single-user app, no separate per-feature gate needed.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page and its API must stay reachable, or nobody could ever
  // log in.
  if (pathname === "/login" || pathname === "/api/login") {
    return NextResponse.next();
  }

  const secret = process.env.LOGIN_COOKIE_SECRET;
  // Fail open only if genuinely unconfigured (fresh local clone, no
  // .env.local yet) — never silently pretend to be protected.
  if (!secret) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = sessionCookie ? await verifySignedValue(sessionCookie, secret) : null;
  const expiresAt = payload ? Number(payload) : 0;
  const isValid = Number.isFinite(expiresAt) && expiresAt > Date.now();

  if (isValid) {
    return NextResponse.next();
  }

  // API routes can't be redirected to an HTML login page — a fetch() caller
  // needs a real error status, not a login page as its "response".
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
