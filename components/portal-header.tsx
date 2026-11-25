"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings, BarChart3 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface PortalHeaderProps {
  portalName: string
  portalPath: string
  logoUrl?: string
}

export function PortalHeader({ portalName, portalPath, logoUrl }: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href={portalPath} className="flex items-center gap-3">
            {logoUrl ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 overflow-hidden">
                <img
                  src={logoUrl || "/logo_zentryx.png"}
                  alt={portalName}
                  className="h-full w-full object-contain p-1"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-foreground">{portalName}</h1>
              <p className="text-xs text-muted-foreground">Email Marketing de Data Zentryx</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={`${portalPath}/settings`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configuración</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
