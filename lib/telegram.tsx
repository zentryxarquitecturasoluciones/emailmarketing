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
  currentKey?: number
  totalKeys?: number
  elapsedTime: string
  estimatedRemaining: string
  status: "started" | "progress" | "completed" | "paused" | "cancelled" | "error"
}

export async function sendTelegramNotification(data: CampaignProgress): Promise<boolean> {
  try {
    let emoji = "📧"
    let statusText = ""

    switch (data.status) {
      case "started":
        emoji = "🚀"
        statusText = "CAMPAÑA INICIADA"
        break
      case "progress":
        emoji = "📊"
        statusText = "ACTUALIZACIÓN DEL PROGRESO"
        break
      case "completed":
        emoji = "✅"
        statusText = "CAMPAÑA COMPLETADA"
        break
      case "paused":
        emoji = "⏸️"
        statusText = "CAMPAÑA PAUSADA"
        break
      case "cancelled":
        emoji = "❌"
        statusText = "CAMPAÑA CANCELADA"
        break
      case "error":
        emoji = "⚠️"
        statusText = "ERROR EN LA CAMPAÑA"
        break
    }

    const progressBar = generateProgressBar(data.progress)
    const successRate =
      data.sentEmails > 0 ? ((data.sentEmails / (data.sentEmails + data.failedEmails)) * 100).toFixed(1) : "0"

    let message = `${emoji} <b>${statusText}</b>\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`
    message += `📋 <b>Campaña:</b> ${escapeHtml(data.campaignName)}\n`
    message += `🏢 <b>Portal:</b> ${data.portal === "a" ? "Portal A (100 mil)" : "Portal B (5 mil)"}\n\n`

    message += `${progressBar}\n`
    message += `<b>${data.progress}%</b> completado\n\n`

    message += `📨 <b>Enviados:</b> ${formatNumber(data.sentEmails)} / ${formatNumber(data.totalEmails)}\n`

    if (data.failedEmails > 0) {
      message += `❌ <b>Fallidos:</b> ${formatNumber(data.failedEmails)}\n`
    }

    message += `✨ <b>Tasa de éxito:</b> ${successRate}%\n\n`

    if (data.portal === "a" && data.currentKey !== undefined && data.totalKeys !== undefined) {
      message += `🔑 <b>Clave actual:</b> ${data.currentKey + 1} de ${data.totalKeys}\n`
    }

    message += `⏱️ <b>Tiempo transcurrido:</b> ${data.elapsedTime}\n`

    if (data.status === "progress" && data.estimatedRemaining) {
      message += `⏳ <b>Tiempo restante:</b> ${data.estimatedRemaining}\n`
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`
    message += `🕐 ${new Date().toLocaleString("es-ES", { timeZone: "America/New_York" })}`

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

    return response.ok
  } catch (error) {
    console.log("[Telegram] Error sending notification:", error)
    return false
  }
}

function generateProgressBar(progress: number): string {
  const filled = Math.round(progress / 5)
  const empty = 20 - filled
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`
}

function formatNumber(num: number): string {
  return num.toLocaleString("es-ES")
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
