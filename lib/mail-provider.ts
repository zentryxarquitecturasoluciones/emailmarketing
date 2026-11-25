import nodemailer, { type Transporter } from "nodemailer"

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"

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

type MailAddress = { email: string; name?: string }

export function isMailApiConfigured(): boolean {
  return Boolean(process.env.MAIL_API_KEY)
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export function isMailConfigured(): boolean {
  return isMailApiConfigured() || isSmtpConfigured()
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

function parseAddress(value: string): MailAddress {
  const match = value.trim().match(/^(.*?)\s*<([^>]+)>$/)
  if (!match) return { email: value.trim() }
  const name = match[1].trim().replace(/^"|"$/g, "")
  return name ? { email: match[2].trim(), name } : { email: match[2].trim() }
}

function parseRecipients(value: string | string[]): MailAddress[] {
  const values = Array.isArray(value) ? value : [value]
  return values.flatMap((item) => item.split(",")).map((item) => parseAddress(item)).filter((item) => item.email)
}

function defaultFrom(): string {
  return process.env.MAIL_FROM_EMAIL || "hola@zentryxcorreo.ddnsgeek.com"
}

function defaultReplyTo(): string {
  return process.env.MAIL_REPLY_TO || "zentryxarquitecturasoluciones@gmail.com"
}

async function sendWithSendGrid(emails: OutgoingEmail[]): Promise<SentEmailResult[]> {
  const apiKey = process.env.MAIL_API_KEY as string
  const results: SentEmailResult[] = []

  for (const email of emails) {
    try {
      const content = [
        email.text ? { type: "text/plain", value: email.text } : null,
        email.html ? { type: "text/html", value: email.html } : null,
      ].filter((item): item is { type: string; value: string } => Boolean(item))

      const payload: Record<string, unknown> = {
        personalizations: [
          {
            to: parseRecipients(email.to),
            ...(email.headers ? { headers: email.headers } : {}),
          },
        ],
        from: parseAddress(email.from || defaultFrom()),
        reply_to: parseAddress(email.replyTo || defaultReplyTo()),
        subject: email.subject,
        content: content.length ? content : [{ type: "text/plain", value: "" }],
      }

      if (email.tags?.length) {
        payload.categories = email.tags.map((tag) => tag.value).slice(0, 10)
      }
      if (email.attachments?.length) payload.attachments = email.attachments

      const response = await fetch(SENDGRID_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 300)
        results.push({ id: null, error: `SendGrid ${response.status}: ${detail}` })
        continue
      }

      const id = response.headers.get("x-message-id") || crypto.randomUUID()
      results.push({ id })
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
      const results = isMailApiConfigured() ? await sendWithSendGrid(emails) : await this.sendWithSmtp(emails)
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
          to: Array.isArray(email.to) ? email.to.join(", ") : email.to,
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
