"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

interface CampaignWithStats {
  id: string
  name: string
  sent_count: number
  opened_count: number
  clicked_count?: number
  bounced_count?: number
  spam_count?: number
}

interface CampaignsBarChartProps {
  campaignsWithStats: CampaignWithStats[]
}

export function CampaignsBarChart({ campaignsWithStats }: CampaignsBarChartProps) {
  const chartData = campaignsWithStats.slice(0, 10).map((campaign) => {
    const sent = campaign.sent_count || 0
    const opened = campaign.opened_count || 0
    const clicks = campaign.clicked_count || 0
    const bounced = campaign.bounced_count || 0
    const spam = campaign.spam_count || 0
    const delivered = Math.max(sent - bounced, 0)

    return {
      name: campaign.name.length > 12 ? campaign.name.substring(0, 12) + "..." : campaign.name,
      Enviados: sent,
      Entregados: delivered,
      Abiertos: opened,
      Clics: clicks,
      Rebotados: bounced,
      Spam: spam,
    }
  })

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Resultados de campañas (últimas 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="#166534"
              fontSize={11}
              fontWeight={600}
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: "#166534" }}
            />
            <YAxis stroke="#166534" fontSize={12} tick={{ fill: "#166534" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar dataKey="Enviados" fill="#1e40af" name="Enviados" />
            <Bar dataKey="Entregados" fill="#2563eb" name="Entregados" />
            <Bar dataKey="Abiertos" fill="#10b981" name="Abiertos" />
            <Bar dataKey="Clics" fill="#8b5cf6" name="Clics" />
            <Bar dataKey="Rebotados" fill="#f59e0b" name="Rebotados" />
            <Bar dataKey="Spam" fill="#ef4444" name="Spam" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
