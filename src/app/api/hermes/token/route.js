import { NextResponse } from "next/server"
import crypto from "crypto"

// Mints a short-lived token for the browser to talk DIRECTLY to Hermes'
// gateway (via the local browser_proxy, over a second Tailscale Funnel port)
// for chat -- bypassing this app's own /api/hermes route entirely, which is
// what was hitting Vercel Hobby's real 60s maxDuration ceiling on any
// tool-using turn that ran long. See 0.Agents/Hermes/ARCHITECTURE.md Key
// Decisions #8 and roadmap.md's "Webapp long-running-turn fix" entry
// (2026-09-08) for the full reasoning.
//
// No session check needed here beyond what already ran: middleware.ts
// already gates every /api/* route on the site-wide login cookie and 401s
// before this handler is ever reached, so reaching this code at all means
// that gate already passed.
//
// This route itself is fast (local HMAC signing, no network call) -- stays
// well inside any timeout regardless of maxDuration.

const TOKEN_TTL_SECONDS = 15 * 60 // 15 minutes -- see roadmap.md for the tradeoff reasoning

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function POST() {
  const secret = process.env.HERMES_PROXY_TOKEN_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Proxy token signing not configured" }, { status: 500 })
  }

  const now = Date.now() / 1000
  const payload = JSON.stringify({ iat: now, exp: now + TOKEN_TTL_SECONDS })
  const payloadB64 = base64url(Buffer.from(payload, "utf8"))
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest()
  const sigB64 = base64url(sig)
  const token = `${payloadB64}.${sigB64}`

  return NextResponse.json({
    token,
    expires_at: Math.floor((now + TOKEN_TTL_SECONDS) * 1000), // ms, for the client's Date.now() comparisons
    // Where the browser should send this token directly -- the second
    // Funnel port, not the normal gateway one (443, master-key-only,
    // server-side use only).
    proxy_url: "https://jdubl.tail072965.ts.net:8443",
  })
}
