import { NextResponse } from "next/server"
import {
  signPayload,
  constantTimeEqual,
  SESSION_COOKIE,
  MAX_ATTEMPTS,
  WINDOW_MS,
  SESSION_MAX_AGE_MS,
  FAILURE_DELAY_MS,
} from "@/utils/loginAuth"
import { getAttempts, recordFailedAttempt, clearAttempts } from "@/utils/mongoDB/loginAttempts"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Every rejection goes through here so a wrong answer, a wrong backup code
// and a lockout response all share the same fixed delay — no path returns a
// "no" faster than another, and guess throughput is capped server-side.
async function reject(bodyObj, status) {
  await sleep(FAILURE_DELAY_MS)
  return NextResponse.json(bodyObj, { status })
}

function setSession(res, secret) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS
  return signPayload(String(expiresAt), secret).then((sessionValue) => {
    res.cookies.set(SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    })
    return res
  })
}

// Verifies the icon-puzzle login. The correct icons and colour order live
// only here (server-side env vars) — the client never receives them; it
// just relays whatever was clicked, the same way a password form relays
// whatever was typed.
//
// Puzzle: pick the target icon, pick a second target from a reshuffled
// grid, then click that second icon's 3 colours in order. step1 checks
// against LOGIN_ICON_KEY, step2 against LOGIN_ICON_KEY_2 (falls back to
// LOGIN_ICON_KEY if unset), the colour order against LOGIN_COLOR_SEQUENCE.
// 16 x 16 x 3! = 1536 combinations.
//
// Lockout: a single GLOBAL counter (see loginAttempts.js). MAX_ATTEMPTS
// well-formed wrong answers in one window locks the whole login until it
// clears — no per-IP tier, so guesses can't be spread across many IPs to
// dodge it. LOGIN_OVERRIDE_SECRET (kept in a password manager) bypasses the
// lockout entirely; it isn't rate-limited because a 32-byte token can't be
// brute-forced through here anyway.
export async function POST(req) {
  try {
    const secret = process.env.LOGIN_COOKIE_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Login not configured" }, { status: 500 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Bad request" }, { status: 400 })
    }

    // -- Backup code, checked first, ahead of the lockout --
    const overrideSecret = process.env.LOGIN_OVERRIDE_SECRET
    if (typeof body.override === "string" && body.override.length > 0) {
      if (overrideSecret && constantTimeEqual(body.override, overrideSecret)) {
        await clearAttempts()
        return setSession(NextResponse.json({ ok: true }), secret)
      }
      // Wrong code — generic "Incorrect.", same as a wrong puzzle answer and
      // the same delay, so probing this field tells an attacker nothing.
      return reject({ ok: false, error: "Incorrect." }, 401)
    }

    // -- Shape check: only a complete, well-formed submission counts as an
    //    attempt. Junk/partial posts 400 without spending one of the 3. --
    const { step1, step2, sequence } = body
    const wellFormed =
      typeof step1 === "string" &&
      typeof step2 === "string" &&
      Array.isArray(sequence) &&
      sequence.length === 3 &&
      sequence.every((s) => typeof s === "string")
    if (!wellFormed) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 })
    }

    // -- Lockout check, before looking at the answer --
    const attempts = await getAttempts()
    const now = Date.now()
    const lockedOut = now - attempts.windowStart < WINDOW_MS && attempts.count >= MAX_ATTEMPTS
    if (lockedOut) {
      const waitMin = Math.ceil((attempts.windowStart + WINDOW_MS - now) / 60000)
      return reject(
        { error: `Too many attempts. Locked for ${waitMin} minute(s) — use a backup code.`, lockedOut: true },
        429
      )
    }

    // -- Check the answer --
    const expectedIcon = process.env.LOGIN_ICON_KEY || ""
    const expectedIcon2 = process.env.LOGIN_ICON_KEY_2 || expectedIcon
    const expectedSequence = (process.env.LOGIN_COLOR_SEQUENCE || "").split(",").filter(Boolean)

    const isCorrect =
      expectedIcon !== "" &&
      expectedSequence.length === 3 &&
      step1 === expectedIcon &&
      step2 === expectedIcon2 &&
      sequence.every((v, i) => v === expectedSequence[i])

    if (isCorrect) {
      await clearAttempts()
      return setSession(NextResponse.json({ ok: true }), secret)
    }

    const next = await recordFailedAttempt(attempts)
    const atLimit = next.count >= MAX_ATTEMPTS
    return reject(
      {
        ok: false,
        error: atLimit ? "Incorrect. Locked — use a backup code." : "Incorrect.",
        lockedOut: atLimit,
      },
      401
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error processing login" }, { status: 500 })
  }
}
