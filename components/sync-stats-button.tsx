"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface SyncStatsButtonProps {
  campaignId: string
  autoSync?: boolean
  portal: "a" | "b"
}

export function SyncStatsButton({ campaignId, autoSync = false, portal }: SyncStatsButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSync = async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      const apiPath = portal === "a" ? "/api/portal-a/sync-stats" : "/api/portal-b/sync-stats"

      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })

      const data = await response.json()

      if (response.ok) {
        router.refresh()
      } else {
        if (!silent) alert("No se pudieron sincronizar las estadísticas de la campaña.")
      }
    } catch (error) {
      if (!silent) alert("No se pudieron sincronizar las estadísticas de la campaña.")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (autoSync) {
      handleSync(true)
    }
  }, [campaignId, autoSync])

  return (
    <Button
      onClick={() => handleSync(false)}
      disabled={loading}
      variant="secondary"
      size="sm"
      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Sincronizando..." : "Actualizar estadísticas"}
    </Button>
  )
}
