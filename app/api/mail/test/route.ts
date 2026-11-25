import { NextResponse } from "next/server"
import { SMTPPrivateOD92, isMailConfigured } from "@/lib/mail-provider"
import { ZENTRYX_CONFIG } from "@/lib/tenant-config"

export const maxDuration = 30

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }
    return map[char] || char
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const to = typeof body?.to === "string" ? body.to.trim().toLowerCase() : ""

    if (!EMAIL_PATTERN.test(to)) {
      return NextResponse.json({ success: false, error: "Correo electrónico inválido" }, { status: 400 })
    }

    if (!isMailConfigured()) {
      return NextResponse.json(
        { success: false, error: "Proveedor de correo no configurado" },
        { status: 500 },
      )
    }

    const sentAt = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "long",
      timeStyle: "short",
    })

    const result = await new SMTPPrivateOD92(process.env.MAIL_API_KEY).batch.send([
      {
        from: ZENTRYX_CONFIG.email.from,
        replyTo: ZENTRYX_CONFIG.email.replyTo,
        to,
        subject: "Correo de prueba - Data Zentryx",
        text: `Este es un correo de prueba enviado desde el sistema de Email Marketing de Data Zentryx. Fecha: ${sentAt}.`,
        html: `<div style="font-family:Arial,sans-serif;color:#142016;line-height:1.6"><h1 style="color:#07120b">Correo de prueba</h1><p>Este mensaje confirma que el sistema de Email Marketing de <strong>Data Zentryx</strong> puede enviar correos correctamente.</p><p><strong>Destinatario:</strong> ${escapeHtml(to)}</p><p><strong>Fecha:</strong> ${escapeHtml(sentAt)}</p><p>Si recibiste este correo, la configuración de envío está funcionando.</p></div>`,
      },
    ])

    const sent = result.data?.data?.[0]
    if (!sent?.id) {
      return NextResponse.json(
        { success: false, error: sent?.error || "No se pudo enviar el correo de prueba" },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true, id: sent.id, to })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 500 },
    )
  }
}
