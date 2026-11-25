"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutTemplate, Home, Settings, CalendarDays } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const router = useRouter()

  const logoUrl = "/logo_zentryx.png"
  const appName = "Data Zentryx"

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm overflow-hidden">
                <img
                  src={logoUrl || "/placeholder.svg"}
                  alt={`${appName} logo`}
                  className="h-full w-full object-contain p-1"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{appName}</h1>
                <p className="text-xs text-gray-500">Email Marketing</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Panel
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Plantillas
              </Button>
            </Link>
            <Link href="/meetings">
              <Button variant="ghost" size="sm" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Registros
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Configuración
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
