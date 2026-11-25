import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Plantillas de correo</h1>
              <p className="text-muted-foreground">Administra diseños reutilizables para tus campañas.</p>
            </div>
            <Link href="/templates/create">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Nueva plantilla
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates?.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{template.subject || "Sin asunto"}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="rounded-md bg-muted p-4 text-xs text-muted-foreground h-32 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/90" />
                    {template.content.replace(/<[^>]*>?/gm, "").slice(0, 150)}...
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-muted/50 p-4">
                  <Link href={`/templates/${template.id}`}>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}

            {(!templates || templates.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <h3 className="mb-2 text-lg font-semibold">Aún no hay plantillas</h3>
                <p className="mb-4 text-muted-foreground">Crea tu primera plantilla para agilizar tus campañas.</p>
                <Link href="/templates/create">
                  <Button>Crear plantilla</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
