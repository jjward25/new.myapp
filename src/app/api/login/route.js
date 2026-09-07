import { NextResponse } from "next/server"
import {
  signPayload,
  constantTimeEqual,
  SESSION_COOKIE,
  MAX_ATTEMPTS,
  GLOBAL_MAX_ATTEMPTS,
  WINDOW_MS,
  SESSION_MAX_AGE_MS,
} from "@/utils/loginAuth"
import { getAttempts, getGlobalAttempts, recordFailedAttempt, clearAttempts } from "@/utils/mongoDB/loginAttempts"

// Verifies the icon-puzzle login. The correct icon id and color order live
// only here (server-side env vars) — the client never receives them; it
// just relays whatever the user clicked, the same way a normal password
// form relays whatever was typed.
//
// Two independent lockouts, not one: per-IP (MAX_ATTEMPTS) stops one
// source hammering the puzzle; global (GLOBAL_MAX_ATTEMPTS) stops an
// attacker spreading guesses across many real IPs, which per-IP tracking
// alone can't catch (see loginAttempts.js for why). Both are tracked
// server-side in Mongo, keyed by IP/a fixed global id — not in a cookie, a
// first version of which was found live to be trivially bypassable by
// simply not sending the cookie back.
//
// A separate, independent override secret (LOGIN_OVERRIDE_SECRET) bypasses
// both lockouts entirely — the answer to "how do I get back in if the
// global breaker trips on me too." It isn't subject to either lockout
// because its own entropy (a 32-byte random token) makes brute-forcing it
// through this endpoint practically meaningless regardless.
function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}

export async function POST(req) {
  try {
    const secret = process.env.LOGIN_COOKIE_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Login not configured" }, { status: 500 })
    }

    const ip = getClientIp(req)
    const body = await req.json()

    // -- Override backdoor, checked first, ahead of any lockout --
    const overrideSecret = process.env.LOGIN_OVERRIDE_SECRET
    if (overrideSecret && typeof body.override === "string" && body.override.length > 0) {
      if (constantTimeEqual(body.override, overrideSecret)) {
        await clearAttempts(ip)
        const expiresAt = Date.now() + SESSION_MAX_AGE_MS
        const sessionValue = await signPayload(String(expiresAt), secret)
        const res = NextResponse.json({ ok: true })
        res.cookies.set(SESSION_COOKIE, sessionValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE_MS / 1000,
        })
        return res
      }
      // Wrong override value — fall through to the generic "Incorrect."
      // response below rather than a distinct error, so a wrong override
      // guess doesn't confirm the field exists/behaves specially.
      return NextResponse.json({ ok: false, error: "Incorrect." }, { status: 401 })
    }

    // -- Lockout checks, before even looking at the submitted answer --
    const [attempts, globalAttempts] = await Promise.all([getAttempts(ip), getGlobalAttempts()])
    const now = Date.now()

    const globalWithinWindow = now - globalAttempts.windowStart < WINDOW_MS
    if (globalWithinWindow && globalAttempts.count >= GLOBAL_MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((globalAttempts.windowStart + WINDOW_MS - now) / 1000)
      return NextResponse.json(
        { error: `Too many attempts across all sources. Try again in ${Math.ceil(waitSeconds / 60)} minute(s).` },
        { status: 429 }
      )
    }

    const withinWindow = now - attempts.windowStart < WINDOW_MS
    if (withinWindow && attempts.count >= MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((attempts.windowStart + WINDOW_MS - now) / 1000)
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(waitSeconds / 60)} minute(s).` },
        { status: 429 }
      )
    }

    // -- Check the answer --
    const { step1, sequence } = body

    const expectedIcon = process.env.LOGIN_ICON_KEY || ""
    const expectedSequence = (process.env.LOGIN_COLOR_SEQUENCE || "").split(",").filter(Boolean)

    const submittedSequence = Array.isArray(sequence) ? sequence : []
    const isCorrect =
      step1 === expectedIcon &&
      submittedSequence.length === expectedSequence.length &&
      submittedSequence.every((v, i) => v === expectedSequence[i])

    if (isCorrect) {
      await clearAttempts(ip)
      const expiresAt = now + SESSION_MAX_AGE_MS
      const sessionValue = await signPayload(String(expiresAt), secret)
      const res = NextResponse.json({ ok: true })
      res.cookies.set(SESSION_COOKIE, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_MS / 1000,
      })
      return res
    }

    await recordFailedAttempt(ip, attempts, globalAttempts)
    return NextResponse.json({ ok: false, error: "Incorrect." }, { status: 401 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error processing login" }, { status: 500 })
  }
}
