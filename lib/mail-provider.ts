import nodemailer, { type Transporter } from "nodemailer"

const RESEND_API_URL = "https://api.resend.com/emails"

export interface OutgoingEmail {
  from?: string
  to: string | string[]
  replyTo?: string
  subject: string
  html?: string
  text?: string
  headers?: Record<string, string>
  tags?: { name: string; value: string }[]
  attachments?: Array<Record<string, unknown>>
}

export interface SentEmailResult {
  id: string | null
  error?: string
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.MAIL_API_KEY)
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export function isMailConfigured(): boolean {
  return isResendConfigured() || isSmtpConfigured()
}

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP no configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASS.")
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  return transporter
}

function normalizeRecipients(to: string | string[]): string {
  return Array.isArray(to) ? to.join(", ") : to
}

function defaultFrom(): string {
  return process.env.MAIL_FROM_EMAIL || "zentryxarquitecturadesoluciones@gmail.com"
}

function defaultReplyTo(): string {
  return process.env.MAIL_REPLY_TO || "zentryxarquitecturadesoluciones@gmail.com"
}

async function sendWithResend(emails: OutgoingEmail[]): Promise<SentEmailResult[]> {
  const apiKey = process.env.MAIL_API_KEY as string
  const results: SentEmailResult[] = []

  for (const email of emails) {
    try {
      const payload: Record<string, unknown> = {
        from: email.from || defaultFrom(),
        to: normalizeRecipients(email.to),
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo || defaultReplyTo(),
      }
      if (email.headers) payload.headers = email.headers
      if (email.tags) payload.tags = email.tags
      if (email.attachments?.length) payload.attachments = email.attachments

      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 300)
        results.push({ id: null, error: `Resend ${response.status}: ${detail}` })
        continue
      }

      const result = (await response.json().catch(() => ({}))) as { id?: string }
      results.push({ id: result.id || crypto.randomUUID() })
    } catch (error) {
      results.push({
        id: null,
        error: error instanceof Error ? error.message : "Error desconocido al enviar",
      })
    }
  }

  return results
}

export class SMTPPrivateOD92 {
  constructor(_apiKey?: string) {}

  batch = {
    send: async (emails: OutgoingEmail[]) => {
      const results = isResendConfigured() ? await sendWithResend(emails) : await this.sendWithSmtp(emails)
      return { data: { data: results } }
    },
  }

  emails = {
    get: async (_id: string) => {
      return { data: null as { last_event?: string } | null }
    },
  }

  private async sendWithSmtp(emails: OutgoingEmail[]): Promise<SentEmailResult[]> {
    const mailer = getTransporter()
    const results: SentEmailResult[] = []

    for (const email of emails) {
      try {
        const info = await mailer.sendMail({
          from: email.from || defaultFrom(),
          to: normalizeRecipients(email.to),
          replyTo: email.replyTo || defaultReplyTo(),
          subject: email.subject,
          html: email.html,
          text: email.text,
          headers: email.headers,
          attachments: email.attachments,
        })

        results.push({ id: info.messageId || crypto.randomUUID() })
      } catch (error) {
        results.push({
          id: null,
          error: error instanceof Error ? error.message : "Error desconocido al enviar",
        })
      }
    }

    return results
  }
}

export function getMailApiKey(): string {
  return process.env.MAIL_API_KEY || ""
}
