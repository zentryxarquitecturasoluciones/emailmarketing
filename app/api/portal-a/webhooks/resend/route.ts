import { type NextRequest, NextResponse } from "next/server"
import { supabasePortalAServer } from "@/lib/supabase-portal-a"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    const supabase = supabasePortalAServer

    const { type, data } = payload

    if (!type || !data) {
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 })
    }

    const eventTypeMap: Record<string, string> = {
      "email.delivered": "delivered",
      "email.sent": "sent",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced",
      "email.complained": "complained",
    }

    const eventType = eventTypeMap[type]

    if (!eventType) {
      return NextResponse.json({ success: true, message: "Event type not tracked" })
    }

    // Buscar campaign_id en tags
    let campaignId = null
    if (data.tags && Array.isArray(data.tags)) {
      const campaignTag = data.tags.find((t: any) => t.name === "campaign_id")
      if (campaignTag) campaignId = campaignTag.value
    }

    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaign_id in tags" }, { status: 400 })
    }

    const contactEmail = data.to?.[0] || data.email || "unknown"

    // Actualizar evento existente si es del mismo email y campaña
    const { data: existingEvent } = await supabase
      .from("email_events")
      .select("id, event_type")
      .eq("campaign_id", campaignId)
      .eq("contact_email", contactEmail)
      .order("created_at", { ascending: false })
      .limit(1)

    if (existingEvent && existingEvent.length > 0) {
      // Actualizar el evento existente con el nuevo tipo
      await supabase
        .from("email_events")
        .update({
          event_type: eventType,
          metadata: data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingEvent[0].id)
    } else {
      // Insertar nuevo evento
      await supabase.from("email_events").insert({
        campaign_id: campaignId,
        contact_email: contactEmail,
        event_type: eventType,
        email_id: data.email_id || null,
        metadata: data,
      })
    }

    // Actualizar contadores en la campaña
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("delivered_count, opened_count, clicked_count, bounced_count, complained_count")
      .eq("id", campaignId)
      .single()

    if (campaign) {
      const updates: Record<string, number> = {}

      if (eventType === "delivered") updates.delivered_count = (campaign.delivered_count || 0) + 1
      if (eventType === "opened") updates.opened_count = (campaign.opened_count || 0) + 1
      if (eventType === "clicked") updates.clicked_count = (campaign.clicked_count || 0) + 1
      if (eventType === "bounced") updates.bounced_count = (campaign.bounced_count || 0) + 1
      if (eventType === "complained") updates.complained_count = (campaign.complained_count || 0) + 1

      if (Object.keys(updates).length > 0) {
        await supabase.from("campaigns").update(updates).eq("id", campaignId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook processing failed", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
