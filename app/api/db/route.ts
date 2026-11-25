import { NextResponse } from "next/server"
import { executeOperation } from "@/lib/db/executor"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ data: null, error: { message: "Invalid request body" }, count: null }, { status: 400 })
    }
    const result = await executeOperation(body as any)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ data: null, error: { message }, count: null }, { status: 500 })
  }
}
