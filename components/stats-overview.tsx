import { Card, CardContent } from "@/components/ui/card"
import { Mail, Send, Eye, MousePointerClick, AlertTriangle, ShieldAlert } from "lucide-react"

interface StatsOverviewProps {
  totalCampaigns: number
  totalSent: number
  openRate: string
  clickRate?: string
  bounceRate?: string
  spamRate?: string
}

export function StatsOverview({
  totalCampaigns,
  totalSent,
  openRate,
  clickRate = "0",
  bounceRate = "0",
  spamRate = "0",
}: StatsOverviewProps) {
  const stats = [
    {
      name: "Total de campañas",
      value: totalCampaigns.toLocaleString("es-ES"),
      icon: Mail,
      color: "text-lime-700",
      bgColor: "bg-lime-50",
    },
    {
      name: "Correos enviados",
      value: totalSent.toLocaleString("es-ES"),
      icon: Send,
      color: "text-green-700",
      bgColor: "bg-green-50",
    },
    {
      name: "Tasa de apertura",
      value: `${openRate}%`,
      icon: Eye,
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    {
      name: "Tasa de clics",
      value: `${clickRate}%`,
      icon: MousePointerClick,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "Rebotes",
      value: `${bounceRate}%`,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      name: "Spam",
      value: `${spamRate}%`,
      icon: ShieldAlert,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.name} className="border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.name}</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
