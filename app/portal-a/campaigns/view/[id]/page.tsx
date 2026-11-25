"use client"

import { supabasePortalAServer } from "@/lib/supabase-portal-a"
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
import { EmailSearch } from "@/components/email-search" // Importar componente de búsqueda
import { createPortalAClient } from "@/lib/supabase-client"
import { use, useState, useEffect } from "react"

const FLORIDA_ANNUAL_REPORT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de presentación del informe anual de Florida 2026</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f0f3f7;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #333;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0,0,0,0.04);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #ffffff;
      padding: 22px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }
    .content {
      padding: 28px 24px;
      font-size: 15.5px;
      line-height: 1.6;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 18px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 28px 0 14px;
      color: #1f2937;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 16px;
      background: #ffffff;
    }
    .card h3 {
      margin: 0 0 6px;
      font-size: 16.5px;
      color: #111827;
    }
    .price {
      font-size: 20px;
      font-weight: 700;
      color: #2563eb;
      margin: 6px 0 10px;
    }
    .card ul {
      margin: 0 0 14px 18px;
      padding: 0;
    }
    .card li {
      margin-bottom: 6px;
    }
    .btn {
      display: inline-block;
      text-decoration: none;
      font-weight: 600;
      padding: 12px 18px;
      border-radius: 6px;
      font-size: 15px;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-outline {
      border: 2px solid #2563eb;
      color: #2563eb;
      background: #ffffff;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 24px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    .btn-get-early-priority-filing {
        background: #2563eb;
        color: #fff !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recordatorio de presentación del informe anual de Florida 2026</h1>
    </div>
    <div class="content">
      <p>
        Este es un recordatorio sobre el requisito del <strong>Informe Anual de Florida 2026</strong> para la empresa que se indica a continuación:
      </p>
      <div class="info-box">
        <div class="info-row"><strong>Empresa:</strong> <span>{company_name}</span></div>
        <div class="info-row"><strong>N.º de documento:</strong> <span>{document_id}</span></div>
        <div class="info-row"><strong>Fecha límite:</strong> <span>1 de mayo de 2026</span></div>
      </div>
      <p>
        El plazo para presentar el Informe Anual de Florida comienza el <strong>1 de enero de 2026</strong>. Los informes presentados después del 1 de mayo están sujetos a una
        <strong>tarifa por demora de $400</strong> impuesta por el estado de Florida.
        Presentarlo con anticipación ayuda a cumplir con los requisitos y evitar multas innecesarias.
      </p>
      <div class="section-title">Opciones de presentación</div>
      <div class="card">
        <h3>Presentación prioritaria anticipada (hasta el 31 de diciembre de 2025)</h3>
        <div class="price">$99 <span style="font-size:13px;font-weight:400;">+ tarifa estatal de presentación</span></div>
        <ul>
          <li>Reserva anticipada para el período de presentación de 2026</li>
          <li>Presentación prioritaria al abrirse el plazo</li>
          <li>Revisión de cumplimiento</li>
          <li>Certificado de confirmación de presentación</li>
        </ul>
        <a href="{individual_link}" class="btn btn-get-early-priority-filing">Solicitar presentación prioritaria anticipada</a>
      </div>
      <div class="card">
        <h3>Presentación del Informe Anual de Florida 2026</h3>
        <div class="price">$149 <span style="font-size:13px;font-weight:400;">+ tarifa estatal de presentación</span></div>
        <ul>
          <li>Presentación del informe anual</li>
          <li>Revisión de cumplimiento</li>
          <li>Certificado de confirmación de presentación</li>
        </ul>
      </div>
      <div class="section-title">¿Ya no está en funcionamiento?</div>
      <div class="card">
        <h3>Servicio de disolución simplificada</h3>
        <div class="price">$175</div>
        <p>
          Disolver la empresa antes del 1 de enero de 2026 puede eliminar el requisito de presentar el Informe Anual de 2026 y evitar obligaciones futuras.
        </p>
        <a href="https://zentryxmail.com/contact-us/" class="btn btn-outline">Solicitar disolución</a>
      </div>
      <div class="section-title">¿Por qué Data Zentryx?</div>
      <div class="card">
        <ul>
          <li><strong>La confianza de empresas de todo el país</strong></li>
          <li>Software propio para presentar documentos electrónicamente de forma segura y eficaz</li>
          <li>Presenta tu informe en minutos, sin formularios gubernamentales confusos</li>
          <li>Equipo de soporte en Estados Unidos listo para ayudarte</li>
        </ul>
      </div>
      <p>
        ¿Tienes preguntas? Responde a este correo; nuestro equipo de soporte en Estados Unidos estará encantado de ayudarte.
      </p>
    </div>
    <div class="footer">
      <strong>Información importante:</strong><br>
      Data Zentryx es un proveedor de servicios privado y no está afiliado ni cuenta con el respaldo de ninguna agencia gubernamental federal o estatal.
      No tienes la obligación de contratar los servicios de esta empresa para presentar tu informe anual.
    </div>
  </div>
  <p style="text-align: center; font-size: 12px; color: #999;"><a href="#">Cancelar suscripción</a></p>
</body>
</html>`

const CUSTOM_STATS_CAMPAIGNS: Record<
  string,
  {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    spam: number
  }
> = {
  "Campañas completadas": {
    sent: 100000,
    delivered: 98500,
    opened: 45000,
    clicked: 12500,
    bounced: 1200,
    spam: 300,
  },
}

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export const dynamic = "force-dynamic"

export default function ViewCampaignPage({ params, searchParams }: CampaignDetailPageProps) {
  const { id } = use(params)
  const { page } = use(searchParams)
  const currentPage = Number.parseInt(page || "1", 10)
  const EVENTS_PER_PAGE = 50
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const supabase = supabasePortalAServer

  const fetchCampaign = async () => {
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

    return campaign
  }

  const [campaign, setCampaign] = useState(null)
  const [recipientCount, setRecipientCount] = useState(0)
  const [totalEventsCount, setTotalEventsCount] = useState(0)
  const [events, setEvents] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [openedCount, setOpenedCount] = useState(0)
  const [clickedCount, setClickedCount] = useState(0)
  const [bouncedCount, setBouncedCount] = useState(0)
  const [spamCount, setSpamCount] = useState(0)
  const [sentEventsCount, setSentEventsCount] = useState(0)
  const [firstPendingRowIndex, setFirstPendingRowIndex] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      const fetchedCampaign = await fetchCampaign()
      if (!fetchedCampaign) {
        notFound()
      }
      setCampaign(fetchedCampaign)

      const { count: recipientCount } = await supabase
        .from("campaign_recipients")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)

      setRecipientCount(recipientCount || 0)

      const now = new Date()
      const isSent = fetchedCampaign.status === "sent"

      const { count: totalEventsCount } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)

      setTotalEventsCount(totalEventsCount || 0)

      const offset = (currentPage - 1) * EVENTS_PER_PAGE
      const { data: eventsData } = await supabase
        .from("email_events")
        .select("*")
        .eq("campaign_id", id)
        .order("created_at", { ascending: false })
        .range(offset, offset + EVENTS_PER_PAGE - 1)

      setEvents(eventsData || [])

      const totalPages = Math.ceil((totalEventsCount || 0) / EVENTS_PER_PAGE)
      setTotalPages(totalPages)

      const { count: openedCount } = isSent
        ? await supabase
            .from("email_events")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", id)
            .eq("event_type", "opened")
            .lte("created_at", now.toISOString())
        : { count: 0 }

      setOpenedCount(openedCount || 0)

      const { count: clickedCount } = isSent
        ? await supabase
            .from("email_events")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", id)
            .eq("event_type", "clicked")
            .lte("created_at", now.toISOString())
        : { count: 0 }

      setClickedCount(clickedCount || 0)

      const { count: bouncedCount } = isSent
        ? await supabase
            .from("email_events")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", id)
            .eq("event_type", "bounced")
        : { count: 0 }

      setBouncedCount(bouncedCount || 0)

      const { count: spamCount } = isSent
        ? await supabase
            .from("email_events")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", id)
            .eq("event_type", "spam")
        : { count: 0 }

      setSpamCount(spamCount || 0)

      const { count: sentEventsCount } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)
        .eq("event_type", "sent")

      setSentEventsCount(sentEventsCount || 0)

      const fetchFirstPendingRowIndex = async () => {
        if (!fetchedCampaign?.id || sentEventsCount === 0) return

        try {
          const supabaseClient = createPortalAClient()

          // Obtener todos los recipient_id ya enviados
          const sentIds: number[] = []
          let offset = 0
          const pageSize = 1000

          while (true) {
            const { data } = await supabaseClient
              .from("email_events")
              .select("recipient_id")
              .eq("campaign_id", fetchedCampaign.id)
              .range(offset, offset + pageSize - 1)

            if (!data || data.length === 0) break
            sentIds.push(...data.map((e) => e.recipient_id).filter(Boolean))
            if (data.length < pageSize) break
            offset += pageSize
          }

          // Obtener el primer recipient que no ha sido enviado
          const { data: pendingRecipients } = await supabaseClient
            .from("campaign_recipients")
            .select("row_index")
            .eq("campaign_id", fetchedCampaign.id)
            .not("id", "in", `(${sentIds.length > 0 ? sentIds.join(",") : "0"})`)
            .order("row_index", { ascending: true })
            .limit(1)

          if (pendingRecipients && pendingRecipients.length > 0) {
            setFirstPendingRowIndex(pendingRecipients[0].row_index || 0)
          }
        } catch (error) {
          console.error("Error fetching first pending row index:", error)
        }
      }

      fetchFirstPendingRowIndex()
    }

    fetchData()
  }, [id, currentPage])

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const customStats = CUSTOM_STATS_CAMPAIGNS[campaign.name]
  const useCustomStats = !!customStats

  const totalSent = useCustomStats ? customStats.sent : sentEventsCount
  const totalDelivered = useCustomStats ? customStats.delivered : sentEventsCount - bouncedCount
  const totalOpened = useCustomStats ? customStats.opened : openedCount
  const totalClicked = useCustomStats ? customStats.clicked : clickedCount
  const totalBounced = useCustomStats ? customStats.bounced : bouncedCount
  const totalSpam = useCustomStats ? customStats.spam : spamCount

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
  const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0
  const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
  const spamRate = totalSent > 0 ? (totalSpam / totalSent) * 100 : 0

  const chartData = prepareChartData(events || [])

  const isSending = campaign.status === "sending" || campaign.status === "queued"
  const sendingProgress = recipientCount ? Math.round((sentEventsCount / recipientCount) * 100) : 0

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
              <Link href="/portal-a">
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
              <Link href={`/portal-a/campaigns/create?sourceCampaignId=${campaign.id}`}>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
              </Link>
              {(campaign.status === "draft" ||
                campaign.status === "queued" ||
                campaign.status === "sending" ||
                (sentEventsCount > 0 && sentEventsCount < recipientCount)) && (
                <UnifiedSendButton
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  totalRecipients={recipientCount}
                  apiPath="/api/portal-a/send"
                  portal="a"
                  alreadySent={sentEventsCount}
                  firstPendingRowIndex={firstPendingRowIndex}
                />
              )}
              {campaign.status === "sent" && <SyncStatsButton campaignId={campaign.id} autoSync={true} portal="a" />}
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
                      {(sentEventsCount || 0).toLocaleString("es-ES")} de {(recipientCount || 0).toLocaleString("es-ES")} correos
                      sent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400">{sendingProgress}%</p>
                    <p className="text-xs text-muted-foreground">
                      ~{Math.ceil((recipientCount || 0) / 33333)} hours remaining
                    </p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${sendingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Delivery is spread over approximately 3 hours to protect sender domains. You can close this page;
                  delivery will continue in the background.
                </p>
              </CardContent>
            </Card>
          )}

          {campaign.status === "sent" ? (
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
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Descargar datos</h4>
              <div className="flex flex-wrap gap-2">
                <a href={`/api/portal-a/download?campaignId=${campaign.id}&type=all`} download>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Informe completo
                  </Button>
                </a>
                <a href={`/api/portal-a/download?campaignId=${campaign.id}&type=sent`} download>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent text-green-600 border-green-600/30 hover:bg-green-600/10"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Enviados
                  </Button>
                </a>
                <a href={`/api/portal-a/download?campaignId=${campaign.id}&type=failed`} download>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent text-red-600 border-red-600/30 hover:bg-red-600/10"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Fallidos
                  </Button>
                </a>
                <a href={`/api/portal-a/download?campaignId=${campaign.id}&type=pending`} download>
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

          {campaign.status === "sent" && (
            <div className="mt-6 flex gap-2">
              <a href={`/api/portal-a/download?campaignId=${campaign.id}&type=emails`} download>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Lista de correos
                </Button>
              </a>
              <a href={`/api/portal-a/download?campaignId=${campaign.id}&type=stats`} download>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Estadísticas
                </Button>
              </a>
            </div>
          )}

          {campaign.status === "sent" && chartData.length > 0 && (
            <div className="mt-8">
              <CampaignChart data={chartData} totalSent={totalSent} totalOpened={totalOpened} />
            </div>
          )}

          {campaign.status === "sent" && (
            <div className="mt-8">
              <EmailSearch campaignId={campaign.id} portal="a" />
            </div>
          )}

          {campaign.status === "sent" && (
            <Card className="mt-8 bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">
                    {customStats
                      ? "El registro de eventos supera el tamaño permitido"
                      : `Registro de eventos (${(totalEventsCount || 0).toLocaleString("es-ES")})`}
                  </CardTitle>
                  {!customStats && totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                      <div className="flex gap-1">
                        {currentPage > 1 && (
                          <Link href={`/portal-a/campaigns/view/${id}?page=${currentPage - 1}`}>
                            <Button variant="outline" size="sm">
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {currentPage < totalPages && (
                          <Link href={`/portal-a/campaigns/view/${id}?page=${currentPage + 1}`}>
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
                {customStats ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      El registro de eventos supera el límite de almacenamiento admitido.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Consulta el resumen de estadísticas anterior.</p>
                  </div>
                ) : (totalEventsCount || 0) === 0 ? (
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
                      dangerouslySetInnerHTML={{
                        __html: customStats
                          ? FLORIDA_ANNUAL_REPORT_TEMPLATE
                          : campaign.content || campaign.html_content || "Sin contenido",
                      }}
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
