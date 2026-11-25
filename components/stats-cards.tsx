import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Send, Eye, MousePointerClick, AlertTriangle, ShieldAlert } from "lucide-react"

interface StatsCardsProps {
  totalCampaigns: number
  totalSent: number
  openRate: string
  clickRate: string
  bounceRate: string
  spamRate: string
}

export function StatsCards({ totalCampaigns, totalSent, openRate, clickRate, bounceRate, spamRate }: StatsCardsProps) {
  const stats = [
    {
      title: "Campañas",
      value: totalCampaigns.toLocaleString("es-ES"),
      icon: Mail,
      color: "text-lime-400",
      bgColor: "bg-lime-400/10",
    },
    {
      title: "Enviados",
      value: totalSent.toLocaleString("es-ES"),
      icon: Send,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      title: "Tasa de apertura",
      value: `${openRate}%`,
      icon: Eye,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
    {
      title: "Tasa de clics",
      value: `${clickRate}%`,
      icon: MousePointerClick,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      title: "Rebotes",
      value: `${bounceRate}%`,
      icon: AlertTriangle,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      title: "Spam",
      value: `${spamRate}%`,
      icon: ShieldAlert,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
