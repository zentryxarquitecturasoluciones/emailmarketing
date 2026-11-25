"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, X, Info, Loader2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { isInvalidEmail, MAX_RECIPIENTS, parseCSVLarge } from "@/lib/email-processor"
import { saveCsvDataLarge } from "@/lib/csv-storage"
import { supabasePortalA } from "@/lib/supabase-portal-a"
import { supabasePortalB } from "@/lib/supabase-portal-b"

interface EmailRecord {
  email: string
  rowIndex: number
  rowData?: Record<string, any>
}

type MessageTemplateId = "commercial-analysis" | "clean-b2b-data" | "custom"

const MESSAGE_TEMPLATES: Record<Exclude<MessageTemplateId, "custom">, { label: string; subject: string; content: string }> = {
  "commercial-analysis": {
    label: "Análisis comercial (predeterminado)",
    subject: "Commercial analysis and B2B data for better campaigns",
    content: `<p>Hello, good morning:</p><p>Many companies invest in email marketing, but the real problem is not the email itself. The problem is reaching owners, managers, and decision-makers who are actually ready to buy.</p><p>At Data Zentryx, we turn data into commercial decisions. We analyze your commercial data, define your ideal customer profile, and segment contacts by industry, job title, company size, and location. Then we use verified B2B data and AI-powered solutions to clean lists, enrich records, personalize outreach, and prioritize the prospects with the highest potential value.</p><p>The result is simple: less budget wasted on contacts that never respond and more conversations with qualified prospects.</p><p>If you want to test it, we can provide a free commercial diagnostic and a sample of 20 B2B contacts based on your target industry and city. Just reply with those two details. No call, no long form, no obligation.</p><p>Best regards,<br><strong>Data Zentryx</strong><br>Commercial Analysis · B2B Data · AI Solutions<br>datazentryx.ap-arquitectos.com</p><p>If you do not wish to receive these messages, reply “stop” and we will remove you.</p>`,
  },
  "clean-b2b-data": {
    label: "Datos B2B limpios",
    subject: "Clean B2B data that turns cold lists into conversations",
    content: `<p>Hello, good morning:</p><p>A clean B2B list does more than protect your sender reputation. It gives your sales team a clear path to the people who actually matter.</p><p>At Data Zentryx, we verify, clean, and enrich B2B contact data so your campaigns stop wasting budget on invalid addresses, outdated job titles, and contacts outside your ideal customer profile. We segment by industry, role, company size, and location, then prioritize the records with the strongest commercial potential.</p><p>With AI-assisted enrichment and deliverability checks, your outreach becomes more relevant, more targeted, and more likely to reach the inbox. The outcome is fewer bounced emails, sharper segmentation, and more qualified replies.</p><p>If you want to see the quality difference, reply with your target industry and city. We will send you 20 sample B2B contacts so you can test the data before committing any budget.</p><p>Best regards,<br><strong>Data Zentryx</strong><br>Clean B2B Data · Commercial Analysis · AI Solutions<br>datazentryx.ap-arquitectos.com</p><p>If you do not wish to receive these messages, reply “stop” and we will remove you.</p>`,
  },
}

interface UnifiedCampaignFormProps {
  sourceCampaignId?: string
  portalPath: string
  defaultFromName: string
  defaultFromEmail: string
  defaultReplyTo: string
}

