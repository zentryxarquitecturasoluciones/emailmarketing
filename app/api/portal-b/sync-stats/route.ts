import { supabasePortalBServer } from "@/lib/supabase-portal-b"
import { type NextRequest, NextResponse } from "next/server"
import { SMTPPrivateOD92 } from "@/lib/mail-provider"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 })
    }

    const supabase = supabasePortalBServer
    const mailService = new SMTPPrivateOD92(process.env.MAIL_API_KEY)

    const { data: events, error } = await supabase
      .from("email_events")
      .select("id, email_id, event_type")
      .eq("campaign_id", campaignId)
      .not("email_id", "like", "failed_%")
      .not("event_type", "in", "(opened,clicked,bounced,spam)")
      .limit(100)

    if (error || !events || events.length === 0) {
      return NextResponse.json({ message: "No events to sync", updated: 0 })
    }

    let updated = 0

    for (const event of events) {
      const { data: emailData } = await mailService.emails.get(event.email_id)

      if (emailData?.last_event) {
        const newStatus = getStatusFromProvider(emailData, event.event_type)

        if (newStatus !== event.event_type) {
          await supabase.from("email_events").update({ event_type: newStatus }).eq("id", event.id)
          updated++
        }
      }
    }

    return NextResponse.json({ success: true, updated, total: events.length })
  } catch (error) {
    console.error("[Portal B] Sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}

function getStatusFromProvider(emailData: { last_event?: string }, currentStatus: string): string {
  const lastEvent = emailData.last_event?.toLowerCase()

  if (lastEvent === "opened" || lastEvent === "open") return "opened"
  if (lastEvent === "clicked" || lastEvent === "click") return "clicked"
  if (lastEvent === "bounced" || lastEvent === "bounce") return "bounced"
  if (lastEvent === "complained" || lastEvent === "spam") return "spam"
  if (lastEvent === "delivered" || lastEvent === "delivery") return "delivered"

  return currentStatus
}
