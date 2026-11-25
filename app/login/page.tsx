"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"
import { SocialIcons } from "@/components/social-icons"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        const next = new URLSearchParams(window.location.search).get("next")
        const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/portal-a"
        window.location.href = destination
      } else {
        const data = await response.json().catch(() => null)
        setError(data?.error || "Incorrect password")
        setLoading(false)
      }
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(75,131,18,0.14),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(141,239,7,0.12),transparent_45%)] bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            <img src="/logo_zentryx.png" alt="Data Zentryx" className="h-full w-full object-contain p-2" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Data Zentryx</h1>
            <p className="mt-1 text-sm uppercase tracking-[0.16em] text-muted-foreground">Email Marketing</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-[0_24px_60px_-30px_rgba(7,18,11,0.35)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <p className="text-center text-xs text-muted-foreground">Acceso privado · Email Marketing de Data Zentryx</p>
          <SocialIcons />
        </div>
      </div>
    </div>
  )
}
