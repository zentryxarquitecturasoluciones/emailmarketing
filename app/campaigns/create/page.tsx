import { CampaignForm } from "@/components/campaign-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

export default function NewCampaignPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const sourceCampaignId = typeof searchParams.sourceCampaignId === "string" ? searchParams.sourceCampaignId : undefined

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm overflow-hidden">
              <img
                src="/logo_zentryx.png"
                alt="Data Zentryx logo"
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Nueva campaña</h1>
              <p className="text-xs text-muted-foreground">Crea y envía una nueva campaña de correo electrónico.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<div>Cargando...</div>}>
            <CampaignForm sourceCampaignId={sourceCampaignId} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
