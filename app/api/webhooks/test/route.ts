import { createClient } from "@/lib/db/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const hasDatabaseUrl = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING)

    if (!hasDatabaseUrl) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        hasDatabaseUrl,
      })
    }

    const supabase = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: campaigns, error: campaignsError } = await supabase.from("campaigns").select("id, name").limit(5)

    if (campaignsError) {
      return NextResponse.json({
        success: false,
        error: "Failed to query campaigns",
        details: campaignsError.message,
      })
    }

    const { error: eventsError } = await supabase.from("email_events").select("*").limit(1)

    if (eventsError) {
      return NextResponse.json({
        success: false,
        error: "Failed to query email_events table",
        details: eventsError.message,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Webhook configuration is working correctly",
      campaigns: campaigns?.length || 0,
      environmentVariables: {
        databaseUrl: hasDatabaseUrl,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
