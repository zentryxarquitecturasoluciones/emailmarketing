"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function PortalBSettings() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    default_from_name: "Data Zentryx",
    default_from_email: "zentryxarquitecturadesoluciones@gmail.com",
    default_reply_to: "zentryxarquitecturadesoluciones@gmail.com",
  })

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data } = await supabase.from("system_settings").select("*")

      if (data) {
        const settingsMap = data.reduce(
          (acc, curr) => {
            acc[curr.key] = curr.value
            return acc
          },
          {} as Record<string, string>,
        )

        setSettings((prev) => ({
          ...prev,
          ...settingsMap,
        }))
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("system_settings").upsert({ key, value }, { onConflict: "key" })
    }

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/portal-b">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Configuración</h1>
              <p className="text-xs text-muted-foreground">Data Zentryx Secundario · Campañas de respaldo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Configuración del remitente</CardTitle>
              <CardDescription>Valores predeterminados para las nuevas campañas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">Nombre del remitente</Label>
                <Input
                  id="fromName"
                  value={settings.default_from_name}
                  onChange={(e) => setSettings({ ...settings, default_from_name: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">Correo del remitente</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.default_from_email}
                  onChange={(e) => setSettings({ ...settings, default_from_email: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyTo">Dirección para respuestas</Label>
                <Input
                  id="replyTo"
                  type="email"
                  value={settings.default_reply_to}
                  onChange={(e) => setSettings({ ...settings, default_reply_to: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <Button onClick={handleSave} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : saved ? (
                  "Guardado"
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar configuración
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Información del portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Capacidad diaria</span>
                <span className="font-medium text-foreground">5.000 correos</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Tiempo de envío</span>
                <span className="font-medium text-foreground">1 hora</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
