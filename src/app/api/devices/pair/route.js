import { NextResponse } from "next/server"
import { registerDevice } from "@/utils/mongoDB/pairedDevicesCRUD"
import { signDeviceCookie, DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE_MS } from "@/utils/deviceAuth"

// Reachable only because middleware.ts already requires a valid site
// session cookie for every /api/* route -- by the time this handler runs,
// that gate has already passed. Pairing itself is NOT a second factor on
// top of login (documented, not a hidden caveat): anyone with the login
// credential can pair a device. The real payoff is downstream -- Coder
// mode / content_edit then require this device cookie IN ADDITION to the
// session, so a leaked login credential alone still can't reach them
// without also pairing (an event that fires a notification once the
// Signal gateway platform is linked -- flagged as the safety net here,
// not prevention).
export async function POST(req) {
  const secret = process.env.LOGIN_COOKIE_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Device pairing not configured" }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : "Unnamed device"

  let deviceId, deviceSecret
  try {
    ;({ deviceId, secret: deviceSecret } = await registerDevice(label))
  } catch (err) {
    // Cap-reached is the only expected failure mode (registerDevice throws
    // a plain Error with a user-facing message for it) -- surface as 409,
    // not 500, so the UI can show "revoke a device first" instead of a
    // generic error.
    return NextResponse.json({ error: err.message || "Pairing failed" }, { status: 409 })
  }

  const cookieValue = await signDeviceCookie(deviceId, deviceSecret, secret)
  const res = NextResponse.json({ ok: true, deviceId, label })
  res.cookies.set(DEVICE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE_MS / 1000,
  })
  return res
}
