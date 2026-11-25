import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { SMTPPrivateOD92 } from "@/lib/mail-provider"

export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 })
    }

    const mailService = new SMTPPrivateOD92()
    const supabase = await createClient()

    // Obtener eventos con IDs reales de SMTPPrivateOD92 (no los simulados que empiezan con prefijos)
    const { data: events } = await supabase
      .from("email_events")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("event_type", "sent")

    if (!events || events.length === 0) {
      return NextResponse.json({ updated: 0 })
    }

    // Filtrar solo IDs reales de SMTPPrivateOD92 (UUIDs, no los simulados)
    const realEvents = events.filter(
      (e) =>
        e.email_id &&
        !e.email_id.startsWith("o_") &&
        !e.email_id.startsWith("c_") &&
        !e.email_id.startsWith("b_") &&
        !e.email_id.startsWith("s_") &&
        !e.email_id.startsWith("bounce_") &&
        !e.email_id.startsWith("spam_") &&
        !e.email_id.startsWith("open_") &&
        !e.email_id.startsWith("click_"),
    )

    let updated = 0
    const newEvents: any[] = []

    for (const event of realEvents) {
      try {
        const { data: emailData } = await mailService.emails.get(event.email_id)

        if (emailData && emailData.last_event) {
          const lastEvent = emailData.last_event.toLowerCase()

          // Mapear eventos de SMTPPrivateOD92 a nuestros tipos
          const eventMap: Record<string, string> = {
            delivered: "delivered",
            opened: "opened",
            clicked: "clicked",
            bounced: "bounced",
            complained: "spam",
          }

          const mappedEvent = eventMap[lastEvent]

          if (mappedEvent && mappedEvent !== "sent" && event.event_type !== mappedEvent) {
            // Actualizar el evento existente
            await supabase.from("email_events").update({ event_type: mappedEvent }).eq("id", event.id)

            updated++
          }
        }
      } catch (error) {
        // Continuar con el siguiente email
      }
    }

    return NextResponse.json({ updated, total: realEvents.length })
  } catch (error) {
    return NextResponse.json({ error: "Error fetching stats" }, { status: 500 })
  }
}
