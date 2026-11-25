import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { TemplateForm } from "@/components/template-form"
import { notFound } from "next/navigation"

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: template } = await supabase.from("email_templates").select("*").eq("id", params.id).single()

  if (!template) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <TemplateForm initialData={template} />
        </div>
      </main>
    </div>
  )
}
