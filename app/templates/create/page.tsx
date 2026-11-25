import { Header } from "@/components/header"
import { TemplateForm } from "@/components/template-form"

export default function CreateTemplatePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <TemplateForm />
        </div>
      </main>
    </div>
  )
}
