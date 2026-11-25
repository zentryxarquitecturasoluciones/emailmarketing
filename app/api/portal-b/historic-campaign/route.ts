import { NextResponse } from "next/server"
import { supabasePortalB } from "@/lib/supabase-portal-b"

export async function POST(request: Request) {
  try {
    const { name, subject, from_name, from_email, html_content, date, recipients } = await request.json()

    if (!name || !date || !recipients?.length) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const { data: campaign, error } = await supabasePortalB
      .from("campaigns")
      .insert({
        name,
        subject: subject || name,
        from_name: from_name || "Data Zentryx",
        from_email: from_email || "zentryxarquitecturadesoluciones@gmail.com",
        reply_to: from_email || "zentryxarquitecturadesoluciones@gmail.com",
        html_content: html_content || "<p>Historical campaign</p>",
        content: html_content || "<p>Historical campaign</p>",
        status: "sent",
        total_recipients: recipients.length,
      })
      .select()
      .single()

    if (error || !campaign) {
      console.error("Error creating historical campaign:", error)
      return NextResponse.json({ error: error?.message || "Unable to create campaign." }, { status: 400 })
    }

    // Insertar recipients en batches
    const BATCH_SIZE = 500
    let insertedCount = 0

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const recipientRecords = batch.map((r: { email: string }, idx: number) => ({
        campaign_id: campaign.id,
        email: r.email,
        row_index: i + idx,
      }))

      const { error: insertError } = await supabasePortalB.from("campaign_recipients").insert(recipientRecords)

      if (!insertError) {
        insertedCount += batch.length
      }
    }

    // Insertar eventos de "sent" para cada recipient
    const sentDate = new Date(date).toISOString()

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const eventRecords = batch.map((r: { email: string }, idx: number) => ({
        campaign_id: campaign.id,
        recipient_id: i + idx,
        email: r.email,
        event_type: "sent",
        created_at: sentDate,
      }))

      await supabasePortalB.from("email_events").insert(eventRecords)
    }

    // Actualizar fecha de envío
    await supabasePortalB
      .from("campaigns")
      .update({
        created_at: sentDate,
        updated_at: sentDate,
      })
      .eq("id", campaign.id)

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
      recipients_count: insertedCount,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno: " + (error as Error).message }, { status: 500 })
  }
}
