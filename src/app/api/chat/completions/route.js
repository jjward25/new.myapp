import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const body = await req.json()
    const { model, text } = body
    const apiKey = req.headers.get("Authorization")?.split("Bearer ")[1]

    if (!apiKey) {
      return NextResponse.json({ error: "API key not provided" }, { status: 401 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. You respond as succinctly as possible. You use precise language and are not verbose. You double and triple-check your sources and give more weight to more reputable sources.",
          },
          { role: "user", content: text },
        ],
      }),
    })

    const data = await response.json()
    console.log("OpenRouter API Response:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error processing request" }, { status: 500 })
  }
}

