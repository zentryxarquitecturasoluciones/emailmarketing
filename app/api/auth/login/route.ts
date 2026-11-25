import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { AUTH_SESSION_MAX_AGE_SECONDS, createAuthToken } from "@/lib/auth"

function getExpectedPassword(): string {
  return process.env.DASHBOARD_PASSWORD || ""
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const expected = getExpectedPassword()

    if (!expected) {
      return NextResponse.json(
        { error: "DASHBOARD_PASSWORD is not configured on the server." },
        { status: 500 },
      )
    }

    if (password === expected) {
      const cookieStore = await cookies()
      const token = await createAuthToken(expected, Date.now() + AUTH_SESSION_MAX_AGE_SECONDS * 1000)
      cookieStore.set("zentryx-auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
        path: "/",
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
