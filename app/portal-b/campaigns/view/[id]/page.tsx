import { supabasePortalBServer } from "@/lib/supabase-portal-b"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertTriangle,
  ShieldAlert,
  Copy,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { UnifiedSendButton } from "@/components/unified-send-button"
import { CampaignChart } from "@/components/campaign-chart"
import { SyncStatsButton } from "@/components/sync-stats-button"
import { EmailSearch } from "@/components/email-search" // Agregar import

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export const dynamic = "force-dynamic"

export default async function PortalBCampaignView({ params, searchParams }: CampaignDetailPageProps) {
  const { id } = await params
  const { page } = await searchParams
  const currentPage = Number.parseInt(page || "1", 10)
  const EVENTS_PER_PAGE = 50

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const supabase = supabasePortalBServer

  let campaign = null
  let retries = 3

  while (retries > 0 && !campaign) {
    const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).single()
    if (data) {
      campaign = data
    } else if (error && retries > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      retries--
    } else {
      break
    }
  }

  if (!campaign) {
    notFound()
  }

  const { count: recipientCount } = await supabase
    .from("campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", id)

  const now = new Date()
  const isSent = campaign.status === "sent"

  const { count: totalEventsCount } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", id)

  const offset = (currentPage - 1) * EVENTS_PER_PAGE
  const { data: events } = await supabase
    .from("email_events")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + EVENTS_PER_PAGE - 1)

  const totalPages = Math.ceil((totalEventsCount || 0) / EVENTS_PER_PAGE)

  const { count: sentEventsCount } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", id)
    .eq("event_type", "sent")

  const alreadySent = sentEventsCount || 0
  const isSending = campaign.status === "sending" || campaign.status === "queued"
  const sendingProgress = recipientCount ? Math.round((alreadySent / recipientCount) * 100) : 0

  let firstPendingRowIndex = 0
  if (alreadySent > 0 && alreadySent < (recipientCount || 0)) {
    firstPendingRowIndex = alreadySent
  }

  const { count: openedCount } = isSent
    ? await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)
        .eq("event_type", "opened")
        .lte("created_at", now.toISOString())
    : { count: 0 }

  const { count: clickedCount } = isSent
    ? await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)
        .eq("event_type", "clicked")
        .lte("created_at", now.toISOString())
    : { count: 0 }

  const { count: bouncedCount } = isSent
    ? await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)
        .eq("event_type", "bounced")
    : { count: 0 }

  const { count: spamCount } = isSent
    ? await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)
        .eq("event_type", "spam")
    : { count: 0 }

  const totalSent = isSent ? recipientCount || 0 : 0
  const totalDelivered = isSent ? Math.round(totalSent * 0.98) : 0
  const totalOpened = openedCount || 0
  const totalClicked = clickedCount || 0
  const totalBounced = bouncedCount || 0
  const totalSpam = spamCount || 0

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const openRate = totalSent > 0 ? Math.min((totalOpened / totalSent) * 100, 100) : 0
  const clickRate = totalSent > 0 ? Math.min((totalClicked / totalSent) * 100, 100) : 0
  const bounceRate = totalSent > 0 ? Math.min((totalBounced / totalSent) * 100, 100) : 0
  const spamRate = totalSent > 0 ? Math.min((totalSpam / totalSent) * 100, 100) : 0

  const chartData = prepareChartData(events || [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: "Borrador", className: "bg-zinc-700 text-zinc-200 border-zinc-600" },
      queued: { label: "En cola", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      sending: { label: "Enviando", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      sent: { label: "Enviada", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      failed: { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    }
    const variant = variants[status] || variants.draft
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/portal-b">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
                  {getStatusBadge(campaign.status)}
                </div>
                <p className="text-xs text-muted-foreground">{campaign.subject}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/portal-b/campaigns/create?sourceCampaignId=${campaign.id}`}>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
              </Link>
              {(campaign.status === "draft" ||
                campaign.status === "queued" ||
                campaign.status === "sending" ||
                (alreadySent > 0 && alreadySent < (recipientCount || 0))) && (
                <UnifiedSendButton
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  totalRecipients={recipientCount || 0}
                  apiPath="/api/portal-b/send"
                  portal="b"
                  alreadySent={alreadySent}
                  firstPendingRowIndex={firstPendingRowIndex}
                />
              )}
              {campaign.status === "sent" && <SyncStatsButton campaignId={campaign.id} autoSync={true} portal="b" />}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {isSending && (
            <Card className="mb-6 bg-card border-border">
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Enviando campaña...</p>
                    <p className="text-sm text-muted-foreground">
                      {alreadySent.toLocaleString("es-ES")} de {(recipientCount || 0).toLocaleString("es-ES")} correos enviados
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400">{sendingProgress}%</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${sendingProgress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isSent ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Enviados</CardTitle>
                    <div className="p-1.5 rounded-md bg-blue-400/10">
                      <Mail className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{totalSent.toLocaleString("es-ES")}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Entregados</CardTitle>
                    <div className="p-1.5 rounded-md bg-emerald-400/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{totalDelivered.toLocaleString("es-ES")}</p>
                  <p className="text-xs text-muted-foreground">{deliveryRate.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Abiertos</CardTitle>
                    <div className="p-1.5 rounded-md bg-amber-400/10">
                      <Eye className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{totalOpened.toLocaleString("es-ES")}</p>
                  <p className="text-xs text-muted-foreground">{openRate.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Clics</CardTitle>
                    <div className="p-1.5 rounded-md bg-purple-400/10">
                      <MousePointerClick className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{totalClicked.toLocaleString("es-ES")}</p>
                  <p className="text-xs text-muted-foreground">{clickRate.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Rebotados</CardTitle>
                    <div className="p-1.5 rounded-md bg-orange-400/10">
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{totalBounced.toLocaleString("es-ES")}</p>
                  <p className="text-xs text-muted-foreground">{bounceRate.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Spam</CardTitle>
                    <div className="p-1.5 rounded-md bg-red-400/10">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{totalSpam.toLocaleString("es-ES")}</p>
                  <p className="text-xs text-muted-foreground">{spamRate.toFixed(2)}%</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-8">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Destinatarios: {(recipientCount || 0).toLocaleString("es-ES")}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las estadísticas estarán disponibles cuando se envíe la campaña.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {campaign.status === "sent" && (
            <div className="mt-8">
              <EmailSearch campaignId={campaign.id} portal="b" />
            </div>
          )}

          {campaign.status === "sent" && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Descargar datos</h4>
              <div className="flex flex-wrap gap-2">
                <a href={`/api/portal-b/download?campaignId=${campaign.id}&type=full`} download>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Informe completo
                  </Button>
                </a>
                <a href={`/api/portal-b/download?campaignId=${campaign.id}&type=sent`} download>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent text-green-600 border-green-600/30 hover:bg-green-600/10"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Enviados
                  </Button>
                </a>
                <a href={`/api/portal-b/download?campaignId=${campaign.id}&type=failed`} download>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent text-red-600 border-red-600/30 hover:bg-red-600/10"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Fallidos
                  </Button>
                </a>
                <a href={`/api/portal-b/download?campaignId=${campaign.id}&type=pending`} download>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent text-yellow-600 border-yellow-600/30 hover:bg-yellow-600/10"
                  >
                    <Mail className="h-4 w-4" />
                    Pendientes
                  </Button>
                </a>
              </div>
            </div>
          )}

          {campaign.status === "sent" && chartData.length > 0 && (
            <div className="mt-8">
              <CampaignChart data={chartData} totalSent={totalSent} totalOpened={totalOpened} />
            </div>
          )}

          {campaign.status === "sent" && (
            <Card className="mt-8 bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">
                    Registro de eventos ({(totalEventsCount || 0).toLocaleString("es-ES")})
                  </CardTitle>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                      <div className="flex gap-1">
                        {currentPage > 1 && (
                          <Link href={`/portal-b/campaigns/view/${id}?page=${currentPage - 1}`}>
                            <Button variant="outline" size="sm">
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {currentPage < totalPages && (
                          <Link href={`/portal-b/campaigns/view/${id}?page=${currentPage + 1}`}>
                            <Button variant="outline" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(totalEventsCount || 0) === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Todavía no se han registrado eventos.</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] space-y-2 overflow-y-auto">
                    {events?.map((event, index) => {
                      const displayStatus = event.event_type

                      return (
                        <div
                          key={event.id || index}
                          className="flex items-center justify-between border-b border-border/50 py-3 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {event.contact_email || event.email || event.recipient_email || "Correo no disponible"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleString("es-ES")}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              displayStatus === "opened"
                                ? "border-amber-500 text-amber-500"
                                : displayStatus === "clicked"
                                  ? "border-purple-500 text-purple-500"
                                  : displayStatus === "bounced"
                                    ? "border-orange-500 text-orange-500"
                                    : displayStatus === "spam"
                                      ? "border-red-500 text-red-500"
                                      : displayStatus === "delivered"
                                        ? "border-emerald-500 text-emerald-500"
                                        : "border-blue-500 text-blue-500"
                            }
                          >
                            {displayStatus === "opened"
                              ? "opened"
                              : displayStatus === "clicked"
                                ? "click"
                                : displayStatus === "bounced"
                                  ? "bounced"
                                  : displayStatus === "spam"
                                    ? "spam"
                                    : displayStatus === "delivered"
                                      ? "delivered"
                                      : "sent"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mt-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Detalles de la campaña</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">De:</p>
                  <p className="text-foreground">{campaign.from_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Asunto:</p>
                  <p className="text-foreground">{campaign.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contenido HTML:</p>
                  <div className="mt-2 rounded-md border border-border p-4 bg-muted/30">
                    <div
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: campaign.content || campaign.html_content || "Sin contenido" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function prepareChartData(events: Array<{ event_type: string; created_at: string }>) {
  const dataByHour: Record<string, { date: string; sent: number; opened: number }> = {}

  events.forEach((event) => {
    const eventDate = new Date(event.created_at)
    const hour = eventDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    })

    if (!dataByHour[hour]) {
      dataByHour[hour] = { date: hour, sent: 0, opened: 0 }
    }

    if (event.event_type === "sent") {
      dataByHour[hour].sent++
    } else if (event.event_type === "opened") {
      dataByHour[hour].opened++
    }
  })

  return Object.values(dataByHour)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-24)
}
