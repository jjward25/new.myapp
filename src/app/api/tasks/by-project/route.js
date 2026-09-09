import { NextResponse } from "next/server"

// Server-side call to the gateway (not the browser-direct proxy) -- same
// pattern as the original /api/hermes route, using the server-only
// HERMES_GATEWAY_KEY. Safe here specifically because this is a single,
// small, non-streaming turn using the now-fixed grouped linear_list_tasks
// tool (see 0.Agents/Hermes/plugins/linear/tools.py -- pre-groups by
// project server-side, 7.7x smaller payload, no more multi-project
// confusion/truncation), so it reliably finishes well inside Vercel's 60s
// ceiling instead of needing the direct-streaming path.
export const maxDuration = 60

export async function POST() {
  try {
    const gatewayUrl = process.env.HERMES_GATEWAY_URL
    const gatewayKey = process.env.HERMES_GATEWAY_KEY
    if (!gatewayUrl || !gatewayKey) {
      return NextResponse.json({ error: "Hermes gateway not configured" }, { status: 500 })
    }

    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "hermes-agent",
        stream: false,
        messages: [
          {
            role: "user",
            content:
              "Call linear_list_tasks directly (one tool call), then reply with ONLY the raw JSON it returned -- no summary, no markdown, no extra text.",
          },
        ],
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return NextResponse.json(
        { error: data?.error?.message || data?.error || "Hermes gateway error" },
        { status: response.status || 502 }
      )
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || ""

    // The model replies with the tool's raw JSON as text -- parse it back
    // into a real object rather than passing a string through to the client.
    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      return NextResponse.json({ error: "Could not parse tasks response", raw: content }, { status: 502 })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error fetching tasks" }, { status: 500 })
  }
}
