import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has("dashboard-auth")

  if (!isAuthenticated) {
    redirect("/login")
  }

  const supabase = await createClient()
  const { data: settings } = await supabase.from("system_settings").select("*")

  // Convert array to object for easier usage
  const settingsMap =
    settings?.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value
        return acc
      },
      {} as Record<string, string>,
    ) || {}

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración del sistema</h1>
        <p className="text-gray-500 mt-2">Administra la configuración global de la aplicación desde aquí.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de envío de correo</CardTitle>
          <CardDescription>Estos valores se usarán de forma predeterminada al crear campañas.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initialSettings={settingsMap} />
        </CardContent>
      </Card>
    </div>
  )
}
