import { createClient } from "@/lib/db/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: events, error: eventsError } = await supabase
      .from("email_events")
      .select("event_type")
      .eq("campaign_id", id)

    if (eventsError) {
      console.error("[v0] Error fetching events:", eventsError)
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    const counts = {
      sent_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0,
      bounced_count: 0,
      complained_count: 0,
    }

    events?.forEach((event) => {
      if (event.event_type === "sent") counts.sent_count++
      else if (event.event_type === "delivered") counts.delivered_count++
      else if (event.event_type === "opened") counts.opened_count++
      else if (event.event_type === "clicked") counts.clicked_count++
      else if (event.event_type === "bounced") counts.bounced_count++
      else if (event.event_type === "complained") counts.complained_count++
    })

    const { error: updateError } = await supabase.from("campaigns").update(counts).eq("id", id)

    if (updateError) {
      console.error("[v0] Error updating campaign:", updateError)
      return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      counts,
      message: "Campaign statistics synced successfully.",
    })
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
