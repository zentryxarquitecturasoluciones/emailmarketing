import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    const supabase = await createClient()

    const { data: existingContact } = await supabase.from("contacts").select("id").eq("email", normalizedEmail).single()

    if (existingContact) {
      await supabase
        .from("contacts")
        .update({
          unsubscribed: true,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", normalizedEmail)
    } else {
      await supabase.from("contacts").insert({
        email: normalizedEmail,
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