export function UnifiedCampaignForm({
  sourceCampaignId,
  portalPath,
  defaultFromName,
  defaultFromEmail,
  defaultReplyTo,
}: UnifiedCampaignFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" })
  const [parsingCsv, setParsingCsv] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const [csvDataMap, setCsvDataMap] = useState<Record<string, any>>({})
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvFileName, setCsvFileName] = useState<string>("")
  const [csvRecordCount, setCsvRecordCount] = useState(0)
  const [emailRecords, setEmailRecords] = useState<EmailRecord[]>([])
  const [pastedEmails, setPastedEmails] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateId>("commercial-analysis")

  const [formData, setFormData] = useState({
    name: "",
    subject: MESSAGE_TEMPLATES["commercial-analysis"].subject,
    fromName: defaultFromName,
    fromEmail: defaultFromEmail,
    replyTo: defaultReplyTo,
    content: MESSAGE_TEMPLATES["commercial-analysis"].content,
  })

  const getSupabaseClient = () => {
    if (portalPath.includes("portal-a")) {
      return supabasePortalA
    }
    return supabasePortalB
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPastedEmails("")
    setCsvFileName(file.name)
    setParsingCsv(true)
    setProgress({ current: 0, total: 100, phase: "Leyendo archivo CSV..." })

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string

      setProgress({ current: 0, total: 100, phase: "Procesando archivo CSV..." })

      const { headers, data } = await parseCSVLarge(text, (current, total) => {
        setProgress({ current, total, phase: "Procesando archivo CSV..." })
      })

      const limitedData = data.slice(0, MAX_RECIPIENTS)

      setCsvHeaders(headers)
      setCsvRecordCount(limitedData.length)

      setProgress({ current: 0, total: limitedData.length, phase: "Extrayendo correos..." })

      const dataMapByIndex: Record<string, any> = {}

      const emailKey = headers.find(
        (h) => h.toLowerCase() === "email" || h.toLowerCase() === "e-mail" || h.toLowerCase() === "correo",
      )

      const records: EmailRecord[] = []
      limitedData.forEach((row, index) => {
        let email = ""
        if (emailKey && row[emailKey]) {
          email = String(row[emailKey]).trim().toLowerCase()
        }
        if (!email) {
          for (const key of Object.keys(row)) {
            const cellStr = String(row[key] || "").trim()
            if (cellStr.includes("@") && cellStr.includes(".")) {
              email = cellStr.toLowerCase()
              break
            }
          }
        }
        if (email && email.includes("@")) {
          // Guardar datos por índice de fila
          dataMapByIndex[String(index)] = row
          records.push({
            email,
            rowIndex: index,
            rowData: row,
          })
        }

        if (index % 1000 === 0) {
          setProgress({ current: index, total: limitedData.length, phase: "Procesando datos..." })
        }
      })

      setCsvDataMap(dataMapByIndex)
      setEmailRecords(records)
      setParsingCsv(false)
      setProgress({ current: 0, total: 0, phase: "" })
    }
    reader.readAsText(file)
  }

  const clearCsv = () => {
    setCsvDataMap({})
    setCsvHeaders([])
    setCsvFileName("")
    setCsvRecordCount(0)
    setEmailRecords([])
    setPastedEmails("")
    if (csvInputRef.current) {
      csvInputRef.current.value = ""
    }
  }

  const handlePastedEmailsChange = (value: string) => {
    setPastedEmails(value)

    if (!value.trim()) {
      setCsvDataMap({})
      setCsvHeaders([])
      setCsvFileName("")
      setCsvRecordCount(0)
      setEmailRecords([])
      return
    }

    const seen = new Set<string>()
    const dataMapByIndex: Record<string, any> = {}
    const records: EmailRecord[] = []

    for (const line of value.split(/\r?\n/)) {
      const email = line.trim().toLowerCase()
      if (!email || !email.includes("@") || !email.includes(".") || isInvalidEmail(email)) continue
      if (seen.has(email)) continue
      if (records.length >= MAX_RECIPIENTS) break

      seen.add(email)
      const rowIndex = records.length
      const rowData = { email }
      dataMapByIndex[String(rowIndex)] = rowData
      records.push({ email, rowIndex, rowData })
    }

    setCsvDataMap(dataMapByIndex)
    setCsvHeaders(["email"])
    setCsvFileName("Lista pegada")
    setCsvRecordCount(records.length)
    setEmailRecords(records)
    if (csvInputRef.current) {
      csvInputRef.current.value = ""
    }
  }

  const handleTemplateChange = (value: MessageTemplateId) => {
    setSelectedTemplate(value)
    if (value === "custom") return

    const template = MESSAGE_TEMPLATES[value]
    setFormData((prev) => ({
      ...prev,
      subject: template.subject,
      content: template.content,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (emailRecords.length === 0) {
      alert("Sube un archivo CSV o pega una lista con direcciones de correo válidas.")
      return
    }

    setLoading(true)
    setProgress({ current: 0, total: 100, phase: "Creando campaña..." })

    const supabase = getSupabaseClient()

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        name: formData.name,
        subject: formData.subject,
        from_name: formData.fromName,
        from_email: formData.fromEmail,
        reply_to: formData.replyTo || formData.fromEmail,
        html_content: formData.content,
        content: formData.content,
        status: "draft",
        total_recipients: emailRecords.length,
      })
      .select()
      .single()

    if (error || !campaign) {
      alert("No se pudo crear la campaña: " + (error?.message || "Error desconocido"))
      setLoading(false)
      return
    }

    if (Object.keys(csvDataMap).length > 0) {
      setProgress({ current: 0, total: 1, phase: "Guardando datos del CSV..." })
      await saveCsvDataLarge(campaign.id, csvDataMap)
    }

    const BATCH_SIZE = 500
    const totalBatches = Math.ceil(emailRecords.length / BATCH_SIZE)
    let insertedCount = 0
    let errorCount = 0

    setProgress({ current: 0, total: emailRecords.length, phase: "Añadiendo destinatarios..." })

    for (let i = 0; i < emailRecords.length; i += BATCH_SIZE) {
      const batch = emailRecords.slice(i, i + BATCH_SIZE)
      const recipientRecords = batch.map((record) => ({
        campaign_id: campaign.id,
        email: record.email,
        row_index: record.rowIndex,
      }))

      let retries = 3
      let success = false

      while (retries > 0 && !success) {
        const { error: insertError } = await supabase.from("campaign_recipients").insert(recipientRecords)

        if (insertError) {
          console.error(`[v0] Error adding batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError.message)
          retries--
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            errorCount += batch.length
          }
        } else {
          success = true
          insertedCount += batch.length
        }
      }

      setProgress({
        current: Math.min(i + BATCH_SIZE, emailRecords.length),
        total: emailRecords.length,
        phase: `Añadiendo destinatarios... (${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches})`,
      })

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (errorCount > 0) {
      await supabase.from("campaigns").update({ total_recipients: insertedCount }).eq("id", campaign.id)

      alert(
        `Campaña creada con ${insertedCount.toLocaleString("es-ES")} destinatarios. No se pudieron añadir ${errorCount.toLocaleString("es-ES")} registros.`,
      )
    }

    router.push(`${portalPath}/campaigns/view/${campaign.id}`)
  }

  useEffect(() => {
    async function loadSourceCampaign() {
      if (!sourceCampaignId) return

      const supabase = getSupabaseClient()
      const { data: sourceCampaign } = await supabase.from("campaigns").select("*").eq("id", sourceCampaignId).single()

      if (sourceCampaign) {
        setSelectedTemplate("custom")
        setFormData((prev) => ({
          ...prev,
          name: `${sourceCampaign.name} (Copy)`,
          subject: sourceCampaign.subject || "",
          fromName: sourceCampaign.from_name || prev.fromName,
          fromEmail: sourceCampaign.from_email || prev.fromEmail,
          replyTo: sourceCampaign.reply_to || prev.replyTo,
          content: sourceCampaign.html_content || sourceCampaign.content || "",
        }))
      }
    }

    loadSourceCampaign()
  }, [sourceCampaignId, portalPath])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sender details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Información del remitente</CardTitle>
          <CardDescription>Elige la dirección desde la que se enviarán los correos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fromName">Nombre del remitente</Label>
            <Input
              id="fromName"
              value={formData.fromName}
              onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
              placeholder="Mi Empresa"
              className="bg-muted border-border"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromEmail">Correo del remitente</Label>
            <Input
              id="fromEmail"
              type="email"
              value={formData.fromEmail}
              onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
              placeholder="info@midominio.com"
              className="bg-muted border-border"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="replyTo">Dirección para respuestas</Label>
            <Input
              id="replyTo"
              type="email"
              value={formData.replyTo}
              onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
              placeholder="respuestas@midominio.com"
              className="bg-muted border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaign details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Detalles de la campaña</CardTitle>
          <CardDescription>
            Elige una plantilla, define el nombre y edita el asunto y el contenido antes de crear la campaña.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="messageTemplate">Mensaje</Label>
            <select
              id="messageTemplate"
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value as MessageTemplateId)}
              className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground"
            >
              <option value="commercial-analysis">{MESSAGE_TEMPLATES["commercial-analysis"].label}</option>
              <option value="clean-b2b-data">{MESSAGE_TEMPLATES["clean-b2b-data"].label}</option>
              <option value="custom">Personalizado / copia de campaña</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Al elegir una opción se cargan el asunto y el contenido en inglés. Puedes editarlos libremente.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la campaña</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Campaña de bienvenida"
              className="bg-muted border-border"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto del correo</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="¡Te damos la bienvenida a nuestra comunidad!"
              className="bg-muted border-border"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* CSV file — recipients and personalization data */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Destinatarios (CSV o lista pegada)
          </CardTitle>
          <CardDescription>
            Sube un archivo CSV con una columna «email» y datos adicionales para personalizar los mensajes, o pega una
            lista con un correo por renglón. Admite hasta 50000 registros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pastedEmails">Pegar lista de correos (uno por renglón)</Label>
            <Textarea
              id="pastedEmails"
              value={pastedEmails}
              onChange={(e) => handlePastedEmailsChange(e.target.value)}
              placeholder={"correo1@ejemplo.com\ncorreo2@ejemplo.com"}
              className="min-h-[120px] font-mono text-sm bg-muted border-border"
            />
            <p className="text-xs text-muted-foreground">
              Puedes copiar y pegar tus correos aquí sin archivo CSV. Se ignorarán líneas vacías, duplicados y correos no
              válidos.
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <input type="file" accept=".csv" onChange={handleCsvUpload} ref={csvInputRef} className="hidden" />
            <Button
              type="button"
              variant="outline"
              onClick={() => csvInputRef.current?.click()}
              disabled={parsingCsv}
              className="flex items-center gap-2"
            >
              {parsingCsv ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Cargar CSV
                </>
              )}
            </Button>
            {csvFileName && !parsingCsv && (
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{csvFileName}</span>
                <span className="text-xs text-muted-foreground">
                  ({csvRecordCount.toLocaleString("es-ES")} registros, {emailRecords.length.toLocaleString("es-ES")} correos)
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={clearCsv} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {parsingCsv && progress.total > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium text-foreground">{progress.phase}</p>
              <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.current.toLocaleString("es-ES")} / {progress.total.toLocaleString("es-ES")}
              </p>
            </div>
          )}

          {csvHeaders.length > 0 && !parsingCsv && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <Label className="text-foreground">Campos de personalización disponibles:</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {csvHeaders.map((header) => (
                  <Badge
                    key={header}
                    variant="secondary"
                    className="font-mono text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => navigator.clipboard.writeText(`{${header}}`)}
                  >
                    {`{${header}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Haz clic en un campo para copiarlo. Úsalo en el HTML para personalizar cada correo.
              </p>
            </div>
          )}

          {!csvFileName && !pastedEmails.trim() && (
            <div className="bg-muted/50 p-4 rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Requisitos del CSV:</strong> El archivo debe incluir una columna «email» con las direcciones de los destinatarios.
                Puedes añadir columnas como company_name o document_id para personalizar cada correo con campos como{" "}
                {"{company_name}"}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email content */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Contenido del correo</CardTitle>
          <CardDescription>
            Contenido en inglés cargado desde la plantilla seleccionada. Usa los campos del CSV para personalizarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Contenido HTML</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="<h1>¡Hola {company_name}!</h1><p>Tu documento {document_id} está listo...</p>"
              className="min-h-[250px] font-mono text-sm bg-muted border-border"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Form actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(portalPath)}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || emailRecords.length === 0}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {progress.phase || "Creando..."}
            </>
          ) : (
            `Crear campaña (${emailRecords.length.toLocaleString("es-ES")} correos)`
          )}
        </Button>
      </div>

      {loading && progress.total > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-foreground mb-2">{progress.phase}</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress.current.toLocaleString("es-ES")} / {progress.total.toLocaleString("es-ES")}
            </p>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
