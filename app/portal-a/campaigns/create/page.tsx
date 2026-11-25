import { UnifiedCampaignForm } from "@/components/unified-campaign-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

export default async function PortalACreateCampaign({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const sourceCampaignId =
    typeof resolvedSearchParams.sourceCampaignId === "string" ? resolvedSearchParams.sourceCampaignId : undefined

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/portal-a">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Nueva campaña</h1>
              <p className="text-xs text-muted-foreground">Principal Local · Campañas de alto volumen</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="text-muted-foreground">Cargando...</div>}>
            <UnifiedCampaignForm
              sourceCampaignId={sourceCampaignId}
              portalPath="/portal-a"
              defaultFromName="Data Zentryx"
              defaultFromEmail="zentryxarquitecturadesoluciones@gmail.com"
              defaultReplyTo="zentryxarquitecturadesoluciones@gmail.com"
            />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
