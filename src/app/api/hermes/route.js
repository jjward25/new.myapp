import { NextResponse } from "next/server"

// 60s is this project's REAL hard ceiling on Hobby -- confirmed directly
// from Vercel's own deploy-time error, not from docs: "Serverless Functions
// must have a maxDuration between 1 and 60 for plan hobby." (a first
// attempt at 300, based on Vercel's current default-Hobby-tier docs, was
// rejected outright -- this project doesn't have Fluid Compute active,
// which is what that higher number assumes). Real, unresolved gap: a
// genuine tool-using turn ("check my open linear tasks") measured at 83s
// against the actual backend -- longer than even this real ceiling. This
// value is still an improvement (was unset before), but does not fully
// solve the timeout problem by itself; see roadmap's webapp
// trigger-and-poll entry.
export const maxDuration = 60;

// Talks to the Hermes agent gateway over Tailscale Funnel. The gateway key
// lives only in server-side env vars (HERMES_GATEWAY_URL/HERMES_GATEWAY_KEY) —
// never sent to the browser, unlike the OpenRouter route which takes a
// client-supplied key.
//
// Streams the response through as Server-Sent Events. The gateway's own
// per-turn latency (a local reasoning model, no cloud fallback) runs 60-170s+
// for a single blocking response — streaming doesn't change that total, but
// lets the webapp render tokens as they arrive instead of showing a silent
// spinner for the whole turn.
export async function POST(req) {
  try {
    // Relies solely on the site-wide gate in middleware.ts (2026-09-07
    // decision: one strong gate is sufficient for a personal single-user
    // app — a separate per-route secret was tried and then deliberately
    // dropped for simplicity).
    const body = await req.json()
    const { messages, systemPrompt } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 })
    }

    const gatewayUrl = process.env.HERMES_GATEWAY_URL
    const gatewayKey = process.env.HERMES_GATEWAY_KEY

    if (!gatewayUrl || !gatewayKey) {
      return NextResponse.json({ error: "Hermes gateway not configured" }, { status: 500 })
    }

    // Optional ephemeral system prompt (e.g. language-tutor instructions),
    // layered on top of Hermes' own persona by the gateway itself — not a
    // replacement for it.
    const outgoingMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages

    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "hermes-agent",
        messages: outgoingMessages,
        stream: true,
      }),
    })

    // Auth/config/gateway-down errors come back as plain JSON (not a stream)
    // from the gateway itself — relay them the same way, not as an SSE body.
    if (!response.ok || !response.body) {
      let data
      try {
        data = await response.json()
      } catch {
        data = null
      }
      console.error("Hermes gateway error:", response.status, data)
      return NextResponse.json(
        { error: data?.error?.message || data?.error || "Hermes gateway error" },
        { status: response.status || 502 }
      )
    }

    // Pass the gateway's SSE stream straight through to the browser.
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error processing request" }, { status: 500 })
  }
}
