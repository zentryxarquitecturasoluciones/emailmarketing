"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface TemplateFormProps {
  initialData?: {
    id?: string
    name: string
    subject: string
    content: string
  }
}

export function TemplateForm({ initialData }: TemplateFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    subject: initialData?.subject || "",
    content: initialData?.content || "",
  })

  const insertUnsubscribe = () => {
    const unsubscribeTag =
      '\n\n<p style="text-align: center; font-size: 12px; color: #999;"><a href="{{unsubscribe_url}}">Cancelar suscripción</a></p>'
    setFormData((prev) => ({ ...prev, content: prev.content + unsubscribeTag }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (initialData?.id) {
        // Update existing
        const { error } = await supabase
          .from("email_templates")
          .update({
            name: formData.name,
            subject: formData.subject,
            content: formData.content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase.from("email_templates").insert({
          name: formData.name,
          subject: formData.subject,
          content: formData.content,
        })

        if (error) throw error
      }

      router.push("/templates")
      router.refresh()
    } catch (error) {
      console.error("Error saving template:", error)
      alert("No se pudo guardar la plantilla.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData?.id ? "Editar plantilla" : "Nueva plantilla"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la plantilla</Label>
            <Input
              id="name"
              placeholder="Ej.: Boletín mensual"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto predeterminado</Label>
            <Input
              id="subject"
              placeholder="Ej.: Novedades de Data Zentryx"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenido HTML</Label>
            <div className="relative">
              <Textarea
                id="content"
                placeholder="<h1>Hola!</h1>..."
                className="min-h-[300px] font-mono text-sm"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  Insertar enlace para cancelar la suscripción
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Redacta en español el correo que recibirán tus destinatarios. Añade <code>{"{{unsubscribe_url}}"}</code>
              donde quieras que aparezca el enlace para cancelar la suscripción.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/50 p-4">
          <Link href="/templates">
            <Button variant="ghost" type="button">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-lime-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar plantilla
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
