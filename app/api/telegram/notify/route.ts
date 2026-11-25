import { type NextRequest, NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ""

interface CampaignProgress {
  campaignId: string
  campaignName: string
  portal: string
  totalEmails: number
  sentEmails: number
  failedEmails: number
  progress: number
  elapsedTime: string
  estimatedRemaining: string
  status: "started" | "progress" | "completed" | "paused" | "cancelled" | "error"
}

function generateProgressBar(progress: number): string {
  const total = 10
  const filled = Math.round((progress / 100) * total)
  const empty = total - filled
  return "█".repeat(filled) + "░".repeat(empty)
}

function formatNumber(num: number): string {
  if (typeof num !== "number" || isNaN(num)) return "0"
  return num.toLocaleString("es-ES")
}

function escapeHtml(text: string): string {
  if (!text) return ""
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function getPortalName(portal: string): string {
  return portal === "a" ? "Portal A" : "Portal B"
}

export async function POST(request: NextRequest) {
  try {
    const data: CampaignProgress = await request.json()

    const campaignName = data.campaignName || "Campaña"
    const portal = data.portal || "a"
    const totalEmails = data.totalEmails || 0
    const sentEmails = data.sentEmails || 0
    const failedEmails = data.failedEmails || 0
    const progress = Math.min(100, Math.max(0, data.progress || 0))
    const elapsedTime = data.elapsedTime || "0s"
    const estimatedRemaining = data.estimatedRemaining || ""

    let message = ""
    const portalName = getPortalName(portal)
    const progressBar = generateProgressBar(progress)
    const hora = new Date().toLocaleTimeString("es-ES", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
    })

    switch (data.status) {
      case "started":
        message = `🎄 <b>Campaña iniciada</b>\n\n`
        message += `📋 <b>${escapeHtml(campaignName)}</b>\n`
        message += `📍 ${portalName}\n`
        message += `📬 ${formatNumber(totalEmails)} destinatarios\n\n`
        message += `🕐 ${hora}`
        break

      case "progress":
        message = `📊 <b>${progress.toFixed(0)}%</b> ${progressBar}\n\n`
        message += `📋 ${escapeHtml(campaignName)}\n`
        message += `📨 ${formatNumber(sentEmails)} / ${formatNumber(totalEmails)}\n`
        if (failedEmails > 0) {
          message += `⚠️ ${formatNumber(failedEmails)} fallidos\n`
        }
        if (estimatedRemaining) {
          message += `\n⏳ ~${estimatedRemaining} restantes`
        }
        break

      case "completed":
        const successRate = sentEmails > 0 ? ((sentEmails / (sentEmails + failedEmails)) * 100).toFixed(1) : "100"
        message = `🎉 <b>¡Campaña completada!</b>\n\n`
        message += `📋 <b>${escapeHtml(campaignName)}</b>\n`
        message += `📍 ${portalName}\n\n`
        message += `✅ ${formatNumber(sentEmails)} enviados\n`
        if (failedEmails > 0) {
          message += `❌ ${formatNumber(failedEmails)} fallidos\n`
        }
        message += `📈 Tasa de éxito: ${successRate}%\n`
        message += `⏱️ Duración: ${elapsedTime}\n\n`
        message += `🕐 ${hora}`
        break

      case "paused":
        message = `⏸️ <b>Campaña pausada</b>\n\n`
        message += `📋 ${escapeHtml(campaignName)}\n`
        message += `📊 ${progress.toFixed(0)}% (${formatNumber(sentEmails)}/${formatNumber(totalEmails)})`
        break

      case "cancelled":
        message = `🛑 <b>Campaña cancelada</b>\n\n`
        message += `📋 ${escapeHtml(campaignName)}\n`
        message += `📨 ${formatNumber(sentEmails)} enviados antes de la cancelación`
        break

      case "error":
        message = `⚠️ <b>Error en la campaña</b>\n\n`
        message += `📋 ${escapeHtml(campaignName)}\n`
        message += `📊 ${progress.toFixed(0)}% al momento del error\n`
        message += `📨 ${formatNumber(sentEmails)} enviados`
        break
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
        disable_notification: data.status === "progress",
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json({ success: false, error: errorData }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "No se pudo enviar la notificación" }, { status: 500 })
  }
}
