import { supabasePortalBServer } from "@/lib/supabase-portal-b"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("campaignId")
  const type = searchParams.get("type") || "full"

  if (!campaignId) {
    return NextResponse.json({ error: "Se requiere el ID de la campaña" }, { status: 400 })
  }

  const supabase = supabasePortalBServer

  // Obtener info de la campaña
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name, subject, from_email, created_at")
    .eq("id", campaignId)
    .single()

  const campaignName = campaign?.name?.replace(/[^a-zA-Z0-9]/g, "_") || campaignId

  if (type === "full") {
    // Obtener todos los destinatarios con sus datos
    const { data: recipients } = await supabase
      .from("campaign_recipients")
      .select("id, email, row_index, created_at")
      .eq("campaign_id", campaignId)
      .order("row_index", { ascending: true })

    // Obtener todos los eventos
    const { data: events } = await supabase
      .from("email_events")
      .select("recipient_id, contact_email, event_type, created_at, email_id")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "No se encontraron destinatarios" }, { status: 404 })
    }

    // Crear mapa de eventos por recipient_id
    const eventsMap = new Map<number, { status: string; sent_at: string; email_id: string }>()
    events?.forEach((e) => {
      if (e.recipient_id) {
        eventsMap.set(e.recipient_id, {
          status: e.event_type || "pending",
          sent_at: e.created_at || "",
          email_id: e.email_id || "",
        })
      }
    })

    // Crear CSV con todos los datos
    const headers = ["row", "email", "status", "sent_at", "email_id"]
    const rows = recipients.map((r) => {
      const event = eventsMap.get(r.id)
      return [
        r.row_index ?? "",
        r.email,
        event?.status || "pending",
        event?.sent_at ? new Date(event.sent_at).toLocaleString("es-ES") : "",
        event?.email_id || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    })

    const csv = [headers.join(","), ...rows].join("\n")
    const bom = "\uFEFF" // UTF-8 BOM para Excel

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${campaignName}_complete.csv"`,
      },
    })
  } else if (type === "sent") {
    // Solo emails enviados exitosamente
    const { data: events } = await supabase
      .from("email_events")
      .select("contact_email, created_at")
      .eq("campaign_id", campaignId)
      .eq("event_type", "sent")
      .order("created_at", { ascending: true })

    if (!events || events.length === 0) {
      return NextResponse.json({ error: "No se encontraron correos enviados" }, { status: 404 })
    }

    const headers = ["email", "sent_at"]
    const rows = events.map((e) =>
      [e.contact_email, new Date(e.created_at).toLocaleString("es-ES")]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )

    const csv = [headers.join(","), ...rows].join("\n")
    const bom = "\uFEFF"

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${campaignName}_sent.csv"`,
      },
    })
  } else if (type === "failed") {
    // Solo emails fallidos
    const { data: events } = await supabase
      .from("email_events")
      .select("contact_email, created_at")
      .eq("campaign_id", campaignId)
      .eq("event_type", "failed")
      .order("created_at", { ascending: true })

    if (!events || events.length === 0) {
      return NextResponse.json({ error: "No se encontraron correos fallidos" }, { status: 404 })
    }

    const headers = ["email", "failed_at"]
    const rows = events.map((e) =>
      [e.contact_email, new Date(e.created_at).toLocaleString("es-ES")]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )

    const csv = [headers.join(","), ...rows].join("\n")
    const bom = "\uFEFF"

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${campaignName}_failed.csv"`,
      },
    })
  } else if (type === "pending") {
    // Emails pendientes (no enviados)
    const { data: recipients } = await supabase
      .from("campaign_recipients")
      .select("id, email, row_index")
      .eq("campaign_id", campaignId)
      .order("row_index", { ascending: true })

    const { data: events } = await supabase.from("email_events").select("recipient_id").eq("campaign_id", campaignId)

    const sentRecipientIds = new Set(events?.map((e) => e.recipient_id) || [])
    const pendingRecipients = recipients?.filter((r) => !sentRecipientIds.has(r.id)) || []

    if (pendingRecipients.length === 0) {
      return NextResponse.json({ error: "No se encontraron correos pendientes" }, { status: 404 })
    }

    const headers = ["row", "email"]
    const rows = pendingRecipients.map((r) =>
      [r.row_index ?? "", r.email].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )

    const csv = [headers.join(","), ...rows].join("\n")
    const bom = "\uFEFF"

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${campaignName}_pending.csv"`,
      },
    })
  }

  return NextResponse.json({ error: "Tipo no válido" }, { status: 400 })
}
