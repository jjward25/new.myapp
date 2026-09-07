import { NextResponse } from "next/server"
import {
  signPayload,
  constantTimeEqual,
  SESSION_COOKIE,
  MAX_ATTEMPTS,
  GLOBAL_MAX_ATTEMPTS,
  WINDOW_MS,
  SESSION_MAX_AGE_MS,
  FAILURE_DELAY_MS,
} from "@/utils/loginAuth"
import { getAttempts, getGlobalAttempts, recordFailedAttempt, clearAttempts } from "@/utils/mongoDB/loginAttempts"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Every rejection goes through here so wrong answers, wrong backup codes and
// lockout responses all share the same fixed delay — no path returns a
// "no" faster than another, and guess throughput is capped server-side.
async function reject(bodyObj, status) {
  await sleep(FAILURE_DELAY_MS)
  return NextResponse.json(bodyObj, { status })
}

// Verifies the icon-puzzle login. The correct icon id and color order live
// only here (server-side env vars) — the client never receives them; it
// just relays whatever the user clicked, the same way a normal password
// form relays whatever was typed.
//
// The puzzle is 3 steps: pick the target icon, pick it again from a
// reshuffled grid, then click the 3 colors in order. Both icon picks are
// checked against the same LOGIN_ICON_KEY (optionally LOGIN_ICON_KEY_2 for
// a different second icon). 16 x 16 x 3! = 1536 combinations.
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
      // Wrong override value — generic "Incorrect." (same as a wrong puzzle
      // answer, same delay) so a wrong override guess doesn't confirm the
      // field exists or behaves specially.
      return reject({ ok: false, error: "Incorrect." }, 401)
    }

    // -- Lockout checks, before even looking at the submitted answer --
    const [attempts, globalAttempts] = await Promise.all([getAttempts(ip), getGlobalAttempts()])
    const now = Date.now()

    const globalWithinWindow = now - globalAttempts.windowStart < WINDOW_MS
    if (globalWithinWindow && globalAttempts.count >= GLOBAL_MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((globalAttempts.windowStart + WINDOW_MS - now) / 1000)
      return reject(
        {
          error: `Too many attempts across all sources. Try again in ${Math.ceil(waitSeconds / 60)} minute(s).`,
          lockedOut: true,
        },
        429
      )
    }

    const withinWindow = now - attempts.windowStart < WINDOW_MS
    if (withinWindow && attempts.count >= MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((attempts.windowStart + WINDOW_MS - now) / 1000)
      return reject(
        {
          error: `Too many attempts. Try again in ${Math.ceil(waitSeconds / 60)} minute(s), or use a backup code.`,
          lockedOut: true,
        },
        429
      )
    }

    // -- Check the answer --
    const { step1, step2, sequence } = body

    const expectedIcon = process.env.LOGIN_ICON_KEY || ""
    // Second icon defaults to the same one — "pick the stoplight twice" —
    // unless LOGIN_ICON_KEY_2 is set to make the two picks different.
    const expectedIcon2 = process.env.LOGIN_ICON_KEY_2 || expectedIcon
    const expectedSequence = (process.env.LOGIN_COLOR_SEQUENCE || "").split(",").filter(Boolean)

    const submittedSequence = Array.isArray(sequence) ? sequence : []
    const isCorrect =
      expectedIcon !== "" &&
      step1 === expectedIcon &&
      step2 === expectedIcon2 &&
      expectedSequence.length > 0 &&
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

    const { next: nextAttempts } = await recordFailedAttempt(ip, attempts, globalAttempts)
    const atLimit = nextAttempts.count >= MAX_ATTEMPTS
    return reject(
      {
        ok: false,
        error: atLimit ? "Incorrect. Too many attempts — use a backup code." : "Incorrect.",
        lockedOut: atLimit,
      },
      401
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error processing login" }, { status: 500 })
  }
}
