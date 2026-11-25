"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"

interface DownloadCampaignButtonProps {
  campaignId: string
  campaignName: string
  basePath: string
}

export function DownloadCampaignButton({ campaignId, campaignName, basePath }: DownloadCampaignButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async (type: "emails" | "stats") => {
    setIsLoading(true)
    try {
      const apiPath = basePath === "/nv" ? `/api/campaigns/download` : `/api/campaigns${basePath}/download`

      const response = await fetch(`${apiPath}?campaignId=${campaignId}&type=${type}`)

      if (!response.ok) throw new Error("La descarga no se pudo completar.")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${campaignName.replace(/\s+/g, "_")}_${type}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload("emails")}
        disabled={isLoading}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Lista de correos
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload("stats")}
        disabled={isLoading}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Estadísticas
      </Button>
    </div>
  )
}
