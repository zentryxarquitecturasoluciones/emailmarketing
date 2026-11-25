import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, CheckCircle2, Eye, Copy } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SendCampaignButton } from "@/components/send-campaign-button"
import { CampaignChart } from "@/components/campaign-chart"
import { SyncStatsButton } from "@/components/sync-stats-button"

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const supabase = await createClient()

  let campaign
  try {
    const { data } = await supabase.from("campaigns").select("*").eq("id", id).single()
    campaign = data
  } catch (error) {
    notFound()
  }

  if (!campaign) {
    notFound()
  }

  const { count: recipientCount } = await supabase
    .from("campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", id)

  const { data: events } = await supabase
    .from("email_events")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })

  const sentEvents = events?.filter((e) => e.event_type === "sent") || []
  const openedEvents = events?.filter((e) => e.event_type === "opened") || []

  const totalSent = campaign.total_sent || sentEvents.length
  const totalDelivered = sentEvents.length // Todos los "sent" son entregados
  const totalOpened = openedEvents.length

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0

  const chartData = prepareChartData(events || [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: "Borrador", className: "bg-zinc-800 text-zinc-200" },
      sending: { label: "Enviando", className: "bg-blue-500/20 text-blue-400" },
      sent: { label: "Enviada", className: "bg-emerald-500/20 text-emerald-400" },
      failed: { label: "Error", className: "bg-red-500/20 text-red-400" },
    }

    const variant = variants[status] || variants.draft
    return (
      <Badge className={variant.className} variant="secondary">
        {variant.label}
      </Badge>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "rgb(15, 23, 42)" }}>
      <header
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{
          borderColor: "rgb(30, 41, 59)",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" style={{ color: "rgb(226, 232, 240)" }}>
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
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold" style={{ color: "rgb(248, 250, 252)" }}>
                    {campaign.name}
                  </h1>
                  {getStatusBadge(campaign.status)}
                </div>
                <p className="text-xs" style={{ color: "rgb(148, 163, 184)" }}>
                  {campaign.subject}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/campaigns/create?sourceCampaignId=${campaign.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700"
                >
                  <Copy className="h-4 w-4" />
                  Duplicar
                </Button>
              </Link>
              {campaign.status === "sent" && <SyncStatsButton campaignId={campaign.id} autoSync={true} />}
              {campaign.status === "draft" && (
                <SendCampaignButton campaignId={campaign.id} totalRecipients={recipientCount || 0} />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card style={{ backgroundColor: "rgb(30, 41, 59)", borderColor: "rgb(51, 65, 85)" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium" style={{ color: "rgb(148, 163, 184)" }}>
                    Total enviados
                  </CardTitle>
                  <Mail className="h-4 w-4" style={{ color: "rgb(59, 130, 246)" }} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" style={{ color: "rgb(248, 250, 252)" }}>
                  {totalSent}
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "rgb(30, 41, 59)", borderColor: "rgb(51, 65, 85)" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium" style={{ color: "rgb(148, 163, 184)" }}>
                    Entregados
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4" style={{ color: "rgb(16, 185, 129)" }} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" style={{ color: "rgb(248, 250, 252)" }}>
                  {totalDelivered}
                </p>
                <p className="mt-1 text-xs" style={{ color: "rgb(148, 163, 184)" }}>
                  {deliveryRate.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "rgb(30, 41, 59)", borderColor: "rgb(51, 65, 85)" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium" style={{ color: "rgb(148, 163, 184)" }}>
                    Abiertos
                  </CardTitle>
                  <Eye className="h-4 w-4" style={{ color: "rgb(236, 72, 153)" }} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" style={{ color: "rgb(248, 250, 252)" }}>
                  {totalOpened}
                </p>
                <p className="mt-1 text-xs" style={{ color: "rgb(148, 163, 184)" }}>
                  {openRate.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          </div>

          {campaign.status === "sent" && chartData.length > 0 && (
            <div className="mt-8">
              <CampaignChart data={chartData} />
            </div>
          )}

          <Card className="mt-8" style={{ backgroundColor: "rgb(30, 41, 59)", borderColor: "rgb(51, 65, 85)" }}>
            <CardHeader>
              <CardTitle style={{ color: "rgb(248, 250, 252)" }}>Detalles de la campaña</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "rgb(148, 163, 184)" }}>
                    De:
                  </p>
                  <p style={{ color: "rgb(226, 232, 240)" }}>{campaign.from_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "rgb(148, 163, 184)" }}>
                    Asunto:
                  </p>
                  <p style={{ color: "rgb(226, 232, 240)" }}>{campaign.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "rgb(148, 163, 184)" }}>
                    Contenido HTML:
                  </p>
                  <div
                    className="mt-2 rounded-md border p-4"
                    style={{
                      backgroundColor: "rgb(15, 23, 42)",
                      borderColor: "rgb(51, 65, 85)",
                    }}
                  >
                    <div
                      className="prose prose-invert max-w-none"
                      style={{ color: "rgb(226, 232, 240)" }}
                      dangerouslySetInnerHTML={{ __html: campaign.content || "Sin contenido" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaign.status === "sent" && (
            <Card className="mt-8" style={{ backgroundColor: "rgb(30, 41, 59)", borderColor: "rgb(51, 65, 85)" }}>
              <CardHeader>
                <CardTitle style={{ color: "rgb(248, 250, 252)" }}>Actividad de la campaña</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Barra de Entrega */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "rgb(226, 232, 240)" }}>
                      Delivery Rate
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "rgb(16, 185, 129)" }}>
                      {deliveryRate.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: "rgb(51, 65, 85)" }}
                  >
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${deliveryRate}%`,
                        backgroundColor: "rgb(16, 185, 129)",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "rgb(148, 163, 184)" }}>
                    {totalDelivered} de {totalSent} entregados
                  </p>
                </div>

                {/* Barra de Apertura */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "rgb(226, 232, 240)" }}>
                      Open Rate
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "rgb(236, 72, 153)" }}>
                      {openRate.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: "rgb(51, 65, 85)" }}
                  >
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${openRate}%`,
                        backgroundColor: "rgb(236, 72, 153)",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "rgb(148, 163, 184)" }}>
                    {totalOpened} de {totalSent} abiertos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {events && events.length > 0 && (
            <Card className="mt-8" style={{ backgroundColor: "rgb(30, 41, 59)", borderColor: "rgb(51, 65, 85)" }}>
              <CardHeader>
                <CardTitle style={{ color: "rgb(248, 250, 252)" }}>Registro de eventos ({events.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {events.slice(0, 50).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between border-b py-3 last:border-0"
                      style={{ borderColor: "rgb(51, 65, 85)" }}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: "rgb(226, 232, 240)" }}>
                          {event.recipient_email}
                        </p>
                        <p className="text-xs" style={{ color: "rgb(148, 163, 184)" }}>
                          {new Date(event.created_at).toLocaleString("es-ES")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor:
                            event.event_type === "opened"
                              ? "rgb(236, 72, 153)"
                              : event.event_type === "delivered"
                                ? "rgb(16, 185, 129)"
                                : "rgb(148, 163, 184)",
                          color:
                            event.event_type === "opened"
                              ? "rgb(236, 72, 153)"
                              : event.event_type === "delivered"
                                ? "rgb(16, 185, 129)"
                                : "rgb(148, 163, 184)",
                        }}
                      >
                        {event.event_type}
                      </Badge>
                    </div>
                  ))}
                  {events.length > 50 && (
                    <p className="pt-2 text-center text-xs" style={{ color: "rgb(148, 163, 184)" }}>
                      Showing 50 of {events.length} events
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

function prepareChartData(events: Array<{ event_type: string; created_at: string }>) {
  const dataByDate: Record<string, { date: string; sent: number; opened: number }> = {}

  events.forEach((event) => {
    const date = new Date(event.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })

    if (!dataByDate[date]) {
      dataByDate[date] = { date, sent: 0, opened: 0 }
    }

    if (event.event_type === "sent") {
      dataByDate[date].sent++
    } else if (event.event_type === "opened") {
      dataByDate[date].opened++
    }
  })

  return Object.values(dataByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
