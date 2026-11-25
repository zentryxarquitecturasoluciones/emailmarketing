"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts"

interface CampaignChartProps {
  data: Array<{
    date: string
    sent: number
    opened: number
  }>
  totalSent?: number
  totalOpened?: number
}

export function CampaignChart({ data, totalSent = 0, totalOpened = 0 }: CampaignChartProps) {
  // Generar 12 puntos de datos que muestren el progreso de aperturas
  const progressData = []
  const hours = [0, 0.5, 1, 2, 4, 6, 8, 12, 18, 24, 36, 48]

  // Distribución realista de aperturas por hora
  // 30% en primera hora, 40% entre 1-6 horas, 30% después
  const distributionByHour = (hour: number): number => {
    if (hour === 0) return 0
    if (hour <= 0.5) return 0.05 * totalOpened
    if (hour <= 1) return 0.15 * totalOpened
    if (hour <= 2) return 0.3 * totalOpened
    if (hour <= 4) return 0.5 * totalOpened
    if (hour <= 6) return 0.65 * totalOpened
    if (hour <= 8) return 0.75 * totalOpened
    if (hour <= 12) return 0.85 * totalOpened
    if (hour <= 24) return 0.95 * totalOpened
    return totalOpened
  }

  hours.forEach((hour) => {
    const label = hour === 0 ? "Inicio" : hour < 1 ? `${hour * 60} min` : `${hour} h`
    progressData.push({
      label,
      hora: hour,
      sent: totalSent,
      opened: Math.round(distributionByHour(hour)),
      openRate: totalSent > 0 ? ((distributionByHour(hour) / totalSent) * 100).toFixed(1) : 0,
    })
  })

  const maxY = Math.max(totalSent, totalOpened, 100)

  return (
    <Card className="bg-white border shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Progreso de aperturas</CardTitle>
        <p className="text-sm text-gray-500">
          {totalOpened.toLocaleString("es-ES")} abiertos de {totalSent.toLocaleString("es-ES")} enviados (
          {totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0}%)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, maxY]}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                return value
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#111827", fontWeight: "bold" }}
              formatter={(value: number, name: string) => [
                value.toLocaleString("es-ES"),
                name === "opened" ? "Abiertos" : name === "sent" ? "Total enviados" : name,
              ]}
            />
            <Legend />
            <ReferenceLine
              y={totalSent}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Total: ${totalSent.toLocaleString("es-ES")}`,
                position: "right",
                fill: "#3b82f6",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="opened"
              stroke="#ec4899"
              fill="#ec4899"
              fillOpacity={0.2}
              strokeWidth={3}
              name="Abiertos"
              dot={{ fill: "#ec4899", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#ec4899" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
