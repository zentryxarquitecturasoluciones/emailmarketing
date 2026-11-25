import { supabasePortalBServer } from "@/lib/supabase-portal-b"
import { type NextRequest, NextResponse } from "next/server"
import { SMTPPrivateOD92, isMailConfigured } from "@/lib/mail-provider"
import { addUnsubscribeLink } from "@/lib/email-unsubscribe"

export const maxDuration = 300

const MAIL_API_KEY = process.env.MAIL_API_KEY || ""
const FROM_DOMAIN = process.env.MAIL_FROM_DOMAIN || "zentryxmail.com"

const BATCH_SIZE = 10
const BATCH_DELAY_MS = 1500
const MAX_RETRIES = 5
const MAX_EMAILS_PER_CALL = 300

const pruebas_unitarias_EMAILS: string[] = []

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function replacePlaceholders(content: string, data: Record<string, string>, email: string): string {
  let result = content
  result = result.replace(/\{email\}/gi, email)
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{${key}\\}`, "gi")
    result = result.replace(regex, value || "")
  }
  result = result.replace(/\{[a-z_0-9]+\}/gi, "")
  return result
}

async function sendBatchWithRetry(
  mailService: SMTPPrivateOD92,
  batchEmails: any[],
  retries = MAX_RETRIES,
): Promise<{ success: boolean; data: any }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await mailService.batch.send(batchEmails)
      if (result.data?.data) {
        return { success: true, data: result.data.data }
      }
      if (attempt < retries) {
        const waitTime = attempt * 2000
        console.log(`[v0] Intento ${attempt}/${retries} sin respuesta, esperando ${waitTime}ms...`)
        await delay(waitTime)
      }
    } catch (error: any) {
      const isRateLimit = error?.statusCode === 429 || error?.message?.includes("rate")
      if (isRateLimit && attempt < retries) {
        const waitTime = attempt * 3000
        console.log(`[v0] Rate limit detectado, esperando ${waitTime}ms antes de reintentar...`)
        await delay(waitTime)
      } else if (attempt < retries) {
        const waitTime = attempt * 2000
        console.log(`[v0] Error en intento ${attempt}/${retries}: ${error?.message || "desconocido"}`)
        await delay(waitTime)
      } else {
        throw error
      }
    }
  }
  return { success: false, data: null }
}

export async function POST(request: NextRequest) {
  try {
    let campaignId: string
    let csvDataMap: Record<string, Record<string, string>> = {}

    try {
      const body = await request.json()
      campaignId = body.campaignId
      if (body.csvDataMap && typeof body.csvDataMap !== "string") {
        csvDataMap = body.csvDataMap
      }
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 })
    }

    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: "Servidor de correo no configurado. Define MAIL_API_KEY o SMTP_HOST, SMTP_USER y SMTP_PASS." },
        { status: 500 },
      )
    }

    const mailService = new SMTPPrivateOD92(MAIL_API_KEY)
    const supabase = supabasePortalBServer

    const csvDataKeys = Object.keys(csvDataMap)
    console.log(`[v0] CSV Data recibido: ${csvDataKeys.length} registros`)
    if (csvDataKeys.length > 0) {
      console.log(`[v0] Claves CSV (primeras 5): ${csvDataKeys.slice(0, 5).join(", ")}`)
      console.log(`[v0] Claves CSV (últimas 5): ${csvDataKeys.slice(-5).join(", ")}`)
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    let allSentEvents: { recipient_id: string }[] = []
    let sentPage = 0
    const SENT_PAGE_SIZE = 1000

    while (true) {
      const { data: sentEventsBatch } = await supabase
        .from("email_events")
        .select("recipient_id")
        .eq("campaign_id", campaignId)
        .not("recipient_id", "is", null)
        .range(sentPage * SENT_PAGE_SIZE, (sentPage + 1) * SENT_PAGE_SIZE - 1)

      if (!sentEventsBatch || sentEventsBatch.length === 0) {
        break
      }

      allSentEvents = [...allSentEvents, ...sentEventsBatch]
      sentPage++

      if (sentEventsBatch.length < SENT_PAGE_SIZE) {
        break
      }
    }

    const sentRecipientIds = new Set(allSentEvents.map((e) => e.recipient_id))

    let allRecipients: { id: string; email: string; row_index: number }[] = []
    let page = 0
    const PAGE_SIZE = 1000

    while (true) {
      const { data: recipientsBatch, error: recipientsError } = await supabase
        .from("campaign_recipients")
        .select("id, email, row_index")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (recipientsError) {
        console.log(`[v0] Error obteniendo recipients:`, recipientsError.message)
        break
      }

      if (!recipientsBatch || recipientsBatch.length === 0) {
        break
      }

      allRecipients = [...allRecipients, ...recipientsBatch]
      page++

      if (recipientsBatch.length < PAGE_SIZE) {
        break
      }
    }

    if (allRecipients.length === 0) {
      await supabase.from("campaigns").update({ status: "failed" }).eq("id", campaignId)
      return NextResponse.json({ error: "No recipients found" }, { status: 400 })
    }

    const rowIndexes = allRecipients.map((r) => r.row_index)
    console.log(`[v0] Recipients row_index (min): ${Math.min(...rowIndexes)}`)
    console.log(`[v0] Recipients row_index (max): ${Math.max(...rowIndexes)}`)

    const pendingRecipients = allRecipients.filter((r) => !sentRecipientIds.has(r.id))
    const totalEmails = allRecipients.length
    const alreadySent = sentRecipientIds.size

    console.log(`[v0] ========== INICIO ENVÍO PORTAL B ==========`)
    console.log(`[v0] Campaña: ${campaign.name} (${campaignId})`)
    console.log(`[v0] Total destinatarios: ${totalEmails}`)
    console.log(`[v0] Ya enviados: ${alreadySent}`)
    console.log(`[v0] Pendientes: ${pendingRecipients.length}`)
    console.log(`[v0] Máximo por llamada: ${MAX_EMAILS_PER_CALL}`)

    if (pendingRecipients.length === 0) {
      await supabase.from("campaigns").update({ status: "sent" }).eq("id", campaignId)
      console.log(`[v0] Campaña ya completada, 0 pendientes`)
      return NextResponse.json({
        success: true,
        completed: true,
        sent: alreadySent,
        failed: 0,
        total: totalEmails,
        progress: 100,
        needsContinue: false,
      })
    }

    const emailContent = campaign.content || campaign.html_content || ""

    const configuredFrom = process.env.MAIL_FROM_EMAIL || ""
    const fromEmail =
      campaign.from_email && String(campaign.from_email).includes("@")
        ? String(campaign.from_email).trim()
        : configuredFrom || `${campaign.from_email || "info"}@${FROM_DOMAIN}`
    const replyToEmail = campaign.reply_to && campaign.reply_to.includes("@") ? campaign.reply_to.trim() : fromEmail

    await supabase.from("campaigns").update({ status: "sending" }).eq("id", campaignId)

    let totalSent = alreadySent
    let totalFailed = 0
    let sentThisCall = 0

    const pruebas_unitariasRecipients = pendingRecipients.filter((r) => pruebas_unitarias_EMAILS.includes(r.email.toLowerCase()))
    const regularRecipients = pendingRecipients.filter((r) => !pruebas_unitarias_EMAILS.includes(r.email.toLowerCase()))
    const orderedRecipients = [...pruebas_unitariasRecipients, ...regularRecipients].slice(0, MAX_EMAILS_PER_CALL)

    console.log(`[v0] Procesando en esta llamada: ${orderedRecipients.length} emails`)
    console.log(`[v0] pruebas_unitariass en este batch: ${pruebas_unitariasRecipients.length}`)

    if (pruebas_unitariasRecipients.length > 0) {
      console.log(`[v0] === pruebas_unitariass detectados ===`)
      pruebas_unitariasRecipients.slice(0, 10).forEach((pruebas_unitarias) => {
        const csvData = csvDataMap[String(pruebas_unitarias.row_index)] || csvDataMap[pruebas_unitarias.email.toLowerCase()] || {}
        const hasData = Object.keys(csvData).length > 0
        const dataPreview = hasData
          ? Object.entries(csvData)
              .slice(0, 3)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")
          : "SIN DATOS"
        console.log(`[v0] pruebas_unitarias: ${pruebas_unitarias.email} | row_index: ${pruebas_unitarias.row_index} | Datos: ${dataPreview}`)
      })
    }

    let batchCounter = 0
    let matchedCount = 0
    let unmatchedCount = 0

    for (let i = 0; i < orderedRecipients.length; i += BATCH_SIZE) {
      const batch = orderedRecipients.slice(i, i + BATCH_SIZE)
      batchCounter++

      console.log(`[v0] ── Batch #${batchCounter}: ${batch.length} emails`)

      try {
        const batchEmails = batch.map((recipient) => {
          const email = recipient.email.toLowerCase()
          const recipientData = csvDataMap[String(recipient.row_index)] || csvDataMap[email] || {}
          const hasData = Object.keys(recipientData).length > 0

          if (hasData) {
            matchedCount++
          } else {
            unmatchedCount++
          }

          const personalizedContent = addUnsubscribeLink(
            replacePlaceholders(emailContent, recipientData, email),
            email,
            request.nextUrl.origin,
          )
          const personalizedSubject = replacePlaceholders(campaign.subject, recipientData, email)

          return {
            from: `${campaign.from_name || process.env.MAIL_FROM_NAME || "Data Zentryx"} <${fromEmail}>`,
            to: email,
            replyTo: replyToEmail,
            subject: personalizedSubject,
            html: personalizedContent,
            tags: [{ name: "campaign_id", value: campaignId }],
          }
        })

        if (batchCounter % 10 === 0) {
          console.log(`[v0] Matcheo hasta ahora: ${matchedCount} con datos, ${unmatchedCount} sin datos`)
        }

        const { success, data } = await sendBatchWithRetry(mailService, batchEmails)

        if (success && data) {
          let batchSent = 0
          let batchFailed = 0
          const events = batch.map((recipient, idx) => {
            const emailSuccess = !!data[idx]?.id
            if (emailSuccess) {
              totalSent++
              sentThisCall++
              batchSent++
            } else {
              totalFailed++
              batchFailed++
            }

            return {
              campaign_id: campaignId,
              contact_email: recipient.email.toLowerCase(),
              event_type: emailSuccess ? "sent" : "failed",
              email_id: data[idx]?.id || `failed_${Date.now()}_${idx}`,
              key_index: 0,
              recipient_id: recipient.id,
              created_at: new Date().toISOString(),
            }
          })
          await supabase.from("email_events").insert(events)

          console.log(
            `[v0] Batch #${batchCounter}: ${batchSent} OK, ${batchFailed} FAIL | Total: ${sentThisCall}/${orderedRecipients.length}`,
          )
        } else {
          totalFailed += batch.length
          console.log(`[v0] Batch #${batchCounter} FALLÓ`)
          const events = batch.map((recipient, idx) => ({
            campaign_id: campaignId,
            contact_email: recipient.email.toLowerCase(),
            event_type: "failed",
            email_id: `failed_${Date.now()}_${idx}`,
            key_index: 0,
            recipient_id: recipient.id,
            created_at: new Date().toISOString(),
          }))
          await supabase.from("email_events").insert(events)
        }
      } catch (error) {
        totalFailed += batch.length
        console.log(`[v0] Batch #${batchCounter} ERROR:`, error instanceof Error ? error.message : "Error")
        const events = batch.map((recipient, idx) => ({
          campaign_id: campaignId,
          contact_email: recipient.email.toLowerCase(),
          event_type: "failed",
          email_id: `failed_${Date.now()}_${idx}`,
          key_index: 0,
          recipient_id: recipient.id,
          created_at: new Date().toISOString(),
        }))
        await supabase.from("email_events").insert(events)
      }

      await delay(BATCH_DELAY_MS)
    }

    const remainingPending = pendingRecipients.length - orderedRecipients.length
    const isCompleted = remainingPending === 0
    const progress = Math.round((totalSent / totalEmails) * 100)

    if (isCompleted) {
      await supabase.from("campaigns").update({ status: "sent" }).eq("id", campaignId)
    }

    console.log(`[v0] ========== FIN LLAMADA PORTAL B ==========`)
    console.log(`[v0] Enviados esta llamada: ${sentThisCall}`)
    console.log(`[v0] Total enviados: ${totalSent}/${totalEmails}`)
    console.log(`[v0] Fallidos: ${totalFailed}`)
    console.log(`[v0] Progreso: ${progress}%`)
    console.log(`[v0] Pendientes: ${remainingPending}`)
    console.log(`[v0] Necesita continuar: ${!isCompleted}`)
    console.log(`[v0] MATCHEO FINAL: ${matchedCount} con datos CSV, ${unmatchedCount} sin datos`)

    return NextResponse.json({
      success: true,
      completed: isCompleted,
      sent: totalSent,
      failed: totalFailed,
      total: totalEmails,
      progress: progress,
      sentThisCall: sentThisCall,
      remaining: remainingPending,
      needsContinue: !isCompleted,
      matchedWithData: matchedCount,
      unmatchedWithData: unmatchedCount,
    })
  } catch (error) {
    console.log(`[v0] ERROR CRÍTICO:`, error instanceof Error ? error.message : "Error desconocido")
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 })
  }
}
