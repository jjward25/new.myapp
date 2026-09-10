import { NextResponse } from "next/server"
import { getOpenTasksByProject } from "../../../../utils/linear/client"

// Direct Linear GraphQL read -- replaced the earlier gateway/chat-relay
// version 2026-09-09. That version routed a simple structured-data read
// through Hermes' agent loop (asking the model to call linear_list_tasks and
// repeat the JSON back as text), which was slower, laptop-dependent, and
// relied on the model faithfully relaying JSON without drift. This is just
// a fast, direct API call -- no LLM, no gateway, no local machine involved.
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const projects = await getOpenTasksByProject()
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching Linear tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}
