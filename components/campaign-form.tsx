"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Save, FileText } from "lucide-react"
import { getTenantConfig } from "@/lib/tenant-config"

interface CampaignFormProps {
  sourceCampaignId?: string
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false

  const invalidDomains = ["example.com", "test.com", "invalid.com", "fake.com", "sample.com"]
  const domain = email.split("@")[1]?.toLowerCase()

  return !invalidDomains.includes(domain)
}

export function CampaignForm({ sourceCampaignId }: CampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [newTemplateName, setNewTemplateName] = useState("")
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const router = useRouter()
  const [tenantConfig, setTenantConfig] = useState(getTenantConfig())

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    fromName: "Data Zentryx",
    fromEmail: "zentryxarquitecturadesoluciones@gmail.com",
    replyTo: "zentryxarquitecturadesoluciones@gmail.com",
    htmlContent: "",
    recipientEmails: "",
  })

  useEffect(() => {
    const fetchSourceCampaign = async () => {
      if (!sourceCampaignId) return

      try {
        const supabase = createClient()
        const { data: campaign, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", sourceCampaignId)
          .single()

        if (error) throw error

        if (campaign) {
          setFormData((prev) => ({
            ...prev,
            name: `${campaign.name} (Copy)`,
            subject: campaign.subject,
            fromName: campaign.from_name || prev.fromName,
            fromEmail: campaign.from_email,
            replyTo: campaign.reply_to || prev.replyTo,
            htmlContent: campaign.content,
          }))
        }
      } catch (err) {
        // Silent error
      }
    }

    fetchSourceCampaign()
  }, [sourceCampaignId])

  useEffect(() => {
    const fetchSettings = async () => {
      if (sourceCampaignId) return

      const supabase = createClient()
      const { data: settings } = await supabase.from("system_settings").select("*")

      if (settings) {
        const settingsMap = settings.reduce(
          (acc: any, curr: any) => {
            acc[curr.key] = curr.value
            return acc
          },
          {} as Record<string, string>,
        )

        setFormData((prev) => {
          const newData = { ...prev }
          if (!prev.fromName || prev.fromName === "Data Zentryx") {
            newData.fromName = settingsMap.default_from_name || "Data Zentryx"
          }
          if (!prev.fromEmail || prev.fromEmail === "zentryxarquitecturadesoluciones@gmail.com") {
            newData.fromEmail = settingsMap.default_from_email || "zentryxarquitecturadesoluciones@gmail.com"
          }
          if (!prev.replyTo || prev.replyTo === "zentryxarquitecturadesoluciones@gmail.com") {
            newData.replyTo = settingsMap.default_reply_to || "zentryxarquitecturadesoluciones@gmail.com"
          }
          return newData
        })
      }
    }

    fetchSettings()
  }, [sourceCampaignId])

  useEffect(() => {
    const fetchTemplates = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("email_templates").select("*").order("created_at", { ascending: false })

      if (data) {
        setTemplates(data)
      }
    }

    fetchTemplates()
  }, [])

  useEffect(() => {
    const hostname = window.location.hostname
    setTenantConfig(getTenantConfig(hostname))
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setFormData((prev) => ({
        ...prev,
        subject: template.subject || prev.subject,
        htmlContent: template.content,
      }))
      setSelectedTemplate(templateId)
    }
  }

  const insertUnsubscribe = () => {
    const unsubscribeTag =
      '\n\n<p style="text-align: center; font-size: 12px; color: #999;"><a href="{{unsubscribe_url}}">Cancelar suscripción</a></p>'
    setFormData((prev) => ({ ...prev, htmlContent: prev.htmlContent + unsubscribeTag }))
  }

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          name: newTemplateName,
          subject: formData.subject,
          content: formData.htmlContent,
        })
        .select()
        .single()

      if (error) throw error

      setTemplates([data, ...templates])
      setNewTemplateName("")
      setIsSaveDialogOpen(false)
      alert("Plantilla guardada correctamente.")
    } catch (err) {
      alert("No se pudo guardar la plantilla.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const rawEmails = formData.recipientEmails
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email.length > 0)

      const validEmails = rawEmails.filter(isValidEmail)
      const invalidEmails = rawEmails.filter((email) => !isValidEmail(email))

      if (validEmails.length === 0) {
        throw new Error("No se encontraron direcciones de correo válidas. No uses dominios de ejemplo como example.com.")
      }

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          name: formData.name,
          subject: formData.subject,
          from_email: formData.fromEmail,
          reply_to: formData.replyTo || null,
          html_content: formData.htmlContent,
          status: "draft",
        })
        .select()
        .single()

      if (campaignError) {
        throw campaignError
      }

      const recipientsToInsert = validEmails.map((email) => ({
        campaign_id: campaign.id,
        email: email,
      }))

      const { error: recipientsError } = await supabase.from("campaign_recipients").insert(recipientsToInsert)

      if (recipientsError) {
        throw recipientsError
      }

      for (const email of validEmails) {
        await supabase.from("contacts").upsert({ email }, { onConflict: "email" })
      }

      if (invalidEmails.length > 0) {
        alert(
        `Campaña creada con ${validEmails.length} direcciones de correo válidas. Se omitieron ${invalidEmails.length} direcciones no válidas.`,
        )
      }

      router.push(`/campaigns/view/${campaign.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo crear la campaña.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Información de la campaña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la campaña</Label>
            <Input
              id="name"
              placeholder="Ej.: Boletín de diciembre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto del correo</Label>
            <Input
              id="subject"
              placeholder="Ej.: Ofertas especiales de diciembre"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fromName">Nombre del remitente</Label>
              <Input
                id="fromName"
                placeholder="Ej.: Data Zentryx"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">Correo del remitente</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="zentryxarquitecturadesoluciones@gmail.com"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Dirección para respuestas</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="Ej.: tu-correo@ejemplo.com"
                value={formData.replyTo}
                onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Plantillas
              </Label>

              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar como plantilla
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guardar nueva plantilla</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="templateName">Nombre de la plantilla</Label>
                    <Input
                      id="templateName"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Ej.: Promoción de verano"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveTemplate}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla guardada..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Al seleccionar una plantilla, se reemplazará el contenido actual.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="htmlContent">Contenido HTML</Label>
            <div className="relative">
              <Textarea
                id="htmlContent"
                placeholder="<h1>¡Hola!</h1><p>Este es el contenido de tu correo...</p>"
                className="font-mono text-sm min-h-[300px]"
                rows={10}
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                required
              />
              <div className="absolute bottom-2 right-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={insertUnsubscribe}
                  className="text-xs bg-white/80 backdrop-blur hover:bg-white"
                >
                  Insert Unsubscribe Link
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Redacta en español el correo que recibirán tus destinatarios. Usa <code>{"{{unsubscribe_url}}"}</code> para
              insertar el enlace de cancelación de suscripción.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmails">Lista de correos (uno por línea)</Label>
            <Textarea
              id="recipientEmails"
              placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
              className="font-mono text-sm"
              rows={8}
              value={formData.recipientEmails}
              onChange={(e) => setFormData({ ...formData, recipientEmails: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Pega las direcciones de correo, una por línea. No uses dominios de ejemplo como example.com.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear campaña"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
