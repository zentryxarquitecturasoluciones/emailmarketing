"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"

interface SettingsFormProps {
  initialSettings: Record<string, string>
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState(initialSettings)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("system_settings").upsert(updates)

      if (error) throw error

      toast.success("Configuración guardada correctamente.")
      router.refresh()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("No se pudo guardar la configuración.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="default_from_name">Nombre predeterminado del remitente</Label>
          <Input
            id="default_from_name"
            value={settings.default_from_name || ""}
            onChange={(e) => handleChange("default_from_name", e.target.value)}
            placeholder="Ej.: Data Zentryx"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_from_email">Correo predeterminado del remitente</Label>
          <Input
            id="default_from_email"
            value={settings.default_from_email || ""}
            onChange={(e) => handleChange("default_from_email", e.target.value)}
            placeholder="e.g., support@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_reply_to">Correo para respuestas</Label>
          <Input
            id="default_reply_to"
            value={settings.default_reply_to || ""}
            onChange={(e) => handleChange("default_reply_to", e.target.value)}
            placeholder="e.g., support@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="daily_email_limit">Límite diario de correos</Label>
          <Input
            id="daily_email_limit"
            type="number"
            max={100000}
            value={settings.daily_email_limit || "100000"}
            onChange={(e) => handleChange("daily_email_limit", e.target.value)}
            placeholder="100000"
          />
          <p className="text-xs text-muted-foreground">Máximo: 100.000 correos al día</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="bg-[#0d120b] hover:bg-[#1d2b12]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
