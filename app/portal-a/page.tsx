import { supabasePortalAServer } from "@/lib/supabase-portal-a"
import { PortalHeader } from "@/components/portal-header"
import { StatsCards } from "@/components/stats-cards"
import { CampaignsTable } from "@/components/campaigns-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { CampaignsBarChart } from "@/components/campaigns-bar-chart"
import { DelayTestButton } from "@/components/delay-test-button"
import { SocialIcons } from "@/components/social-icons"

export const dynamic = "force-dynamic"

export default async function PortalADashboard() {
  const supabase = supabasePortalAServer

  const { data: campaigns } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false })

  const totalCampaigns = campaigns?.length || 0

  const { count: totalRecipients } = await supabase
    .from("campaign_recipients")
    .select("*", { count: "exact", head: true })

  const totalSent = totalRecipients || 0
  const now = new Date()

  const last10Campaigns = (campaigns || []).slice(0, 10)

  const campaignsWithStats = await Promise.all(
    last10Campaigns.map(async (campaign) => {
      const { count: sentCount } = await supabase
        .from("campaign_recipients")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)

      const { count: openedCount } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("event_type", "opened")
        .lte("created_at", now.toISOString())

      const { count: clickedCount } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("event_type", "clicked")
        .lte("created_at", now.toISOString())

      const { count: bouncedCount } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("event_type", "bounced")

      const { count: spamCount } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("event_type", "spam")

      return {
        id: campaign.id,
        name: campaign.name,
        sent_count: sentCount || 0,
        opened_count: openedCount || 0,
        clicked_count: clickedCount || 0,
        bounced_count: bouncedCount || 0,
        spam_count: spamCount || 0,
      }
    }),
  )

  const { count: totalOpened } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "opened")
    .lte("created_at", now.toISOString())

  const { count: totalClicked } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "clicked")
    .lte("created_at", now.toISOString())

  const { count: totalBounced } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "bounced")

  const { count: totalSpam } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "spam")

  const openRate = totalSent > 0 ? Math.min(((totalOpened || 0) / totalSent) * 100, 100).toFixed(1) : "0"
  const clickRate = totalSent > 0 ? Math.min(((totalClicked || 0) / totalSent) * 100, 100).toFixed(1) : "0"
  const bounceRate = totalSent > 0 ? Math.min(((totalBounced || 0) / totalSent) * 100, 100).toFixed(1) : "0"
  const spamRate = totalSent > 0 ? Math.min(((totalSpam || 0) / totalSent) * 100, 100).toFixed(2) : "0"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader
        portalName="Principal Local"
        portalPath="/portal-a"
        logoUrl="/logo_zentryx.png"
      />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Panel principal</h2>
              <p className="text-muted-foreground mt-1">Envío principal de campañas</p>
            </div>
            <Link href="/portal-a/campaigns/create">
              <Button className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Nueva campaña
              </Button>
            </Link>
          </div>

          <div className="mb-10">
            <StatsCards
              totalCampaigns={totalCampaigns}
              totalSent={totalSent}
              openRate={openRate}
              clickRate={clickRate}
              bounceRate={bounceRate}
              spamRate={spamRate}
            />
          </div>

          <div className="mb-10">
            <CampaignsBarChart campaignsWithStats={campaignsWithStats} />
          </div>

          <CampaignsTable campaigns={campaigns || []} basePath="/portal-a" portal="a" />
        </div>
      </main>

      <footer className="py-4 text-center space-y-3">
        <div>
          <DelayTestButton portal="a" />
        </div>
        <SocialIcons />
      </footer>
    </div>
  )
}
