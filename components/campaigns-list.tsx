"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  total_recipients: number
  sent_count: number
  opened_count: number
  clicked_count: number
  created_at: string
  sent_at: string | null
}

interface CampaignsListProps {
  campaigns: Campaign[]
  basePath?: string // Added basePath prop for multi-portal support
}

export function CampaignsList({ campaigns: initialCampaigns, basePath = "" }: CampaignsListProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)

  const deleteCampaign = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta campaña?")) return

    const supabase = createClient()
    const { error } = await supabase.from("campaigns").delete().eq("id", id)

    if (!error) {
      setCampaigns(campaigns.filter((c) => c.id !== id))
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: "Borrador", className: "bg-secondary text-secondary-foreground" },
      sending: { label: "Enviando", className: "bg-blue-500/10 text-blue-500" },
      sent: { label: "Enviada", className: "bg-accent/10 text-accent" },
      failed: { label: "Error", className: "bg-destructive/10 text-destructive" },
    }

    const variant = variants[status] || variants.draft
    return (
      <Badge className={variant.className} variant="secondary">
        {variant.label}
      </Badge>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Aún no hay campañas. Crea tu primera campaña para comenzar.</p>
          <Link href={`${basePath}/campaigns/create`}>
            <Button className="mt-4">Crear mi primera campaña</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                  {getStatusBadge(campaign.status)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{campaign.subject}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Enviados: {campaign.sent_count}</span>
                  <span>Abiertos: {campaign.opened_count}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`${basePath}/campaigns/view/${campaign.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => deleteCampaign(campaign.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
