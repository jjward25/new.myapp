import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    // Read the request body as text
    const body = await req.text()
    console.log("Received body:", body)

    // Check if the body is not empty before parsing
    const jsonBody = body ? JSON.parse(body) : {}
    const code = jsonBody.code

    if (code) {
      // Exchange the code for a token
      const response = await fetch("https://openrouter.ai/api/v1/auth/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Code not provided" }, { status: 400 })
    }
  } catch (error) {
    console.error("OAuth error:", error)
    return NextResponse.json({ error: error.message || "An error occurred during OAuth" }, { status: 500 })
  }
}

