import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { SMTPPrivateOD92 } from "@/lib/mail-provider"

const mailService = new SMTPPrivateOD92(process.env.MAIL_API_KEY)

function isValidSMTPPrivateOD92UUID(id: string): boolean {
  if (!id) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: allEvents, error: eventsError } = await supabase
      .from("email_events")
      .select("id, email_id, email, event_type")
      .eq("campaign_id", id)
      .not("email_id", "is", null)

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`)
    }

    if (!allEvents || allEvents.length === 0) {
      return NextResponse.json({ success: true, message: "No emails to sync" })
    }

    // Filtrar solo los que tienen IDs reales de SMTPPrivateOD92
    const realSMTPPrivateOD92Emails = allEvents.filter((event) => isValidSMTPPrivateOD92UUID(event.email_id))

    if (realSMTPPrivateOD92Emails.length === 0) {
      return NextResponse.json({ success: true, message: "No real SMTPPrivateOD92 emails to sync" })
    }

    let updatedCount = 0
    const eventMap: Record<string, string> = {
      delivered: "delivered",
      opened: "opened",
      clicked: "clicked",
      bounced: "bounced",
      complained: "spam",
    }

    for (const event of realSMTPPrivateOD92Emails) {
      try {
        if (!event.email_id) continue

        const { data: emailData } = await mailService.emails.get(event.email_id)

        if (emailData && emailData.last_event) {
          const lastEvent = emailData.last_event.toLowerCase()
          const mappedEvent = eventMap[lastEvent] || lastEvent

          // Solo actualizar si el estado cambió
          if (mappedEvent !== event.event_type) {
            await supabase
              .from("email_events")
              .update({
                event_type: mappedEvent,
                created_at: new Date().toISOString(), // Actualizar timestamp
              })
              .eq("id", event.id)

            updatedCount++
          }
        }
      } catch {
        // Silent error - continuar con el siguiente
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      total: realSMTPPrivateOD92Emails.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sync stats", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
